import type { Request, Response, NextFunction } from "express";
import { buildUserContext } from "../helpers/helpers.ts";
import { InventoryAccessService } from "../../inventoryAccessService/inventoryAccessService.ts";
import type { InventoryParameters } from "../types/types.ts";

export function requireCanManageInventory() {
    return async function (request: Request<InventoryParameters>, response: Response, next: NextFunction) {
        try {
            const userContext = buildUserContext(request);
            const ok = await InventoryAccessService.canManageInventory(request.params.inventoryId, userContext);
            if (!ok) return response.status(403).json({ error: "Forbidden" });
            next();
        } catch {
            response.status(403).json({ error: "Forbidden" })
        }
    }
}