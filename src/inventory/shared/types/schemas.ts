import { z } from "zod";

export const InventoryCreateRequestSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  isPublic: z.coerce.boolean().optional().default(false),
  imageUrl: z.string().url().optional(),
  categoryId: z.coerce.number().int().optional(),
});

export type InventoryCreateRequest = z.infer<typeof InventoryCreateRequestSchema>;