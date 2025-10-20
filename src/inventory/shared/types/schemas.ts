import { z } from "zod";
import { InventoryRole, Role } from "@prisma/client";

export type UserContext = { id: string | null; role: Role } | undefined;
export type InventoryParameters = { inventoryId: string };

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

export type InventoryUpdateRequest = z.infer<typeof InventoryUpdateRequestSchema>;

export const AccessUpsertSchema = z.object({
  items: z.array(
    z.object({
      userId: z.string().trim().min(1),
      inventoryRole: z.enum(InventoryRole),
    })
  ).min(1),
});

export type AccessUpsertBody = z.infer<typeof AccessUpsertSchema>;

export const InventoryFieldsUpdateSchema = z.object({
  version: VersionSchema,
  patch: z.record(z.string(), z.unknown()),
});

export type InventoryFieldsUpdateBody = z.infer<typeof InventoryFieldsUpdateSchema>;

export const InventoryIdFormatUpdateSchema = z.object({
  schema: z.record(z.string(), z.unknown()),
  version: VersionSchema.optional(),
});

export type InventoryIdFormatUpdateBody = z.infer<typeof InventoryIdFormatUpdateSchema>;