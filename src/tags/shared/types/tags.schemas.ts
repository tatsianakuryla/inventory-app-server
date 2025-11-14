import { z } from "zod";
import { SearchQuerySchema } from "../../../shared/types/types.ts";

export const TagCreateSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required").max(50, "Tag name is too long"),
});

export type TagCreate = z.infer<typeof TagCreateSchema>;

export const TagsQuerySchema = SearchQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type TagsQuery = z.infer<typeof TagsQuerySchema>;

export const PopularTagsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type PopularTagsQuery = z.infer<typeof PopularTagsQuerySchema>;

export const UpdateInventoryTagsSchema = z.object({
  tagNames: z
    .array(z.string().trim().min(1).max(50))
    .max(20, "Maximum 20 tags per inventory")
    .refine((array) => new Set(array.map((tag) => tag.toLowerCase())).size === array.length, {
      message: "Duplicate tag names are not allowed",
    }),
});

export type UpdateInventoryTagsRequest = z.infer<typeof UpdateInventoryTagsSchema>;
