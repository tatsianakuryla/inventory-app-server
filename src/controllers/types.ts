import { z } from 'zod';
import { Language, Role, Theme, Status } from "@prisma/client";

export const Email = z.string().trim().toLowerCase().email("Invalid email");
export const Password = z.string().trim().min(6, "Password must be at least 6 characters long");

export const RegisterRequestBodySchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: Email,
    password: Password,
});

export type RegisterRequestBody = z.infer<typeof RegisterRequestBodySchema>;

export const SafeUserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    role: z.nativeEnum(Role),
    status: z.nativeEnum(Status),
    language: z.nativeEnum(Language),
    theme: z.nativeEnum(Theme),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    version: z.number(),
});
export const ResponseBodySchema = SafeUserSchema.extend({
    token: z.string(),
});

export type SafeUser = z.infer<typeof SafeUserSchema> | { error: string };

export type ResponseBody = z.infer<typeof ResponseBodySchema> | { error: string };

export const LoginRequestBodySchema = z.object({
    email: Email,
    password: Password,
});

export type LoginRequestBody = z.infer<typeof LoginRequestBodySchema>;

export const UsersQuerySchema = z.object({
    sortBy: z.enum([
        "name","email","role","status","createdAt","updatedAt"
    ]).default("createdAt"),
    order: z.enum(["asc","desc"]).default("desc"),
    search: z.string().trim().min(3).max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export type UsersQuery = z.infer<typeof UsersQuerySchema>;

const IdSchema = z.string().trim().min(1).cuid();

export const IdsBodySchema = z.union([
    IdSchema,
    z.array(IdSchema).nonempty("At least one id is required").max(100, "Too many ids (max 100)"),
]).transform((value) => {
    return { ids: Array.from(new Set(value)) };
});

export type IdsBody = z.infer<typeof IdsBodySchema>;

export const AutocompleteQuerySchema = z.object({
    search: z.string().trim().min(1),
    sortBy: z.enum(['name','email']).default('name'),
    order: z.enum(['asc','desc']).default('asc'),
    limit: z.coerce.number().int().min(1).max(25).default(10),
});

export type AutocompleteQuery = z.infer<typeof AutocompleteQuerySchema>;

export const PayloadSchema = z.object({
    sub: z.string().min(1),
    email: z.string().email(),
    role: z.nativeEnum(Role),
    status: z.nativeEnum(Status),
});

export type AppJwtPayload = z.infer<typeof PayloadSchema>;