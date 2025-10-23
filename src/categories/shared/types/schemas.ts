import { z } from "zod";

export const CategoryParametersSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
});

export type CategoryParameters = z.infer<typeof CategoryParametersSchema>;

export const CategoryQuerySchema = z.object({
  search: z.string().trim().optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(["name", "id"]).optional().default("name"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
});

export type CategoryQuery = z.infer<typeof CategoryQuerySchema>;

export const CategoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
});

export type CategoryCreate = z.infer<typeof CategoryCreateSchema>;

export const CategoryUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
});

export type CategoryUpdate = z.infer<typeof CategoryUpdateSchema>;
