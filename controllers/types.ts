import { z } from 'zod';
import { Language, Role, Theme } from "@prisma/client";

export const RegisterRequestBodySchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().toLowerCase().trim().email("Invalid email"),
    password: z.string().trim().min(6, "Password must be at least 6 characters long"),
});

export type RegisterBody = z.infer<typeof RegisterRequestBodySchema>;

export const RegisterResponseBodySchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    role: z.nativeEnum(Role),
    isBlocked: z.boolean(),
    language: z.nativeEnum(Language),
    theme: z.nativeEnum(Theme),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    version: z.number(),
});

export type RegisterResponseBody = z.infer<typeof RegisterResponseBodySchema> | { error: string };

export const LoginRequestBodySchema = z.object({
    email: z.string().toLowerCase().trim().email("Invalid email"),
    password: z.string().trim(),
});

export type LoginRequestBody = z.infer<typeof LoginRequestBodySchema>;

export const LoginResponseBodySchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    role: z.nativeEnum(Role),
    isBlocked: z.boolean(),
    language: z.nativeEnum(Language),
    theme: z.nativeEnum(Theme),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    version: z.number(),
});

export type LoginResponseBody = z.infer<typeof LoginResponseBodySchema> | { error: string };

export const UsersQuerySchema = z.object({
    sortBy: z.enum([
        "name","email","role","isBlocked","createdAt","updatedAt"
    ]).default("createdAt"),
    order: z.enum(["asc","desc"]).default("desc"),
});

export type UsersQuery = z.infer<typeof UsersQuerySchema>;