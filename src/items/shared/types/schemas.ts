import { z } from "zod";
import { IdSchema } from "../../../shared/types/types.ts";
import { Prisma, PrismaClient } from "@prisma/client";

export const ItemParametersSchema = z.object({
  inventoryId: IdSchema,
  itemId: IdSchema,
});

export type ItemParameters = z.infer<typeof ItemParametersSchema>;

export const ItemListQuerySchema = z.object({
  search: z.string().trim().optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(["createdAt", "updatedAt", "customId"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ItemListQuery = z.infer<typeof ItemListQuerySchema>;

const baseFields = z.object({
  text1: z.string().trim().nullable().optional(),
  text2: z.string().trim().nullable().optional(),
  text3: z.string().trim().nullable().optional(),
  long1: z.string().trim().nullable().optional(),
  long2: z.string().trim().nullable().optional(),
  long3: z.string().trim().nullable().optional(),
  num1: z.number().nullable().optional(),
  num2: z.number().nullable().optional(),
  num3: z.number().nullable().optional(),
  link1: z.url().trim().nullable().optional(),
  link2: z.url().trim().nullable().optional(),
  link3: z.url().trim().nullable().optional(),
  bool1: z.boolean().nullable().optional(),
  bool2: z.boolean().nullable().optional(),
  bool3: z.boolean().nullable().optional(),
});

export const ItemCreateSchema = baseFields.extend({
  customId: z.string().trim().min(1).max(256).optional(),
});

export type ItemCreateRequest = z.infer<typeof ItemCreateSchema>;

export const ItemUpdateSchema = baseFields.extend({
  version: z.number().int().min(1),
  customId: z.string().trim().min(1).max(256).optional(),
});

export type ItemUpdateRequest = z.infer<typeof ItemUpdateSchema>;

export const DeleteItemsBodySchema = z.object({
  items: z
    .array(z.object({ id: IdSchema, version: z.number().int().min(1) }))
    .min(1)
    .max(200),
});

export type DeleteItemsBody = z.infer<typeof DeleteItemsBodySchema>;

export type PrismaTransaction = PrismaClient | Prisma.TransactionClient;
