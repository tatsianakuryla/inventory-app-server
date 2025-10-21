import { Prisma } from "@prisma/client";

export type WritableFields = Omit<
  Prisma.InventoryFieldsUncheckedCreateInput,
  "inventoryId" | "version"
>;

export type WritableKey = keyof WritableFields;

export const FIELD_KEYS = [
  "text1State","text1Name","text1Desc","text1ShowInTable",
  "text2State","text2Name","text2Desc","text2ShowInTable",
  "text3State","text3Name","text3Desc","text3ShowInTable",
  "long1State","long1Name","long1Desc","long1ShowInTable",
  "long2State","long2Name","long2Desc","long2ShowInTable",
  "long3State","long3Name","long3Desc","long3ShowInTable",
  "num1State","num1Name","num1Desc","num1ShowInTable",
  "num2State","num2Name","num2Desc","num2ShowInTable",
  "num3State","num3Name","num3Desc","num3ShowInTable",
  "link1State","link1Name","link1Desc","link1ShowInTable",
  "link2State","link2Name","link2Desc","link2ShowInTable",
  "link3State","link3Name","link3Desc","link3ShowInTable",
  "bool1State","bool1Name","bool1Desc","bool1ShowInTable",
  "bool2State","bool2Name","bool2Desc","bool2ShowInTable",
  "bool3State","bool3Name","bool3Desc","bool3ShowInTable",
  "displayOrder",
] as const satisfies readonly WritableKey[];

export const FIELD_WHITELIST = new Set<WritableKey>(FIELD_KEYS);
export const isFieldKey = (k: string): k is WritableKey =>
  FIELD_WHITELIST.has(k as WritableKey);