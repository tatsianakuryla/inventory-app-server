import type { Request, Response, NextFunction } from "express";
import { InventoryAccessService } from "../inventoryAccessService/inventoryAccessService.ts";
import type { UserContext } from "../types/types.ts";
import { Role } from '@prisma/client';

type InventoryParams = { inventoryId: string };

function buildUserContext(request: Request): UserContext {
  if (!request.user) return undefined;
  const role = request.user.role ?? Role.USER;
  return { id: request.user.sub, role };
}

export function requireCanEditItems() {
  return async function (request: Request<InventoryParams>, response: Response, next: NextFunction) {
    try {
      const userContext = buildUserContext(request);
      const ok = await InventoryAccessService.canUserEditItems(request.params.inventoryId, userContext);
      if (!ok) return response.status(403).json({ error: "Forbidden" });
      next();
    } catch {
      response.status(403).json({ error: "Forbidden" });
    }
  }
}