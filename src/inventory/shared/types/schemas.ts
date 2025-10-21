import { z } from "zod";
import { InventoryRole, Role } from "@prisma/client";

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
  accesses: z.array(InventoryAccessEntrySchema).min(1).max(200),
});

export type UpsertAccessBody = z.infer<typeof UpsertAccessBodySchema>;