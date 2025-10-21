import prisma from "../../shared/db/db.ts";
import type { Request, Response } from "express";
import { INVENTORY_SELECTED} from "../shared/constants/constants.ts";
import {
  type InventoryCreateRequest,
  type InventoryListQuery,
  type InventoryParameters,
  type DeleteInventoriesBody,
  type InventoryToDelete,
  type InventoryAccessEntry,
  type UpsertAccessBody
} from "../shared/types/schemas.ts";
import {
  isPrismaForeignKeyError,
  isPrismaUniqueError,
  isPrismaVersionConflictError
} from "../../shared/typeguards/typeguards.ts";
import { Prisma, Role, InventoryRole } from "@prisma/client";
import { handleError } from "../../users/shared/helpers/helpers.ts";
import type { Payload } from "../../users/controllers/types/controllers.types.ts";

export class InventoryController {

  public static create = async (
    request: Request<{}, {}, InventoryCreateRequest>,
    response: Response
  ) => {
    try {
      const { name, description, isPublic, imageUrl, categoryId } = request.body;
      const ownerId = request.user?.sub;
      if (!ownerId) return response.status(401).json({ error: "Unauthorized" });
      const data = {
        name,
        isPublic,
        ownerId,
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
          return response.status(409).json({ error: "Inventory already exists" });
        }
        if (isPrismaForeignKeyError(error)) {
          return response.status(400).json({ error: "Invalid categoryId" });
        }
      return handleError(error, response);
      }
  }

  public static getAll = async (
    request: Request,
    response: Response<{}, { query: InventoryListQuery }>
  ) => {
      const {
        search = "",
        page = 1,
        perPage = 20,
        sortBy = "createdAt",
        order = "desc",
      } = response.locals.query;
      const finalPage = Math.max(1, page);
      const skip = (finalPage - 1) * perPage;
      const where = this.buildSearchWhere(request, search);
      const [items, total] = await prisma.$transaction([
        prisma.inventory.findMany({
          where,
          skip,
          take: perPage,
          orderBy: { [sortBy]: order },
          select: INVENTORY_SELECTED,
        }),
        prisma.inventory.count({ where }),
      ]);
      const hasMore = skip + items.length < total;
      return response.json({ items, total, page: finalPage, perPage, hasMore });
  }

