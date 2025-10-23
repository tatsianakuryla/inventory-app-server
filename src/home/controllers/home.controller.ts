import prisma from "../../shared/db/db.ts";
import type { Request, Response } from "express";

export class HomeController {
  public static getLatest = async (request: Request, response: Response) => {
    const limit = Math.min(Number(request.query.limit) || 10, 50);
    const inventories = await prisma.inventory.findMany({
      where: {
        isPublic: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        categoryId: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });
    return response.json(inventories);
  };

  public static getPopular = async (request: Request, response: Response) => {
    const limit = Math.min(Number(request.query.limit) || 5, 20);
    const inventories = await prisma.inventory.findMany({
      where: {
        isPublic: true,
      },
      orderBy: {
        items: {
          _count: "desc",
        },
      },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        categoryId: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    return response.json(inventories);
  };

  public static getTagCloud = async (request: Request, response: Response) => {
    const limit = Math.min(Number(request.query.limit) || 50, 100);
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
  };
}
