import { z } from 'zod';

export const SalesforceTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  signature: z.string().min(1),
  scope: z.string().min(1),
  instance_url: z.string().url(),
  id: z.string().url(),
  token_type: z.literal('Bearer'),
  issued_at: z
    .string()
    .regex(/^\d+$/, 'issued_at must be a unix timestamp in milliseconds'),
});

export type SalesforceTokenResponse = z.infer<typeof SalesforceTokenResponseSchema>;