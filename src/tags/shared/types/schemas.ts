import { z } from "zod";
import { IdSchema } from "../../../shared/types/types.ts";

export const TagCreateSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required").max(50),
});

export const TagsQuerySchema = z.object({
  search: z.string().trim().optional().default(""),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const PopularTagsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export const InventoryParametersSchema = z.object({
  inventoryId: IdSchema,
});

export type InventoryParameters = z.infer<typeof InventoryParametersSchema>;

export const UpdateInventoryTagsSchema = z.object({
  tagIds: z.array(z.number().int().positive()).max(20, "Maximum 20 tags per inventory"),
});

export type UpdateInventoryTagsRequest = z.infer<typeof UpdateInventoryTagsSchema>;
