import { z } from "zod";

export interface ResponseError {
  message: string;
}

export const IdSchema = z.cuid().trim().min(1);
