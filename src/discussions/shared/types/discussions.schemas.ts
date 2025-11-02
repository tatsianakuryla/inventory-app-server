import { z } from "zod";
import {
  IdSchema,
  PaginationQuerySchema,
  SortOrderSchema,
} from "../../../shared/types/types.ts";

export const DiscussionIdParametersSchema = z.object({
  discussionId: IdSchema,
});

export type DiscussionIdParameters = z.infer<typeof DiscussionIdParametersSchema>;

export const DiscussionCreateSchema = z.object({
  textMd: z.string().trim().min(1, "Message is required").max(10000, "Message is too long"),
});

export type DiscussionCreate = z.infer<typeof DiscussionCreateSchema>;

export const DiscussionsQuerySchema = PaginationQuerySchema.extend({
  order: SortOrderSchema.default("desc"),
});

export type DiscussionsQuery = z.infer<typeof DiscussionsQuerySchema>;
