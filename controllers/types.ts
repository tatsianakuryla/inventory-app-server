import { z } from 'zod';
import { Language, Role, Theme, Status } from "@prisma/client";

export const RegisterRequestBodySchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().toLowerCase().trim().email("Invalid email"),
    password: z.string().trim().min(6, "Password must be at least 6 characters long"),
});

export type RegisterRequestBody = z.infer<typeof RegisterRequestBodySchema>;

export const ResponseBodySchema = z.object({
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

export type ResponseBody = z.infer<typeof ResponseBodySchema> | { error: string };

export const LoginRequestBodySchema = z.object({
    email: z.string().toLowerCase().trim().email("Invalid email"),
    password: z.string().trim(),
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

const IdSchema = z.string().trim().min(1).cuid();

export const IdsBodySchema = z.union([
    IdSchema,
    z.array(IdSchema).nonempty("At least one id is required").max(100, "Too many ids (max 100)"),
]).transform((val) => {
    const arr = Array.isArray(val) ? val : [val];
    return { ids: Array.from(new Set(arr)) };
});