import { z } from "zod";
import { Role, Prisma } from "@prisma/client";
import {
  IdSchema,
  OptionalUrlSchema,
  VersionSchema,
  PaginationQuerySchema,
  SortOrderSchema,
} from "../../../shared/types/types.ts";

export type UserContext = { id: string | null; role: Role } | undefined;

export const InventoryParametersSchema = z.object({
  inventoryId: IdSchema,
});

export type InventoryParameters = z.infer<typeof InventoryParametersSchema>;

export const InventoryCreateRequestSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  isPublic: z.coerce.boolean().default(false),
  imageUrl: OptionalUrlSchema,
  categoryId: z.coerce.number().int().optional(),
});

export type InventoryCreateRequest = z.infer<typeof InventoryCreateRequestSchema>;

export const InventoryListQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().default(""),
  sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
  order: SortOrderSchema.default("desc"),
});

export type InventoryListQuery = z.infer<typeof InventoryListQuerySchema>;

export const InventoryUpdateRequestSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  description: z.string().trim().optional(),
  isPublic: z.coerce.boolean().optional(),
  imageUrl: OptionalUrlSchema,
  categoryId: z.coerce.number().int().nullable().optional(),
  version: VersionSchema,
});

export const InventoryToDeleteSchema = z.object({
  id: IdSchema,
  version: VersionSchema,
});

export type InventoryToDelete = z.infer<typeof InventoryToDeleteSchema>;

export const DeleteInventoriesBodySchema = z.object({
  inventories: z.array(InventoryToDeleteSchema).min(1).max(200, "Too many inventories to delete"),
});

export type DeleteInventoriesBody = z.infer<typeof DeleteInventoriesBodySchema>;

export const BulkUpdateVisibilityBodySchema = z.object({
  inventoryIds: z.array(IdSchema).min(1).max(200, "Too many inventories"),
  isPublic: z.boolean(),
});

export type BulkUpdateVisibilityBody = z.infer<typeof BulkUpdateVisibilityBodySchema>;

export const InventoryAccessEntrySchema = z.object({
  userId: IdSchema,
  inventoryRole: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.enum(['OWNER', 'VIEWER', 'EDITOR'] as const)),
});

export type InventoryAccessEntry = z.infer<typeof InventoryAccessEntrySchema>;

export const UpsertAccessBodySchema = z.object({
  accesses: z.array(InventoryAccessEntrySchema).min(1).max(200, "Too many users to update access"),
});

export type UpsertAccessBody = z.infer<typeof UpsertAccessBodySchema>;

const RevokeAccessSchema = z.object({ userId: IdSchema });

const RevokeAccessManySchema = z.object({
  userIds: z
    .array(IdSchema)
    .min(1)
    .max(200)
    .refine((array) => new Set(array).size === array.length, { message: "Duplicate userId" }),
});

export const RevokeAccessBodySchema = z
  .union([RevokeAccessSchema, RevokeAccessManySchema])
  .transform((data) => ("userId" in data ? { userIds: [data.userId] } : data));

export type RevokeAccessBody = z.infer<typeof RevokeAccessBodySchema>;

export const UpdateInventoryFieldsBodySchema = z.object({
  version: VersionSchema,
  patch: z
    .record(z.string(), z.unknown())
    .refine((object) => Object.keys(object).length > 0, { message: "Empty patch" }),
});

export type UpdateInventoryFieldsBody = z.infer<typeof UpdateInventoryFieldsBodySchema>;

export const JsonSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(JsonSchema),
    z.record(z.string(), JsonSchema),
  ]),
);

export const InventoryIdFormatUpdateBodySchema = z.object({
  schema: JsonSchema,
  version: VersionSchema.optional(),
});

export type InventoryIdFormatUpdateBody = z.infer<typeof InventoryIdFormatUpdateBodySchema>;
