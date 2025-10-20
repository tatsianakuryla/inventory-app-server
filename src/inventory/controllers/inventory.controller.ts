import prisma from "../../shared/db/db.ts";
import type { Request, Response } from "express";
import { INVENTORY_SELECTED } from "../shared/constants/constants.ts";
import type { InventoryCreateRequest, InventoryListQuery } from "../shared/types/schemas.ts";
import { isPrismaForeignKeyError, isPrismaUniqueError } from "../../shared/typeguards/typeguards.ts";
import { Prisma, Role } from "@prisma/client";
import { handleError } from "../../users/shared/helpers/helpers.ts";

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

  public static getInventories = async (
    request: Request,
    response: Response<{ }, { query: InventoryListQuery }>
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

}