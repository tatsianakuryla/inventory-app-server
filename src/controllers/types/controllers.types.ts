import { z } from 'zod';
import { Language, Role, Theme, Status, Prisma} from "@prisma/client";

export const EmailSchema = z.string().trim().toLowerCase().email("Invalid email");
const PasswordSchema = z.string().trim().min(6, "PasswordSchema must be at least 6 characters long");
const IdSchema = z.string().trim().min(1).cuid();
const VersionSchema = z.coerce.number().int().min(1);

export const RegisterRequestBodySchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: EmailSchema,
    password: PasswordSchema,
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

export type SafeUser = z.infer<typeof SafeUserSchema>;

export const ResponseBodySchema = SafeUserSchema.extend({
    token: z.string(),
});

export type ResponseBody = z.infer<typeof ResponseBodySchema> | { error: string };

export const LoginRequestBodySchema = z.object({
    email: EmailSchema,
    password: PasswordSchema,
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

export const AppJwtPayloadSchema = z.object({
    sub: z.string().min(1),
});

export type AppJwtPayload = z.infer<typeof AppJwtPayloadSchema>;

export const UpdateUserRequestSchema = z.object({
    id: IdSchema,
    version: VersionSchema,
});

export const UpdateUsersRequestSchema = z
  .union([UpdateUserRequestSchema, z.array(UpdateUserRequestSchema)])
  .transform((value) => (Array.isArray(value) ? value : [value]))
  .refine((array) => array.length > 0, { message: "At least one user is required" })
  .refine((array) => array.length <= 100, { message: "Too many users (max 100)" });

export type UpdateUserProfile = z.infer<typeof UpdateUserRequestSchema>;
export type UpdateUsersRequest = z.infer<typeof UpdateUsersRequestSchema>;

export const UpdateUsersResponseSchema = z.object({
    updated: z.number(),
    updatedIds: z.array(IdSchema),
    skipped: z.number(),
    skippedIds: z.array(IdSchema),
    message: z.string(),
});

export type UpdateUsersResponse = z.infer<typeof UpdateUsersResponseSchema> | { error: string};

export interface UserForToken  {
    id: string;
}

export type UserBasic = Prisma.UserGetPayload<{
    select: { id: true; email: true; role: true; status: true }
}>;
