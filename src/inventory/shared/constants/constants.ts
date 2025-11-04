import { Prisma } from "@prisma/client";

export const INVENTORY_SELECTED = {
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  isPublic: true,
  ownerId: true,
  owner: {
    select: {
      name: true,
    },
  },
  categoryId: true,
  createdAt: true,
  updatedAt: true,
  version: true,
} satisfies Prisma.InventorySelect;

export type InventorySelectedRow = Prisma.InventoryGetPayload<{
  select: typeof INVENTORY_SELECTED;
}>;
