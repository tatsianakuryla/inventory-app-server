import { z } from "zod";
import { PAGINATION } from "../constants/validation.ts";

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

export const VersionSchema = z.coerce.number().int().min(PAGINATION.MIN_PAGE);

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(PAGINATION.MIN_PAGE).default(PAGINATION.MIN_PAGE),
  perPage: z.coerce
    .number()
    .int()
    .min(PAGINATION.MIN_PER_PAGE)
    .max(PAGINATION.MAX_PER_PAGE)
    .default(PAGINATION.DEFAULT_PER_PAGE),
});

export const SortOrderSchema = z.enum(["asc", "desc"]);

export const SearchQuerySchema = z.object({
  search: z.string().trim().default(""),
});
