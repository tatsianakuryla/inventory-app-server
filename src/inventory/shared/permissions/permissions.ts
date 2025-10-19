export const INVENTORY_PERMISSIONS = {
  VIEWER: { read: true, write: false, delete: false },
  EDITOR: { read: true, write: true,  delete: false },
  OWNER:  { read: true, write: true,  delete: true  },
} as const;

export type InventoryRoleKey = keyof typeof INVENTORY_PERMISSIONS;
export type InventoryAction = keyof (typeof INVENTORY_PERMISSIONS)[InventoryRoleKey];

export const isActionAllowed = (role: InventoryRoleKey, action: InventoryAction) =>
  INVENTORY_PERMISSIONS[role][action];