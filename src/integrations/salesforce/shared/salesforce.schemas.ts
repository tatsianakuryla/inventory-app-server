import { z } from "zod";

export const SalesforceTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  signature: z.string().min(1),
  scope: z.literal("id api"),
  instance_url: z.url("Invalid URL"),
  id: z.url("Invalid URL"),
  token_type: z.literal("Bearer"),
  issued_at: z.string().regex(/^\d+$/, "issued_at must be a unix timestamp in milliseconds"),
});

export type SalesforceTokenResponse = z.infer<typeof SalesforceTokenResponseSchema>;

export const SalesforceAccountCreateRequestSchema = z.object({
  Name: z.string().min(1, "Name is required").max(255, "Max Name length is 255 characters"),
  Website: z.string().url("Website must be a valid URL").optional(),
});

export type SalesforceAccountCreateRequest = z.infer<typeof SalesforceAccountCreateRequestSchema>;

export const SalesforceContactCreateRequestSchema = z.object({
  FirstName: z
    .string()
    .min(1, "FirstName is required")
    .max(40, "Max length for The FirstName is 40 characters"),
  LastName: z
    .string()
    .min(1, "LastName is Required")
    .max(80, "Max length for The LastName is 80 characters"),
  Email: z.email(),
  AccountId: z.string().min(1),
});

export type SalesforceContactCreateRequest = z.infer<typeof SalesforceContactCreateRequestSchema>;

export const SalesforceResponseSchema = z.object({
  id: z.string().min(1, "Id is required"),
  success: z.boolean(),
  errors: z.array(
    z.object({
      message: z.string().min(1).optional(),
      errorCode: z.string().min(1).optional(),
    }),
  ),
});

export type SalesforceResponse = z.infer<typeof SalesforceResponseSchema>;
