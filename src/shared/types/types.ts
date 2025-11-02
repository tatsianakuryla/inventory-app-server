import { z } from "zod";

export interface ResponseError {
  message: string;
}

export const IdSchema = z.string().trim().pipe(z.cuid());

export const OptionalUrlSchema = z
  .union([z.string().trim().url(), z.literal(""), z.null(), z.undefined()])
  .transform((value) => {
    if (!value || value === "") return null;
    return value;
  })
  .nullable();

export const VersionSchema = z.coerce.number().int().min(1);

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const SortOrderSchema = z.enum(["asc", "desc"]);

export const SearchQuerySchema = z.object({
  search: z.string().trim().default(""),
});
