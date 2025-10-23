import type { Request, Response } from "express";
import prisma from "../../shared/db/db.ts";
import { handleError } from "../../users/shared/helpers/helpers.ts";
import { isPrismaUniqueError } from "../../shared/typeguards/typeguards.ts";
import type { CategoryParameters } from "../shared/types/schemas.ts";

export class CategoryController {
  public static getAll = async (request: Request, response: Response) => {
    try {
      const {
        search = "",
        page = 1,
        perPage = 20,
        sortBy = "name",
        order = "asc",
      } = response.locals.query ?? {};
      const finalPage = Math.max(1, Number(page) || 1);
      const take = Math.max(1, Number(perPage) || 20);
      const skip = (finalPage - 1) * take;
      const safeOrder: "asc" | "desc" = order === "asc" ? "asc" : "desc";
      const where = search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {};
      const [items, total] = await prisma.$transaction([
        prisma.category.findMany({
          where,
          orderBy: { [sortBy]: safeOrder },
          skip,
          take,
        }),
        prisma.category.count({ where }),
      ]);
      const hasMore = skip + items.length < total;
      return response.json({ items, total, page: finalPage, perPage: take, hasMore });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static getStats = async (request: Request, response: Response) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          _count: {
            select: { inventories: true },
          },
        },
      });
      const items = categories.map((category) => ({
        id: category.id,
        name: category.name,
        inventoriesCount: category._count.inventories,
      }));
      return response.json({ items });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static create = async (request: Request, response: Response) => {
    try {
      const { name } = request.body;
      const created = await prisma.category.create({
        data: { name },
      });
      return response.status(201).json(created);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        return response.status(409).json({ error: "Category with this name already exists" });
      }
      return handleError(error, response);
    }
  };

  public static update = async (request: Request, response: Response) => {
    try {
      const { categoryId } = request.params as unknown as CategoryParameters;
      const { name } = request.body;
      const updated = await prisma.category.update({
        where: { id: categoryId },
        data: { name },
      });
      return response.json(updated);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        return response.status(409).json({ error: "Category with this name already exists" });
      }
      return handleError(error, response);
    }
  };

  public static remove = async (request: Request, response: Response) => {
    try {
      const { categoryId } = request.params as unknown as CategoryParameters;
      const count = await prisma.inventory.count({
        where: { categoryId },
      });
      if (count > 0) {
        return response.status(409).json({
          error: `Cannot delete category. ${count} inventor${count === 1 ? "y" : "ies"} still use this category.`,
          inventoriesCount: count,
        });
      }
      await prisma.category.delete({
        where: { id: categoryId },
      });
      return response.status(204).end();
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static removeWithUncategorize = async (request: Request, response: Response) => {
    try {
      const { categoryId } = request.params as unknown as CategoryParameters;
      await prisma.$transaction(async (tx) => {
        await tx.inventory.updateMany({
          where: { categoryId },
          data: { categoryId: null },
        });
        await tx.category.delete({
          where: { id: categoryId },
        });
      });
      return response.status(204).end();
    } catch (error) {
      return handleError(error, response);
    }
  };
}
