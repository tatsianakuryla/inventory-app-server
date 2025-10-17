import { INVENTORY_PERMISSIONS } from "../permissions/permissions.ts";

export type InventoryRoleKey = keyof typeof INVENTORY_PERMISSIONS;
export type InventoryAction = keyof ((typeof INVENTORY_PERMISSIONS)[InventoryRoleKey]);