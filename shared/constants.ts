export const HASH_WORK_FACTOR = 12 as const;
export const UNIQUE_VALUE_ERROR_CODE = 'P2002';
export const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://site--inventory-app--sm9fnltkyqvh.code.run'
];

export const ALLOWED_TO_SORT = [
  "name", "email", "role", "isBlocked", "createdAt", "updatedAt",
] as const;