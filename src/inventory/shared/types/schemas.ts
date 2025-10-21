import { z } from "zod";
import { InventoryRole, Role, Prisma } from "@prisma/client";
import { IdSchema } from '../../../users/controllers/types/controllers.types.ts';
export type UserContext = { id: string | null; role: Role } | undefined;

export const InventoryParametersSchema = z.object({
  inventoryId: z.string().min(1),
})

export type InventoryParameters = z.infer<typeof InventoryParametersSchema>;

export const InventoryCreateRequestSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  isPublic: z.coerce.boolean().optional().default(false),
  imageUrl: z.httpUrl().optional(),
  categoryId: z.coerce.number().int().optional(),
});

export type InventoryCreateRequest = z.infer<typeof InventoryCreateRequestSchema>;

export const VersionSchema = z.coerce.number().int().min(1);

export const InventoryListQuerySchema = z.object({
  search: z.string().trim().optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(["createdAt", "name"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type InventoryListQuery = z.infer<typeof InventoryListQuerySchema>;

export const InventoryUpdateRequestSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  isPublic: z.coerce.boolean().optional(),
  imageUrl: z.httpUrl().nullable().optional(),
  categoryId: z.coerce.number().int().nullable().optional(),
  version: VersionSchema,
});

export const InventoryToDeleteSchema = z.object({
    id: z.string().min(1),
    version: z.coerce.number().int().min(1),
});

export type InventoryToDelete = z.infer<typeof InventoryToDeleteSchema>;

export const DeleteInventoriesBodySchema = z.object({
  inventories: z.array(InventoryToDeleteSchema).min(1).max(200, 'Too many inventories to delete')
});

export type DeleteInventoriesBody = z.infer<typeof DeleteInventoriesBodySchema>;

export const InventoryAccessEntrySchema = z.object(
  {
    userId: z.string(),
    inventoryRole: z.enum(InventoryRole),
  }
);

export type InventoryAccessEntry = z.infer<typeof InventoryAccessEntrySchema>;

export const UpsertAccessBodySchema = z.object({
  accesses: z.array(InventoryAccessEntrySchema).min(1).max(200, 'Too many users to update access'),
});

export type UpsertAccessBody = z.infer<typeof UpsertAccessBodySchema>;

const RevokeAccessSchema = z.object({ userId: IdSchema });

const RevokeAccessManySchema   = z.object({
  userIds: z.array(IdSchema)
    .min(1).max(200)
    .refine((array) => new Set(array).size === array.length, { message: "Duplicate userId" }),
});

export const RevokeAccessBodySchema = z.union([RevokeAccessSchema, RevokeAccessManySchema])
  .transform((data) => ("userId" in data ? { userIds: [data.userId] } : data));

export type RevokeAccessBody = z.infer<typeof RevokeAccessBodySchema>;

export const UpdateInventoryFieldsBodySchema = z.object({
  version: z.number().int().min(1),
  patch: z.record(z.string(), z.unknown())
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
  ])
);

export const InventoryIdFormatUpdateBodySchema = z.object({
  schema: JsonSchema,
  version: z.number().int().min(1).optional(),
});

export type InventoryIdFormatUpdateBody = z.infer<typeof InventoryIdFormatUpdateBodySchema>;