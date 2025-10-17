export const INVENTORY_PERMISSIONS = {
  VIEWER: { read: true, write: false, delete: false },
  EDITOR: { read: true, write: true,  delete: false },
  OWNER:  { read: true, write: true,  delete: true  },
} as const;