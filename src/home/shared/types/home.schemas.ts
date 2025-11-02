import { z } from "zod";

export const HomePopularQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export type HomePopularQuery = z.infer<typeof HomePopularQuerySchema>;

export const HomeRecentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export type HomeRecentQuery = z.infer<typeof HomeRecentQuerySchema>;

export const TagCloudQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type TagCloudQuery = z.infer<typeof TagCloudQuerySchema>;
