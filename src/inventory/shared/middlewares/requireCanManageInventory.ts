import type { Request, Response, NextFunction } from "express";
import { InventoryAccessService } from "../../inventoryAccessService/inventoryAccessService.ts";
import { buildUserContext } from "../helpers/helpers.ts";
import type { InventoryParameters } from "../types/schemas.ts";

export async function requireCanManageInventory (request: Request<InventoryParameters>, response: Response, next: NextFunction) {
  try {
    const userContext = buildUserContext(request);
    const ok = await InventoryAccessService.canManageInventory(request.params.inventoryId, userContext);
    if (!ok) return response.status(403).json({ error: "Forbidden" });
    next();
  } catch {
    response.status(403).json({ error: "Forbidden" })
  }
}