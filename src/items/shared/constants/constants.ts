import { Prisma } from "@prisma/client";

export const ITEM_SELECTED = {
  id: true,
  inventoryId: true,
  customId: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  createdById: true,
  text1: true,
  text2: true,
  text3: true,
  long1: true,
  long2: true,
  long3: true,
  num1: true,
  num2: true,
  num3: true,
  link1: true,
  link2: true,
  link3: true,
  bool1: true,
  bool2: true,
  bool3: true,
  _count: { select: { likes: true } },
} satisfies Prisma.ItemSelect;

export type ItemSelectedRow = Prisma.ItemGetPayload<{
  select: typeof ITEM_SELECTED;
}>;
