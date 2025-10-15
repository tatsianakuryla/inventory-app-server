import { getAdminEmails } from "./helpers/helpers.ts";

export const HASH_WORK_FACTOR = 12 as const;
export const UNIQUE_VALUE_ERROR_CODE = 'P2002';
export const RECORDS_NOT_FOUND = 'P2025';
export const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://site--inventory-app--sm9fnltkyqvh.code.run'
];

export const ResponseBodySelected = {
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
};

export const SUPERADMINS = getAdminEmails();