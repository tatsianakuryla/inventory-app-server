import type { Request, Response } from "express";
import prisma from "../../shared/db/db.ts";
import { handleError } from "../../users/shared/helpers/helpers.ts";
import { isPrismaUniqueError } from "../../shared/typeguards/typeguards.ts";
import type {
  UpdateInventoryTagsRequest,
  TagsQuery,
  PopularTagsQuery,
  TagCreate,
} from "../shared/types/tags.schemas.ts";
import type {InventoryParameters} from "../../inventory/shared/types/inventory.schemas.ts";

export class TagsController {
  public static getAll = async (_request: Request, response: Response) => {
    try {
      const query = response.locals.query as TagsQuery | undefined;
      const { search = "", limit = 50 } = query ?? {};
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

  public static getPopular = async (_request: Request, response: Response) => {
    try {
      const query = response.locals.query as PopularTagsQuery | undefined;
      const { limit = 10 } = query ?? {};
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
      const { name } = request.body as TagCreate;
      const created = await prisma.tag.create({
        data: { name },
      });
      return response.status(201).json(created);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        return response.status(409).json({ message: "Tag with this name already exists" });
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
      const { tagNames } = request.body as UpdateInventoryTagsRequest;
      
      await prisma.$transaction(async (tx) => {
        await tx.inventoryTag.deleteMany({
          where: { inventoryId },
        });
        
        if (tagNames.length > 0) {
          const tagIds: number[] = [];
          for (const tagName of tagNames) {
            const trimmedName = tagName.trim();
            let tag = await tx.tag.findFirst({
              where: { name: { equals: trimmedName, mode: "insensitive" } },
            });
            if (!tag) {
              tag = await tx.tag.create({
                data: { name: trimmedName },
              });
            }
            
            tagIds.push(tag.id);
          }

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
