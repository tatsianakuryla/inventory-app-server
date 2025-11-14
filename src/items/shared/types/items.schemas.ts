import { z } from "zod";
import {
  IdSchema,
  OptionalUrlSchema,
  VersionSchema,
  PaginationQuerySchema,
  SortOrderSchema,
} from "../../../shared/types/types.js";
import { VALIDATION_LIMITS, BATCH_LIMITS } from "../../../shared/constants/validation.js";
import { VALIDATION_MESSAGES } from "../../../shared/constants/messages.js";
import { Prisma, PrismaClient } from "@prisma/client";

export const ItemParametersSchema = z.object({
  inventoryId: IdSchema,
  itemId: IdSchema,
});

export type ItemParameters = z.infer<typeof ItemParametersSchema>;

export const ItemListQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().default(""),
  sortBy: z.enum(["createdAt", "updatedAt", "customId"]).default("createdAt"),
  order: SortOrderSchema.default("desc"),
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
  link1: OptionalUrlSchema,
  link2: OptionalUrlSchema,
  link3: OptionalUrlSchema,
  bool1: z.boolean().nullable().optional(),
  bool2: z.boolean().nullable().optional(),
  bool3: z.boolean().nullable().optional(),
});

export const ItemCreateSchema = baseFields.extend({
  customId: z
    .string()
    .trim()
    .min(VALIDATION_LIMITS.NAME_MIN, VALIDATION_MESSAGES.CUSTOM_ID_REQUIRED)
    .max(VALIDATION_LIMITS.CUSTOM_ID_MAX)
    .optional(),
});

export type ItemCreateRequest = z.infer<typeof ItemCreateSchema>;

export const ItemUpdateSchema = baseFields.extend({
  version: VersionSchema,
  customId: z
    .string()
    .trim()
    .min(VALIDATION_LIMITS.NAME_MIN, VALIDATION_MESSAGES.CUSTOM_ID_REQUIRED)
    .max(VALIDATION_LIMITS.CUSTOM_ID_MAX)
    .optional(),
});

export type ItemUpdateRequest = z.infer<typeof ItemUpdateSchema>;

export const DeleteItemsBodySchema = z.object({
  items: z
    .array(z.object({ id: IdSchema, version: VersionSchema }))
    .min(VALIDATION_LIMITS.NAME_MIN)
    .max(BATCH_LIMITS.ITEMS_MAX),
});

export type DeleteItemsBody = z.infer<typeof DeleteItemsBodySchema>;

export type PrismaTransaction = PrismaClient | Prisma.TransactionClient;
