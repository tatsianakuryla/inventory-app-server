import prisma from "../../shared/db/db.js";
import type { Request, Response } from "express";
import { INVENTORY_SELECTED } from "../shared/constants/constants.ts";
import type { InventoryCreateRequest } from "../shared/types/schemas.ts";
import { isPrismaForeignKeyError, isPrismaUniqueError } from "../../shared/typeguards/typeguards.ts";

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
      }
      return response.status(500).json({ error: "Internal Server Error" });
  };
}