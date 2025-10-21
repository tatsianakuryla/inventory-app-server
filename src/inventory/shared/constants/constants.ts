import { Prisma } from '@prisma/client';

export const INVENTORY_SELECTED = {
  id: true, name: true, description: true, imageUrl: true, isPublic: true,
  ownerId: true, categoryId: true, createdAt: true, updatedAt: true, version: true,
} satisfies Prisma.InventorySelect;