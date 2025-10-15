import { z } from 'zod';

export type Provider = "google" | "facebook";

export const PROVIDER_FIELD: Record<Provider, "googleId" | "facebookId"> = {
  google: "googleId",
  facebook: "facebookId",
};

export const GoogleLoginSchema = z.object({
  idToken: z.string().min(10),
}).strict();
export type GoogleLoginBody = z.infer<typeof GoogleLoginSchema>;

export const FacebookLoginSchema = z.object({
  accessToken: z.string().min(10),
}).strict();
export type FacebookLoginBody = z.infer<typeof FacebookLoginSchema>;