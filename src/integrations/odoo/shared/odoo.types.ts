import { z } from "zod";
import type { FieldAggregation } from "../../../inventory/shared/services/aggregation.types.js";

export type CreateApiTokenResponseBody = { token: string } | { message: string };

export const TokenQuerySchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type TokenQuery = z.infer<typeof TokenQuerySchema>;

export interface InventoryDataResponse {
  inventoryId: string;
  inventoryName: string;
  description: string | null;
  totalItems: number;
  fields: FieldAggregation[];
}

export type GetInventoryDataResponseBody = InventoryDataResponse | { message: string };
