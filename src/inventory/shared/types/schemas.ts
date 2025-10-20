import { z } from "zod";

export const InventoryCreateRequestSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  isPublic: z.coerce.boolean().optional().default(false),
  imageUrl: z.string().url().optional(),
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
  imageUrl: z.string().url().nullable().optional(),
  categoryId: z.coerce.number().int().nullable().optional(),
  version: VersionSchema,
});

export type InventoryUpdateRequest = z.infer<typeof InventoryUpdateRequestSchema>;