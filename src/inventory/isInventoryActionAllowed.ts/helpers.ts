import { type InventoryAction, type InventoryRoleKey } from "../types/types.ts";
import { INVENTORY_PERMISSIONS } from "../permissions/permissions.ts"

export function isInventoryActionAllowed(role: InventoryRoleKey, action: InventoryAction): boolean {
  return INVENTORY_PERMISSIONS[role][action];
}