import { z } from "zod";

export interface ResponseError {
  error: string;
}

export const IdSchema = z.cuid().trim().min(1);
