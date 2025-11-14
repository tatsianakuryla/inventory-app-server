import type { Request, Response } from "express";
import prisma from "../../shared/db/db.ts";
import { handleError } from "../../users/shared/helpers/helpers.ts";
import { Role } from "@prisma/client";
import type {
  DiscussionIdParameters,
  DiscussionsQuery,
  DiscussionCreate,
} from "../shared/types/discussions.schemas.ts";
import type { InventoryParameters } from "../../inventory/shared/types/inventory.schemas.js";

export class DiscussionsController {
  public static getMany = async (request: Request, response: Response) => {
    try {
      const { inventoryId } = request.params as InventoryParameters;
      const query = response.locals.query as DiscussionsQuery | undefined;
      const { page = 1, perPage = 20, order = "desc" } = query ?? {};
      const finalPage = Math.max(1, page);
      const skip = (finalPage - 1) * perPage;
      const [items, total] = await prisma.$transaction([
        prisma.discussionPost.findMany({
          where: { inventoryId },
          select: {
            id: true,
            textMd: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { createdAt: order },
          skip,
          take: perPage,
        }),
        prisma.discussionPost.count({ where: { inventoryId } }),
      ]);
      const hasMore = skip + items.length < total;
      return response.json({
        items: items.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        })),
        total,
        page: finalPage,
        perPage,
        hasMore,
      });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static create = async (request: Request, response: Response) => {
    try {
      const { inventoryId } = request.params as InventoryParameters;
      const { textMd } = request.body as DiscussionCreate;
      const authorId = request.user.sub;
      const inventory = await prisma.inventory.findUnique({
        where: { id: inventoryId },
        select: { id: true },
      });
      if (!inventory) {
        return response.status(404).json({ message: "Inventory not found" });
      }
      const created = await prisma.discussionPost.create({
        data: {
          inventoryId,
          authorId,
          textMd,
        },
        select: {
          id: true,
          textMd: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      });
      return response.status(201).json({
        ...created,
        createdAt: created.createdAt.toISOString(),
      });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static remove = async (request: Request, response: Response) => {
    try {
      const { discussionId } = request.params as DiscussionIdParameters;
      const userId = request.user.sub;
      const userRole = request.user.role;
      const post = await prisma.discussionPost.findUnique({
        where: { id: discussionId },
        select: { authorId: true },
      });
      if (!post) {
        return response.status(404).json({ message: "Discussion post not found" });
      }
      const isAuthor = post.authorId === userId;
      const isAdmin = userRole === Role.ADMIN;
      if (!isAuthor && !isAdmin) {
        return response.status(403).json({ message: "Forbidden" });
      }
      await prisma.discussionPost.delete({
        where: { id: discussionId },
      });
      return response.status(204).end();
    } catch (error) {
      return handleError(error, response);
    }
  };
}
