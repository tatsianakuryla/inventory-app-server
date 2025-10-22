import type { Request, Response } from "express";
import prisma from "../../shared/db/db.ts";
import { Prisma } from "@prisma/client";
import { handleError } from "../../users/shared/helpers/helpers.ts";
import type {
  ItemParameters,
  ItemListQuery,
  ItemCreateRequest,
  DeleteItemsBody
} from "../shared/types/schemas.ts";
import {
  isPrismaForeignKeyError,
  isPrismaUniqueError,
  isPrismaVersionConflictError
} from "../../shared/typeguards/typeguards.ts";
import { CustomIdService } from "../customIdService/customIdService.ts";
import { ITEM_SELECTED } from "../shared/constants/constants.ts";

export class ItemsController {
  public static getMany = async (request: Request, response: Response) => {
    try {
      const { inventoryId } = request.params as Pick<ItemParameters, "inventoryId">;
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
      const where: Prisma.ItemWhereInput = {
        inventoryId,
        ...(search
          ? {
            OR: [
              { customId: { contains: search, mode: "insensitive" } },
              { text1: { contains: search, mode: "insensitive" } },
              { text2: { contains: search, mode: "insensitive" } },
              { text3: { contains: search, mode: "insensitive" } },
              { long1: { contains: search, mode: "insensitive" } },
              { long2: { contains: search, mode: "insensitive" } },
              { long3: { contains: search, mode: "insensitive" } },
              { link1: { contains: search, mode: "insensitive" } },
              { link2: { contains: search, mode: "insensitive" } },
              { link3: { contains: search, mode: "insensitive" } },
            ],
          }
          : undefined),
      };
      const [items, total] = await prisma.$transaction([
        prisma.item.findMany({
          where,
          select: ITEM_SELECTED,
          skip,
          take,
          orderBy: { [safeSortBy]: safeOrder },
        }),
        prisma.item.count({ where }),
      ]);
      const hasMore = skip + items.length < total;
      return response.json({ items, total, page: finalPage, perPage: take, hasMore });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static getOne = async (request: Request, response: Response) => {
    try {
      const { inventoryId, itemId } = request.params as ItemParameters;
      const item = await prisma.item.findFirst({
        where: { id: itemId, inventoryId },
        select: ITEM_SELECTED,
      });
      if (!item) return response.status(404).json({ error: "Not found" });
      return response.json(item);
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static create = async (request: Request, response: Response) => {
    try {
      const { inventoryId } = request.params as Pick<ItemParameters, "inventoryId">;
      const body = request.body as ItemCreateRequest;
      const createdById = request.user!.sub;
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
                text1: body.text1 ?? null, text2: body.text2 ?? null, text3: body.text3 ?? null,
                long1: body.long1 ?? null, long2: body.long2 ?? null, long3: body.long3 ?? null,
                num1: body.num1 ?? null, num2: body.num2 ?? null, num3: body.num3 ?? null,
                link1: body.link1 ?? null, link2: body.link2 ?? null, link3: body.link3 ?? null,
                bool1: body.bool1 ?? null, bool2: body.bool2 ?? null, bool3: body.bool3 ?? null,
              },
              select: ITEM_SELECTED,
            });
          });
          return response.status(201).json(created);
        } catch (error) {
          if (isPrismaUniqueError(error) && i < MAX_RETRIES - 1) continue;
          throw error;
        }
      }
      return response.status(500).json({ error: "Failed to create item" });
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        return response.status(409).json({ error: "Duplicate customId in this inventory" });
      }
      if (isPrismaForeignKeyError(error)) {
        return response.status(400).json({ error: "Invalid inventoryId" });
      }
      return handleError(error, response);
    }
  };

  public static update = async (request: Request, response: Response) => {
    try {
      const { inventoryId, itemId } = request.params as ItemParameters;
      const { version, ...patch } = request.body;
      if (patch.customId !== undefined) {
        return response.status(400).json({ error: "customId is immutable" });
      }
      const updated = await prisma.item.update({
        where: { id_version: { id: itemId, version } },
        data: {
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
        return response.status(400).json({ error: "Inventory mismatch" });
      }
      return response.json(updated);
    } catch (error) {
      if (isPrismaVersionConflictError(error)) return response.status(409).json({ error: "Version conflict" });
      if (isPrismaUniqueError(error)) return response.status(409).json({ error: "Duplicate customId in this inventory" });
      return handleError(error, response);
    }
  };

  public static removeMany = async (request: Request, response: Response) => {
    try {
      const { inventoryId } = request.params as Pick<ItemParameters, "inventoryId">;
      const { items } = request.body as DeleteItemsBody;
      const ops = items.map(({ id, version }) =>
        prisma.item.deleteMany({ where: { id, version, inventoryId } })
      );
      const results = ops.length ? await prisma.$transaction(ops) : [];
      const deletedIds: string[] = [];
      const conflicts: string[] = [];
      results.forEach((r, i) => (r.count === 1 ? deletedIds : conflicts).push(items[i]!.id));
      return response.json({
        deleted: deletedIds.length,
        deletedIds,
        conflicts: conflicts.length,
        conflictIds: conflicts,
      });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static like = async (request: Request, response: Response) => {
    try {
      const { itemId } = request.params as ItemParameters;
      const userId = request.user!.sub;
      await prisma.itemLike.create({ data: { itemId, userId } });
      return response.status(204).end();
    } catch (error) {
      if (isPrismaUniqueError(error)) return response.status(409).json({ error: "Already liked" });
      return handleError(error, response);
    }
  };

  public static unlike = async (request: Request, response: Response) => {
    try {
      const { itemId } = request.params as ItemParameters;
      const userId = request.user!.sub;
      await prisma.itemLike.delete({ where: { itemId_userId: { itemId, userId } } });
      return response.status(204).end();
    } catch (error) {
      return handleError(error, response);
    }
  };
}
