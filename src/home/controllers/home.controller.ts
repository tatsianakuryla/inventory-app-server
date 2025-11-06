import prisma from "../../shared/db/db.ts";
import type { Request, Response } from "express";
import type {
  HomePopularQuery,
  HomeRecentQuery,
  TagCloudQuery,
} from "../shared/types/home.schemas.ts";
import { INVENTORY_SELECTED } from "../../inventory/shared/constants/constants.ts";
import { handleError } from "../../users/shared/helpers/helpers.ts";

export class HomeController {
  public static getPopular = async (_request: Request, response: Response) => {
    try {
      const query = response.locals.query as HomePopularQuery | undefined;
      const { limit = 5 } = query ?? {};
      const inventories = await prisma.inventory.findMany({
        select: {
          ...INVENTORY_SELECTED,
          _count: {
            select: { items: true },
          },
        },
        orderBy: {
          items: { _count: "desc" },
        },
        take: limit,
      });
      const items = inventories.map(({ _count, ...inventory }) => ({
        ...inventory,
        itemsCount: _count.items,
      }));
      return response.json({ items });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static getRecent = async (_request: Request, response: Response) => {
    try {
      const query = response.locals.query as HomeRecentQuery | undefined;
      const { limit = 5 } = query ?? {};
      const inventories = await prisma.inventory.findMany({
        select: {
          ...INVENTORY_SELECTED,
          _count: {
            select: { items: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });
      const items = inventories.map(({ _count, ...inventory }) => ({
        ...inventory,
        itemsCount: _count.items,
      }));
      return response.json({ items });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static getTagCloud = async (_request: Request, response: Response) => {
    try {
      const query = response.locals.query as TagCloudQuery | undefined;
      const { limit = 50 } = query ?? {};
      const tags = await prisma.tag.findMany({
        orderBy: {
          inventories: {
            _count: "desc",
          },
        },
        take: limit,
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              inventories: true,
            },
          },
        },
      });
      const tagCloud = tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        count: tag._count.inventories,
        weight: tag._count.inventories,
      }));
      return response.json(tagCloud);
    } catch (error) {
      return handleError(error, response);
    }
  };
}
