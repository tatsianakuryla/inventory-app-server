import prisma, { DEFAULT_ID_SCHEMA } from "../../shared/db/db.ts";
import type { Request, Response } from "express";
import {INVENTORY_SELECTED, type InventorySelectedRow} from "../shared/constants/constants.ts";
import type {
  InventoryCreateRequest,
  InventoryParameters,
  DeleteInventoriesBody,
  InventoryToDelete,
  InventoryAccessEntry,
  UpsertAccessBody,
  RevokeAccessBody,
  UpdateInventoryFieldsBody,
  InventoryIdFormatUpdateBody,
} from "../shared/types/inventory.schemas.ts";
import type { InventoryListQuery } from "../shared/types/inventory.schemas.ts";
import {
  isPrismaForeignKeyError,
  isPrismaUniqueError,
  isPrismaVersionConflictError,
} from "../../shared/typeguards/typeguards.ts";
import { Prisma, Role, InventoryRole } from "@prisma/client";
import { handleError } from "../../users/shared/helpers/helpers.ts";
import type { Payload } from "../../users/controllers/types/controllers.types.ts";
import {
  isFieldKey,
  type WritableFields,
  type WritableKey,
} from "../shared/typeguards/typeguards.ts";
import { VERSION_CONFLICT_ERROR_MESSAGE } from "../../shared/constants/constants.ts";
import { BACKEND_ERRORS } from "../../shared/constants/constants.ts";

export class InventoryController {
  public static create = async (
    request: Request<Record<string, never>, Record<string, never>, InventoryCreateRequest>,
    response: Response,
  ) => {
    try {
      const { name, description, isPublic, imageUrl, categoryId } = request.body;
      const ownerId = request.user?.sub;
      if (!ownerId) return response.status(401).json({ message: BACKEND_ERRORS.UNAUTHORIZED });
      const data = {
        name,
        isPublic,
        ownerId,
        InventoryIdFormat: {
          create: { schema: DEFAULT_ID_SCHEMA },
        },
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(categoryId !== undefined && { categoryId }),
      };
      const created = await prisma.inventory.create({
        data,
        select: INVENTORY_SELECTED,
      });
      return response.status(201).json(created);
    } catch (error: unknown) {
      if (isPrismaUniqueError(error)) {
        return response.status(409).json({ message: BACKEND_ERRORS.RESOURCE_ALREADY_EXISTS });
      }
      if (isPrismaForeignKeyError(error)) {
        return response.status(400).json({ message: BACKEND_ERRORS.INVALID_INPUT });
      }
      return handleError(error, response);
    }
  };

