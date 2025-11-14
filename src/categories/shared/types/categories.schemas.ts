import { z } from "zod";
import { PaginationQuerySchema, SortOrderSchema } from "../../../shared/types/types.ts";

export const CategoryParametersSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
});

export type CategoryParameters = z.infer<typeof CategoryParametersSchema>;

export const CategoryListQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().default(""),
  sortBy: z.enum(["name", "id"]).default("name"),
  order: SortOrderSchema.default("asc"),
});

export type CategoryListQuery = z.infer<typeof CategoryListQuerySchema>;

export const CategoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
});

export type CategoryCreate = z.infer<typeof CategoryCreateSchema>;

export const CategoryUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
});

export type CategoryUpdate = z.infer<typeof CategoryUpdateSchema>;
