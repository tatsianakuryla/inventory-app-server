import prisma from "../../shared/db/db.ts";
import { Role, InventoryRole } from "@prisma/client";
import { isActionAllowed } from "../shared/permissions/permissions.ts";
import type { UserContext } from "../shared/types/schemas.ts";

export class InventoryAccessService {
  public static async getInventoryRole(
    inventoryId: string,
    user?: UserContext,
  ): Promise<InventoryRole> {
    if (!user || !user.id) return InventoryRole.VIEWER;
    if (user.role === Role.ADMIN) return InventoryRole.OWNER;
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: {
        ownerId: true,
        isPublic: true,
        access: { where: { userId: user.id }, select: { inventoryRole: true } },
      },
    });
    if (!inventory) throw new Error("Inventory not found");
    if (user.id === inventory.ownerId) return InventoryRole.OWNER;
    const userAccessRole = inventory.access.at(0)?.inventoryRole;
    if (userAccessRole) return userAccessRole;
    if (inventory.isPublic) return InventoryRole.EDITOR;
    return InventoryRole.VIEWER;
  }

  public static async canUserEditItems(inventoryId: string, user?: UserContext): Promise<boolean> {
    const role = await this.getInventoryRole(inventoryId, user);
    return isActionAllowed(role, "write");
  }

  public static async canManageInventory(
    inventoryId: string,
    user?: UserContext,
  ): Promise<boolean> {
    const role = await this.getInventoryRole(inventoryId, user);
    return isActionAllowed(role, "delete");
  }
}