  public static getAll = async (_request: Request, response: Response) => {
    try {
      const query = response.locals.query as InventoryListQuery;
      const { search = "", page = 1, perPage = 20, sortBy = "createdAt", order = "desc" } = query;
      const finalPage = Math.max(1, page);
      const skip = (finalPage - 1) * perPage;
      let items, total;
      if (search?.trim()) {
        const tsquery = search.trim().split(/\s+/).filter(Boolean).join(" & ");
        items = await prisma.$queryRaw<InventorySelectedRow[]>`
          SELECT 
            i.id, i.name, i.description, i."imageUrl", i."isPublic", i."ownerId",
            i."categoryId", i."createdAt", i."updatedAt", i.version,
            json_build_object('name', u.name) as owner
          FROM "Inventory" i
          LEFT JOIN "User" u ON i."ownerId" = u.id
          WHERE i."searchVector" @@ to_tsquery('english', ${tsquery})
          ORDER BY 
            ts_rank(i."searchVector", to_tsquery('english', ${tsquery})) DESC,
            i."createdAt" DESC
          LIMIT ${perPage} OFFSET ${skip}
        `;
        const [{ count }] = await prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count
          FROM "Inventory"
          WHERE "searchVector" @@ to_tsquery('english', ${tsquery})
        `;
        total = Number(count);
      } else {
        const where: Prisma.InventoryWhereInput = {};
        [items, total] = await prisma.$transaction([
          prisma.inventory.findMany({
            where,
            skip,
            take: perPage,
            orderBy: { [sortBy]: order },
            select: INVENTORY_SELECTED,
          }),
          prisma.inventory.count({ where }),
        ]);
      }

      const hasMore = skip + items.length < total;
      return response.json({ items, total, page: finalPage, perPage, hasMore });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static getMyWriteAccessInventories = async (request: Request, response: Response) => {
    try {
      const userId = request.user?.sub;
      if (!userId) return response.status(401).json({ message: BACKEND_ERRORS.UNAUTHORIZED });
      const query = response.locals.query as InventoryListQuery;
      const { page = 1, perPage = 20, sortBy = "createdAt", order = "desc" } = query;
      const finalPage = Math.max(1, page);
      const skip = (finalPage - 1) * perPage;
      const inventoryAccesses = await prisma.inventoryAccess.findMany({
        where: {
          userId,
          inventoryRole: { in: [InventoryRole.EDITOR, InventoryRole.OWNER] },
        },
        include: {
          inventory: {
            select: INVENTORY_SELECTED,
          },
        },
      });
      const allItems = inventoryAccesses
        .filter((access) => access.inventory.ownerId !== userId)
        .map((access) => access.inventory);
      const total = allItems.length;
      const items = allItems.slice(skip, skip + perPage);
      const hasMore = skip + items.length < total;
      return response.json({ items, total, page: finalPage, perPage, hasMore });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static getOne = async (request: Request<InventoryParameters>, response: Response) => {
    const inventory = await prisma.inventory.findUnique({
      where: { id: request.params.inventoryId },
      select: {
        ...INVENTORY_SELECTED,
        isPublic: true,
        ownerId: true,
        fields: true,
        InventoryIdFormat: true,
      },
    });
    if (!inventory) return response.status(404).json({ message: BACKEND_ERRORS.RESOURCE_NOT_FOUND });
    return response.json(inventory);
  };

  public static update = async (request: Request<InventoryParameters>, response: Response) => {
    try {
      const body = request.body as {
        version: number;
        name?: string;
        description?: string | null;
        isPublic?: boolean;
        imageUrl?: string | null;
        categoryId?: number | null;
      };
      const { version, name, description, isPublic, imageUrl, categoryId } = body;
      const updated = await prisma.inventory.update({
        where: { id_version: { id: request.params.inventoryId, version } },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(isPublic !== undefined && { isPublic }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(categoryId !== undefined && { categoryId }),
          version: { increment: 1 },
        },
        select: INVENTORY_SELECTED,
      });
      return response.json(updated);
    } catch (error: unknown) {
      if (isPrismaVersionConflictError(error))
        return response.status(409).json({ message: BACKEND_ERRORS.VERSION_CONFLICT });
      if (isPrismaForeignKeyError(error))
        return response.status(400).json({ message: BACKEND_ERRORS.INVALID_INPUT });
      return handleError(error, response);
    }
  };

  public static removeMany = async (
    request: Request<Record<string, never>, Record<string, never>, DeleteInventoriesBody>,
    response: Response,
  ) => {
    try {
      const me = request.user;
      const isAdmin = me?.role === Role.ADMIN;
      const inventories = request.body.inventories;
      let allowed = inventories;
      if (!isAdmin) allowed = await this.getAllowedToRemove(inventories, me);
      const deleteOperations = allowed.map(({ id, version }) =>
        prisma.inventory.deleteMany({ where: { id, version } }),
      );
      const results = deleteOperations.length ? await prisma.$transaction(deleteOperations) : [];
      return response.json(this.filterDeletedSkippedIds(results, allowed, inventories));
    } catch (error) {
      return handleError(error, response);
    }
  };

  private static async getAllowedToRemove(inventories: InventoryToDelete[], me: Payload) {
    const ids = inventories.map((inventory) => inventory.id);
    const owners = await prisma.inventory.findMany({
      where: { id: { in: ids } },
      select: { id: true, ownerId: true },
    });
    const ownerSet = new Set(
      owners.filter((owner) => owner.ownerId === me.sub).map((owner) => owner.id),
    );
    return inventories.filter((inventory) => ownerSet.has(inventory.id));
  }

  private static filterDeletedSkippedIds(
    results: Prisma.BatchPayload[],
    inventories: InventoryToDelete[],
    allowed: InventoryToDelete[],
  ) {
    const deletedIds: string[] = [];
    const conflictIds: string[] = [];
    results.forEach((result, index) => {
      (result.count === 1 ? deletedIds : conflictIds).push(allowed[index]!.id);
    });
    const preSkippedIds = inventories
      .map((inventory) => inventory.id)
      .filter((id) => !allowed.some((item) => item.id === id));
    return {
      deleted: deletedIds.length,
      deletedIds,
      conflicts: conflictIds.length,
      conflictIds,
      skipped: preSkippedIds.length,
      skippedIds: preSkippedIds,
    };
  }

  public static getAccessData = async (
    request: Request<InventoryParameters>,
    response: Response,
  ) => {
    try {
      const accessData = await prisma.inventoryAccess.findMany({
        where: { inventoryId: request.params.inventoryId },
        select: {
          userId: true,
          inventoryRole: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { inventoryRole: "asc" },
      });
      return response.json(accessData);
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static updateInventoryAccess = async (
    request: Request<InventoryParameters, Record<string, never>, UpsertAccessBody>,
    response: Response,
  ) => {
    const { accesses } = request.body;
    const inventoryId = request.params.inventoryId;
    try {
      const [inventory, currentAccess] = await prisma.$transaction([
        prisma.inventory.findUnique({
          where: { id: inventoryId },
          select: { ownerId: true },
        }),
        prisma.inventoryAccess.findMany({
          where: { inventoryId },
          select: { userId: true, inventoryRole: true },
        }),
      ]);
      if (!inventory) return response.status(404).json({ message: "Inventory not found" });
      const { toCreate, toUpdate, unchanged, skippedInvalidOwnerUserIds } =
        this.partitionAccessChanges(accesses, inventory.ownerId, currentAccess);
      if (toCreate.length + toUpdate.length > 0) {
        await prisma.$transaction([
          ...toCreate.map((item) =>
            prisma.inventoryAccess.upsert({
              where: { inventoryId_userId: { inventoryId, userId: item.userId } },
              create: { inventoryId, userId: item.userId, inventoryRole: item.inventoryRole },
              update: { inventoryRole: item.inventoryRole },
            }),
          ),
          ...toUpdate.map((item) =>
            prisma.inventoryAccess.upsert({
              where: { inventoryId_userId: { inventoryId, userId: item.userId } },
              create: { inventoryId, userId: item.userId, inventoryRole: item.inventoryRole },
              update: { inventoryRole: item.inventoryRole },
            }),
          ),
        ]);
      }
      return response.json({
        processed: accesses.length,
        created: toCreate.length,
        createdUserIds: toCreate.map((i) => i.userId),
        updated: toUpdate.length,
        updatedUserIds: toUpdate.map((i) => i.userId),
        unchanged: unchanged.length,
        unchangedUserIds: unchanged.map((i) => i.userId),
        skipped: skippedInvalidOwnerUserIds.length,
        skippedInvalidOwnerUserIds,
      });
    } catch (error) {
      return handleError(error, response);
    }
  };

  private static partitionAccessChanges(
    accesses: InventoryAccessEntry[],
    ownerId: string,
    currentAccess: InventoryAccessEntry[],
  ) {
    const skippedInvalidOwnerUserIds = accesses
      .filter((access) => access.inventoryRole === InventoryRole.OWNER && access.userId !== ownerId)
      .map((access) => access.userId);
    const valid = accesses.filter((access) => !skippedInvalidOwnerUserIds.includes(access.userId));
    const currentMap = new Map(
      currentAccess.map((access) => [access.userId, access.inventoryRole]),
    );
    const toCreate = valid.filter((access) => !currentMap.has(access.userId));
    const toUpdate = valid.filter((access) => {
      const previous = currentMap.get(access.userId);
      return previous !== undefined && previous !== access.inventoryRole;
    });
    const unchanged = valid.filter(
      (access) => currentMap.get(access.userId) === access.inventoryRole,
    );
    return { toCreate, toUpdate, unchanged, skippedInvalidOwnerUserIds };
  }

  public static deleteAccess = async (
    request: Request<InventoryParameters, Record<string, never>, RevokeAccessBody>,
    response: Response,
  ) => {
    try {
      const { inventoryId } = request.params;
      const { userIds } = request.body;
      const [inventory, currentAccess] = await prisma.$transaction([
        prisma.inventory.findUnique({
          where: { id: inventoryId },
          select: { ownerId: true },
        }),
        prisma.inventoryAccess.findMany({
          where: { inventoryId, userId: { in: userIds } },
          select: { userId: true },
        }),
      ]);
      if (!inventory) return response.status(404).json({ message: "Inventory not found" });
      const { toDeleteUserIds, skippedOwnerUserIds, notFoundUserIds } = this.partitionRevokedAccess(
        currentAccess,
        userIds,
        inventory.ownerId,
      );
      let deleted = 0;
      if (toDeleteUserIds.length) {
        const result = await prisma.inventoryAccess.deleteMany({
          where: { inventoryId, userId: { in: toDeleteUserIds } },
        });
        deleted = result.count;
      }
      return response.json({
        deleted,
        deletedUserIds: toDeleteUserIds,
        skipped: skippedOwnerUserIds.length,
        skippedOwnerUserIds,
        notFound: notFoundUserIds.length,
        notFoundUserIds,
      });
    } catch (error) {
      return handleError(error, response);
    }
  };

  private static partitionRevokedAccess(
    currentAccess: { userId: string }[],
    userIds: string[],
    ownerId: string,
  ) {
    const existingSet = new Set(currentAccess.map((access) => access.userId));
    const skippedOwnerUserIds = userIds.filter((id) => id === ownerId);
    const allowedIds = userIds.filter((id) => id !== ownerId);
    const toDeleteUserIds = allowedIds.filter((id) => existingSet.has(id));
    const notFoundUserIds = allowedIds.filter((id) => !existingSet.has(id));
    return { toDeleteUserIds, skippedOwnerUserIds, notFoundUserIds };
  }

  public static updateInventoryFields = async (
    request: Request<InventoryParameters, Record<string, never>, UpdateInventoryFieldsBody>,
    response: Response,
  ) => {
    try {
      const { version, patch } = request.body;
      const { inventoryId } = request.params;
      const data = this.buildFieldsPatch(patch);
      if (Object.keys(data).length === 0) {
        return response.status(400).json({ message: BACKEND_ERRORS.INVALID_INPUT });
      }
      const saved = await this.persistInventoryFields(inventoryId, version, data);
      return response
        .status(saved.created ? 201 : 200)
        .json({ inventoryId: saved.inventoryId, version: saved.version });
    } catch (error: unknown) {
      if (isPrismaVersionConflictError(error)) {
        return response.status(409).json({ message: VERSION_CONFLICT_ERROR_MESSAGE });
      }
      return handleError(error, response);
    }
  };

  private static buildFieldsPatch(patch: Record<string, unknown>): Partial<WritableFields> {
    const data: Partial<WritableFields> = {};
    const entries = Object.entries(patch) as Array<[WritableKey, WritableFields[WritableKey]]>;
    for (const [key, value] of entries) {
      if (isFieldKey(key)) {
        (data as Record<WritableKey, WritableFields[WritableKey]>)[key] = value;
      }
    }
    return data;
  }

  private static async persistInventoryFields(
    inventoryId: string,
    version: number,
    data: Partial<WritableFields>,
  ): Promise<{ inventoryId: string; version: number; created: boolean }> {
    const exists = await prisma.inventoryFields.findUnique({ where: { inventoryId } });
    if (!exists) {
      const created = await prisma.inventoryFields.create({
        data: { inventoryId, ...data },
        select: { inventoryId: true, version: true },
      });
      return { ...created, created: true };
    }
    const result = await prisma.inventoryFields.updateMany({
      where: { inventoryId, version },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
    if (result.count !== 1) {
      throw new Error(VERSION_CONFLICT_ERROR_MESSAGE);
    }
    const final = await prisma.inventoryFields.findUnique({
      where: { inventoryId },
      select: { inventoryId: true, version: true },
    });
    return { ...(final as { inventoryId: string; version: number }), created: false };
  }

  public static updateIdFormat = async (
    request: Request<InventoryParameters, Record<string, never>, InventoryIdFormatUpdateBody>,
    response: Response,
  ) => {
    try {
      const { schema, version } = request.body;
      const { inventoryId } = request.params;
      const existing = await prisma.inventoryIdFormat.findUnique({ where: { inventoryId } });
      if (!existing) {
        const created = await prisma.inventoryIdFormat.create({
          data: { inventoryId, schema },
          select: { inventoryId: true, schema: true, version: true, updatedAt: true },
        });
        return response.status(201).json(created);
      }
      if (version === undefined) {
        const upd = await prisma.inventoryIdFormat.update({
          where: { inventoryId },
          data: { schema },
          select: { inventoryId: true, schema: true, version: true, updatedAt: true },
        });
        return response.json(upd);
      }
      const result = await prisma.inventoryIdFormat.updateMany({
        where: { inventoryId, version },
        data: { schema, version: { increment: 1 } },
      });
      if (result.count !== 1) {
        return response.status(409).json({ message: VERSION_CONFLICT_ERROR_MESSAGE });
      }
      const final = await prisma.inventoryIdFormat.findUnique({
        where: { inventoryId },
        select: { inventoryId: true, schema: true, version: true, updatedAt: true },
      });
      return response.json(final);
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static getStatistics = async (
    request: Request<InventoryParameters>,
    response: Response,
  ) => {
    try {
      const { inventoryId } = request.params;
      const inventory = await prisma.inventory.findUnique({
        where: { id: inventoryId },
        select: { id: true, isPublic: true, ownerId: true },
      });
      if (!inventory) {
        return response.status(404).json({ message: BACKEND_ERRORS.RESOURCE_NOT_FOUND });
      }
      const items = await prisma.item.findMany({
        where: { inventoryId },
        select: {
          text1: true,
          text2: true,
          text3: true,
          long1: true,
          long2: true,
          long3: true,
          num1: true,
          num2: true,
          num3: true,
          createdAt: true,
        },
      });
      const itemsCount = items.length;
      if (itemsCount === 0) {
        return response.json({
          itemsCount: 0,
          numericFields: {},
          textFields: {},
          firstItemCreatedAt: null,
          lastItemCreatedAt: null,
        });
      }
      const numericStats: Record<
        string,
        { avg: number | null; min: number | null; max: number | null; count: number }
      > = {};

      for (const field of ["num1", "num2", "num3"] as const) {
        const values = items.map((item) => item[field]).filter((value) => value !== null);
        if (values.length > 0) {
          const sum = values.reduce((acc, value) => acc + value, 0);
          numericStats[field] = {
            avg: sum / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length,
          };
        } else {
          numericStats[field] = {
            avg: null,
            min: null,
            max: null,
            count: 0,
          };
        }
      }
      const textStats: Record<string, Array<{ value: string; count: number }>> = {};
      for (const field of ["text1", "text2", "text3", "long1", "long2", "long3"] as const) {
        const values = items.map((item) => item[field]).filter((value) => value !== null);
        if (values.length > 0) {
          const frequency: Record<string, number> = {};
          values.forEach((val) => {
            frequency[val] = (frequency[val] || 0) + 1;
          });
          textStats[field] = Object.entries(frequency)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        } else {
          textStats[field] = [];
        }
      }
      const dates = items.map((item) => item.createdAt.getTime());
      const firstItemCreatedAt = new Date(Math.min(...dates)).toISOString();
      const lastItemCreatedAt = new Date(Math.max(...dates)).toISOString();
      return response.json({
        itemsCount,
        numericFields: numericStats,
        textFields: textStats,
        firstItemCreatedAt,
        lastItemCreatedAt,
      });
    } catch (error) {
      return handleError(error, response);
    }
  };
}
