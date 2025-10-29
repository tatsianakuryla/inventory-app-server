import type { Request, Response, NextFunction } from "express";
import type { InventoryParameters } from "../../../inventory/shared/types/schemas.ts";
import { buildUserContext } from "../../../inventory/shared/helpers/helpers.ts";
import { InventoryAccessService } from "../../../inventory/inventoryAccessService/inventoryAccessService.ts";

export async function requireCanEditItems(
  request: Request<InventoryParameters>,
  response: Response,
  next: NextFunction,
) {
  try {
    const userContext = buildUserContext(request);
    const ok = await InventoryAccessService.canUserEditItems(
      request.params.inventoryId,
      userContext,
    );
    if (!ok) return response.status(403).json({ message: "Forbidden" });
    next();
  } catch {
    response.status(403).json({ message: "Forbidden" });
  }
}
