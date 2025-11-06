import type { Request, Response } from "express";
import prisma from "../../shared/db/db.ts";
import { Prisma } from "@prisma/client";
import { handleError } from "../../users/shared/helpers/helpers.ts";
import type {
  ItemParameters,
  ItemListQuery,
  ItemCreateRequest,
  ItemUpdateRequest,
  DeleteItemsBody,
} from "../shared/types/items.schemas.ts";
import {
  isError,
  isPrismaForeignKeyError,
  isPrismaUniqueError,
  isPrismaVersionConflictError,
} from "../../shared/typeguards/typeguards.ts";
import { CustomIdService } from "../../inventory/customIdService/customIdService.ts";
import {ITEM_SELECTED, type ItemSelectedRow} from "../shared/constants/constants.ts";

export class ItemsController {
  public static getMany = async (request: Request, response: Response) => {
    try {
      const { inventoryId } = request.params as Pick<ItemParameters, "inventoryId">;
      const userId = request.user?.sub;
      const {
        search = "",
        page = 1,
        perPage = 20,
        sortBy = "createdAt",
        order = "desc",
      } = (response.locals.query ?? {}) as ItemListQuery;
      const finalPage = Math.max(1, Number(page) || 1);
      const take = Math.max(1, Number(perPage) || 20);
      const skip = (finalPage - 1) * take;
      const allowedSort = new Set(["createdAt", "updatedAt", "customId"]);
      const safeSortBy = allowedSort.has(sortBy) ? sortBy : "createdAt";
      const safeOrder: "asc" | "desc" = order === "asc" ? "asc" : "desc";
      let items, total;
      if (search?.trim()) {
        const query = search.trim();
        const orderByClause =
          safeSortBy === "createdAt"
            ? `"createdAt" ${safeOrder.toUpperCase()}`
            : safeSortBy === "updatedAt"
              ? `"updatedAt" ${safeOrder.toUpperCase()}`
              : `"customId" ${safeOrder.toUpperCase()}`;
        items = await prisma.$queryRaw<ItemSelectedRow[]>`
          SELECT 
            id, "customId", "inventoryId", "createdById", "createdAt", "updatedAt", version,
            text1, text2, text3, long1, long2, long3, 
            num1, num2, num3, link1, link2, link3,
            bool1, bool2, bool3
          FROM "Item"
          WHERE "inventoryId" = ${inventoryId}
            AND "searchVector" @@ websearch_to_tsquery('english', ${query})
          ORDER BY 
            ts_rank("searchVector", websearch_to_tsquery('english', ${query})) DESC,
            ${Prisma.raw(orderByClause)}
          LIMIT ${take} OFFSET ${skip}
        `;
        const [{ count }] = await prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count
          FROM "Item"
          WHERE "inventoryId" = ${inventoryId}
            AND "searchVector" @@ websearch_to_tsquery('english', ${query})
        `;
        total = Number(count);
      } else {
        const where: Prisma.ItemWhereInput = { inventoryId };
        [items, total] = await prisma.$transaction([
          prisma.item.findMany({
            where,
            select: ITEM_SELECTED,
            skip,
            take,
            orderBy: { [safeSortBy]: safeOrder },
          }),
          prisma.item.count({ where }),
        ]);
      }

      const itemsWithLikeStatus = await Promise.all(
        items.map(async (item) => {
          const isLiked = userId
            ? await prisma.itemLike.findUnique({
                where: { itemId_userId: { itemId: item.id, userId } },
              })
            : null;
          return { ...item, isLikedByCurrentUser: !!isLiked };
        })
      );

      const hasMore = skip + items.length < total;
      return response.json({ items: itemsWithLikeStatus, total, page: finalPage, perPage: take, hasMore });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static getOne = async (request: Request, response: Response) => {
    try {
      const { inventoryId, itemId } = request.params as ItemParameters;
      const userId = request.user?.sub;
      const item = await prisma.item.findFirst({
        where: { id: itemId, inventoryId },
        select: ITEM_SELECTED,
      });
      if (!item) return response.status(404).json({ message: "Not found" });

      // Add isLikedByCurrentUser flag
      const isLiked = userId
        ? await prisma.itemLike.findUnique({
            where: { itemId_userId: { itemId: item.id, userId } },
          })
        : null;

      return response.json({ ...item, isLikedByCurrentUser: !!isLiked });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static create = async (request: Request, response: Response) => {
    try {
      const { inventoryId } = request.params as Pick<ItemParameters, "inventoryId">;
      const body = request.body as ItemCreateRequest;
      const createdById = request.user.sub;
      const MAX_RETRIES = 3;
      for (let i = 0; i < MAX_RETRIES; i++) {
        try {
          const created = await prisma.$transaction(async (tx) => {
            const customId = await CustomIdService.generate(tx, inventoryId);
            return tx.item.create({
              data: {
                inventoryId,
                customId,
                createdById,
                text1: body.text1 ?? null,
                text2: body.text2 ?? null,
                text3: body.text3 ?? null,
                long1: body.long1 ?? null,
                long2: body.long2 ?? null,
                long3: body.long3 ?? null,
                num1: body.num1 ?? null,
                num2: body.num2 ?? null,
                num3: body.num3 ?? null,
                link1: body.link1 ?? null,
                link2: body.link2 ?? null,
                link3: body.link3 ?? null,
                bool1: body.bool1 ?? null,
                bool2: body.bool2 ?? null,
                bool3: body.bool3 ?? null,
              },
              select: ITEM_SELECTED,
            });
          });
          return response.status(201).json(created);
        } catch (error) {
          if (isError(error) && error.message.includes("exactly one SEQUENCE element")) {
            return response.status(400).json({ message: "Cannot create item: Custom ID format must contain exactly one SEQUENCE element. Please configure the ID format in inventory settings." });
          }
          if (isPrismaUniqueError(error) && i < MAX_RETRIES - 1) continue;
          return handleError(error, response);
        }
      }
    } catch (error) {
      if (isError(error) && error.message.includes("exactly one SEQUENCE element")) {
        return response.status(400).json({ message: "Cannot create item: Custom ID format must contain exactly one SEQUENCE element. Please configure the ID format in inventory settings." });
      }
      if (isPrismaUniqueError(error)) {
        return response.status(409).json({ message: "Duplicate customId in this inventory" });
      }
      if (isPrismaForeignKeyError(error)) {
        return response.status(400).json({ message: "Invalid inventoryId" });
      }
      return handleError(error, response);
    }
  };

  public static update = async (request: Request, response: Response) => {
    try {
      const { inventoryId, itemId } = request.params as ItemParameters;
      const body = request.body as ItemUpdateRequest;
      const { version, ...patch } = body;
      const updated = await prisma.item.update({
        where: { id_version: { id: itemId, version } },
        data: {
          ...(patch.customId !== undefined && { customId: patch.customId }), // <-- РАЗРЕШАЕМ
          ...(patch.text1 !== undefined && { text1: patch.text1 }),
          ...(patch.text2 !== undefined && { text2: patch.text2 }),
          ...(patch.text3 !== undefined && { text3: patch.text3 }),
          ...(patch.long1 !== undefined && { long1: patch.long1 }),
          ...(patch.long2 !== undefined && { long2: patch.long2 }),
          ...(patch.long3 !== undefined && { long3: patch.long3 }),
          ...(patch.num1 !== undefined && { num1: patch.num1 }),
          ...(patch.num2 !== undefined && { num2: patch.num2 }),
          ...(patch.num3 !== undefined && { num3: patch.num3 }),
          ...(patch.link1 !== undefined && { link1: patch.link1 }),
          ...(patch.link2 !== undefined && { link2: patch.link2 }),
          ...(patch.link3 !== undefined && { link3: patch.link3 }),
          ...(patch.bool1 !== undefined && { bool1: patch.bool1 }),
          ...(patch.bool2 !== undefined && { bool2: patch.bool2 }),
          ...(patch.bool3 !== undefined && { bool3: patch.bool3 }),
          version: { increment: 1 },
        },
        select: ITEM_SELECTED,
      });
      if (updated.inventoryId !== inventoryId) {
        return response.status(400).json({ message: "Inventory mismatch" });
      }
      return response.json(updated);
    } catch (error) {
      if (isPrismaVersionConflictError(error))
        return response.status(409).json({ message: "Version conflict" });
      if (isPrismaUniqueError(error))
        return response.status(409).json({ message: "Duplicate customId in this inventory" });
      return handleError(error, response);
    }
  };

  public static removeMany = async (request: Request, response: Response) => {
    try {
      const { inventoryId } = request.params as Pick<ItemParameters, "inventoryId">;
      const { items } = request.body as DeleteItemsBody;
      if (!items.length) {
        return response.json({
          deleted: 0, deletedIds: [],
          conflicts: 0, conflictIds: [],
          skipped: 0, skippedIds: [],
        });
      }
      const ids = items.map(i => i.id);
      const existingItems = await prisma.item.findMany({
        where: { id: { in: ids } },
        select: { id: true, inventoryId: true, version: true },
      });
      const existingById = new Map(existingItems.map((item) => [item.id, item]));
      const skippedIds: string[] = [];
      const candidates = items.filter(({ id }) => {
        const row = existingById.get(id);
        if (!row || row.inventoryId !== inventoryId) {
          skippedIds.push(id);
          return false;
        }
        return true;
      });

      const ops = candidates.map(({ id, version }) =>
        prisma.item.deleteMany({ where: { id, version, inventoryId } })
      );
      const results = ops.length ? await prisma.$transaction(ops) : [];
      const deletedIds: string[] = [];
      const conflictIds: string[] = [];
      results.forEach((result, index) => (result.count === 1 ? deletedIds : conflictIds).push(candidates[index]!.id));
      return response.json({
        deleted: deletedIds.length,
        deletedIds,
        conflicts: conflictIds.length,
        conflictIds,
        skipped: skippedIds.length,
        skippedIds,
      });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static like = async (request: Request, response: Response) => {
    try {
      const { itemId } = request.params as ItemParameters;
      const userId = request.user.sub;
      await prisma.itemLike.create({ data: { itemId, userId } });
      return response.status(204).end();
    } catch (error) {
      if (isPrismaUniqueError(error)) return response.status(409).json({ message: "Already liked" });
      return handleError(error, response);
    }
  };

  public static unlike = async (request: Request, response: Response) => {
    try {
      const { itemId } = request.params as ItemParameters;
      const userId = request.user.sub;
      await prisma.itemLike.delete({ where: { itemId_userId: { itemId, userId } } });
      return response.status(204).end();
    } catch (error) {
      return handleError(error, response);
    }
  };
}