  private static buildSearchWhere(request: Request, search: string): Prisma.InventoryWhereInput {
    const searchWhere: Prisma.InventoryWhereInput = search
      ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }
      : {};
    const me = request.user ? { id: request.user.sub, role: request.user.role } : undefined;
    const visibilityWhere: Prisma.InventoryWhereInput =
      me?.role === Role.ADMIN
        ? {}
        : me
          ? { OR: [
              { ownerId: me.id },
              { isPublic: true },
              { access: { some: { userId: me.id } } },
            ] }
          : { isPublic: true };
    return {
      AND: [searchWhere, visibilityWhere],
    };
  }

  public static getOne = async (request: Request<InventoryParameters>, response: Response) => {
    const me = request.user ? { id: request.user.sub, role: request.user.role } : undefined;
    const inventory = await prisma.inventory.findUnique({
      where: { id: request.params.inventoryId },
      select: {
        ...INVENTORY_SELECTED,
        isPublic: true,
        ownerId: true,
        access: { select: { userId: true } },
        fields: true,
        InventoryIdFormat: true,
      },
    });
    if (!inventory) return response.status(404).json({ error: "Not found" });
    const canView = me?.role === Role.ADMIN
      || inventory.isPublic
      || me?.id === inventory.ownerId
      || inventory.access.some((access) => access.userId === me?.id);
    if (!canView) return response.status(403).json({ error: "Forbidden" });
    const { access, ownerId, ...safe } = inventory;
    return response.json(safe);
  }

  public static update = async (request: Request<InventoryParameters>, response: Response) => {
    try {
      const { version, name, description, isPublic, imageUrl, categoryId } = request.body;
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
      if (isPrismaVersionConflictError(error)) return response.status(409).json({error: "Version conflict"});
      if (isPrismaForeignKeyError(error)) return response.status(400).json({error: "Invalid categoryId"});
      return handleError(error, response);
    }
  }

  public static removeMany = async (
    request: Request<{}, {}, DeleteInventoriesBody>,
    response: Response
  ) => {
    try {
      const me = request.user;
      const isAdmin = me?.role === Role.ADMIN;
      const inventories = request.body.inventories;
      let allowed = inventories;
      if (!isAdmin) allowed = await this.getAllowedToRemove(inventories, me);
      const deleteOperations = allowed.map(({ id, version }) =>
        prisma.inventory.deleteMany({ where: { id, version } })
      );
      const results = deleteOperations.length ? await prisma.$transaction(deleteOperations) : [];
      return response.json(this.filterDeletedSkippedIds(results, allowed, inventories));
    } catch (error) {
      return handleError(error, response);
    }
  }

  private static async getAllowedToRemove(inventories: InventoryToDelete[], me: Payload) {
    const ids = inventories.map((inventory) => inventory.id);
    const owners = await prisma.inventory.findMany({
      where: { id: { in: ids } },
      select: { id: true, ownerId: true },
    });
    const ownerSet = new Set(owners.filter((owner) => owner.ownerId === me.sub).map((owner) => owner.id));
    return inventories.filter((inventory) => ownerSet.has(inventory.id));
  }

  private static filterDeletedSkippedIds(results: Prisma.BatchPayload[], inventories: InventoryToDelete[], allowed: InventoryToDelete[], ) {
    const deletedIds: string[] = [];
    const conflictIds: string[] = [];
    results.forEach((result, index) => {
      (result.count === 1 ? deletedIds : conflictIds).push(allowed[index]!.id);
    });
    const preSkippedIds = inventories.map((inventory) => inventory.id).filter((id) => !allowed.some((item) => item.id === id));
    return {
      deleted: deletedIds.length,
      deletedIds,
      conflicts: conflictIds.length,
      conflictIds,
      skipped: preSkippedIds.length,
      skippedIds: preSkippedIds,
    }
  }

  public static getAccessData = async (request: Request<InventoryParameters>, response: Response) => {
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
  }

  public static updateInventoryAccess = async (
    request: Request<InventoryParameters, {}, UpsertAccessBody>,
    response: Response
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
      if (!inventory) return response.status(404).json({ error: "Inventory not found" });
      const { toCreate, toUpdate, unchanged, skippedInvalidOwnerUserIds } =
        this.partitionAccessChanges(accesses, inventory.ownerId, currentAccess);
      if (toCreate.length + toUpdate.length > 0) {
        await prisma.$transaction([
          ...toCreate.map((item) =>
            prisma.inventoryAccess.upsert({
              where: { inventoryId_userId: { inventoryId, userId: item.userId } },
              create: { inventoryId, userId: item.userId, inventoryRole: item.inventoryRole },
              update: { inventoryRole: item.inventoryRole },
            })
          ),
          ...toUpdate.map((item) =>
            prisma.inventoryAccess.upsert({
              where: { inventoryId_userId: { inventoryId, userId: item.userId } },
              create: { inventoryId, userId: item.userId, inventoryRole: item.inventoryRole },
              update: { inventoryRole: item.inventoryRole },
            })
          ),
        ]);
      }
      return response.json({
        processed: accesses.length,
        created: toCreate.length,
        createdUserIds: toCreate.map(i => i.userId),
        updated: toUpdate.length,
        updatedUserIds: toUpdate.map(i => i.userId),
        unchanged: unchanged.length,
        unchangedUserIds: unchanged.map(i => i.userId),
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
    const currentMap = new Map(currentAccess.map((access) => [access.userId, access.inventoryRole]));
    const toCreate = valid.filter((access) => !currentMap.has(access.userId));
    const toUpdate = valid.filter((access) => {
      const previous = currentMap.get(access.userId);
      return previous !== undefined && previous !== access.inventoryRole;
    });
    const unchanged = valid.filter((access) => currentMap.get(access.userId) === access.inventoryRole);
    return { toCreate, toUpdate, unchanged, skippedInvalidOwnerUserIds };
  }
}