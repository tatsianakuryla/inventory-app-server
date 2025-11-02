import { z } from "zod";
import {
  IdSchema,
  VersionSchema,
  PaginationQuerySchema,
  SortOrderSchema,
} from "../../../shared/types/types.ts";

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: 'Invalid email' }));

export const PasswordSchema = z
  .string()
  .trim()
  .min(6, "Password must be at least 6 characters long");

export const RegisterRequestSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: EmailSchema,
  password: PasswordSchema,
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const UsersQuerySchema = PaginationQuerySchema.extend({
  sortBy: z
    .enum(["name", "email", "role", "status", "createdAt", "updatedAt"])
    .default("createdAt"),
  order: SortOrderSchema.default("desc"),
  search: z.string().trim().min(3).max(100).default(""),
});

export type UsersQuery = z.infer<typeof UsersQuerySchema>;

export const AutocompleteQuerySchema = z.object({
  search: z.string().trim().min(1),
  sortBy: z.enum(["name", "email"]).default("name"),
  order: SortOrderSchema.default("asc"),
  limit: z.coerce.number().int().min(1).max(25).default(10),
});

export type AutocompleteQuery = z.infer<typeof AutocompleteQuerySchema>;

export const UpdateProfileRequestSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100).optional(),
  language: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.enum(['EN', 'RU'] as const))
    .optional(),
  theme: z.string()
    .trim()
    .toUpperCase()
    .pipe(z.enum(["LIGHT", "DARK"] as const))
    .optional(),
  version: VersionSchema,
});

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

export const UpdateUserSchema = z.object({
  id: IdSchema,
  version: VersionSchema,
});

export const UpdateUsersRequestSchema = z
  .union([UpdateUserSchema, z.array(UpdateUserSchema)])
  .transform((value) => (Array.isArray(value) ? value : [value]))
  .refine((array) => array.length > 0, { message: "At least one user is required" })
  .refine((array) => array.length <= 100, { message: "Too many users (max 100)" });

export type UpdateUsersRequest = z.infer<typeof UpdateUsersRequestSchema>;

export const DeleteUsersBodySchema = z
  .union([
    IdSchema,
    z.array(IdSchema).nonempty("At least one id is required").max(100, "Too many ids (max 100)"),
  ])
  .transform((value) => ({
    ids: Array.from(new Set(Array.isArray(value) ? value : [value])),
  }));

export type DeleteUsersBody = z.infer<typeof DeleteUsersBodySchema>;


export const PayloadSchema = z.object({
  sub: IdSchema,
  role: z.string()
    .trim()
    .toUpperCase()
    .pipe(z.enum(["USER", "ADMIN"] as const)),
  version: z.coerce.number().int().optional(),
});

export type Payload = z.infer<typeof PayloadSchema>;