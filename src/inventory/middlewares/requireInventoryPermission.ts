import type { Request, Response, NextFunction } from "express";
import type {InventoryAction} from "../types/types.ts";

export async function requireInventoryPermission(action: InventoryAction) {
  return async (request: Request, response: Response, next: NextFunction) => {
      const inventoryId = request.params.inventoryId;

  }
}