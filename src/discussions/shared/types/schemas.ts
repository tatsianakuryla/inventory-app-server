import { z } from "zod";
import { IdSchema } from "../../../shared/types/types.ts";

export const InventoryParametersSchema = z.object({
  inventoryId: IdSchema,
});

export type InventoryParameters = z.infer<typeof InventoryParametersSchema>;

export const DiscussionIdParametersSchema = z.object({
  discussionId: IdSchema,
});

export type DiscussionIdParameters = z.infer<typeof DiscussionIdParametersSchema>;

export const DiscussionCreateSchema = z.object({
  textMd: z.string().trim().min(1, "Message is required").max(10000),
});

export type DiscussionCreate = z.infer<typeof DiscussionCreateSchema>;

export const DiscussionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type DiscussionsQuery = z.infer<typeof DiscussionsQuerySchema>;
