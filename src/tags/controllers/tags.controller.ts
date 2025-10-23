import type { Request, Response } from "express";
import prisma from "../../shared/db/db.ts";
import { handleError } from "../../users/shared/helpers/helpers.ts";
import { isPrismaUniqueError } from "../../shared/typeguards/typeguards.ts";
import type {
  InventoryParameters,
  UpdateInventoryTagsRequest,
} from "../shared/types/schemas.ts";

export class TagsController {
  public static getAll = async (request: Request, response: Response) => {
    try {
      const { search = "", limit = 50 } = response.locals.query ?? {};
      const where = search ? { name: { contains: search, mode: "insensitive" as const } } : {};
      const tags = await prisma.tag.findMany({
        where,
        orderBy: { name: "asc" },
        take: limit,
      });
      return response.json({ items: tags });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static getPopular = async (request: Request, response: Response) => {
    try {
      const { limit = 10 } = response.locals.query ?? {};
      const tags = await prisma.tag.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: { inventories: true },
          },
        },
        orderBy: {
          inventories: { _count: "desc" },
        },
        take: limit,
      });
      const items = tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        usageCount: tag._count.inventories,
      }));
      return response.json({ items });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static create = async (request: Request, response: Response) => {
    try {
      const { name } = request.body;
      const created = await prisma.tag.create({
        data: { name },
      });
      return response.status(201).json(created);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        return response.status(409).json({ error: "Tag with this name already exists" });
      }
      return handleError(error, response);
    }
  };

  public static getInventoryTags = async (request: Request, response: Response) => {
    try {
      const { inventoryId } = request.params as InventoryParameters;
      const tags = await prisma.inventoryTag.findMany({
        where: { inventoryId },
        select: {
          tag: {
            select: { id: true, name: true },
          },
        },
      });
      const items = tags.map((tag) => tag.tag);
      return response.json({ items });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static updateInventoryTags = async (request: Request, response: Response) => {
    try {
      const { inventoryId } = request.params as InventoryParameters;
      const { tagIds } = request.body as UpdateInventoryTagsRequest;
      await prisma.$transaction(async (tx) => {
        await tx.inventoryTag.deleteMany({
          where: { inventoryId },
        });
        if (tagIds.length > 0) {
          await tx.inventoryTag.createMany({
            data: tagIds.map((tagId) => ({ inventoryId, tagId })),
            skipDuplicates: true,
          });
        }
      });
      const updated = await prisma.inventoryTag.findMany({
        where: { inventoryId },
        select: {
          tag: {
            select: { id: true, name: true },
          },
        },
      });
      const items = updated.map((tag) => tag.tag);
      return response.json({ items });
    } catch (error) {
      return handleError(error, response);
    }
  };
}
