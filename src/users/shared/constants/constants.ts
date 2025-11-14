import { getAdminEmails } from "../helpers/helpers.ts";

export const USER_SELECTED = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  language: true,
  theme: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  googleId: true,
  facebookId: true,
  salesforceIntegration: true,
} as const;

export const SUPERADMINS = getAdminEmails();
