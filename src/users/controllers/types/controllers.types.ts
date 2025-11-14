import { z } from "zod";
import { Language, Role, Theme, Status, Prisma } from "@prisma/client";
import { type ResponseError } from "../../../shared/types/types.ts";
import {
  EmailSchema,
  RegisterRequestSchema,
  type RegisterRequest,
  LoginRequestSchema,
  type LoginRequest,
  UsersQuerySchema,
  type UsersQuery,
  AutocompleteQuerySchema,
  type AutocompleteQuery,
  UpdateProfileRequestSchema,
  type UpdateProfileRequest,
  UpdateUserSchema,
  UpdateUsersRequestSchema,
  type UpdateUsersRequest,
  DeleteUsersBodySchema,
  type DeleteUsersBody,
  PayloadSchema,
  type Payload,
} from "../../shared/types/users.schemas.ts";

export { EmailSchema };

export type RegisterRequestBody = RegisterRequest;
export const RegisterRequestBodySchema = RegisterRequestSchema;

export type LoginRequestBody = LoginRequest;
export const LoginRequestBodySchema = LoginRequestSchema;

export type IdsBody = DeleteUsersBody;
export const IdsBodySchema = DeleteUsersBodySchema;

export type UpdateUserProfile = z.infer<typeof UpdateUserSchema>;

export const SalesforceIntegrationSchema = z
  .object({
    userId: z.string(),
    accountId: z.string(),
  })
  .nullable()
  .optional();

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
  googleId: z.string().nullable().optional(),
  facebookId: z.string().nullable().optional(),
  salesforceIntegration: SalesforceIntegrationSchema,
});

export type SafeUser = z.infer<typeof SafeUserSchema>;

export const AuthResponseSchema = SafeUserSchema.extend({
  token: z.string(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export type ResponseBody = SafeUser | AuthResponse | ResponseError;

export const UpdateUsersResponseSchema = z.object({
  updated: z.number(),
  updatedIds: z.array(z.string()),
  skipped: z.number(),
  skippedIds: z.array(z.string()),
  message: z.string(),
});

export type UpdateUsersResponse = z.infer<typeof UpdateUsersResponseSchema> | ResponseError;

export {
  UsersQuerySchema,
  type UsersQuery,
  AutocompleteQuerySchema,
  type AutocompleteQuery,
  PayloadSchema,
  type Payload,
  UpdateProfileRequestSchema,
  type UpdateProfileRequest,
  UpdateUsersRequestSchema,
  type UpdateUsersRequest,
};

export interface UserForToken {
  id: string;
  role: Role;
}

export type UserBasic = Prisma.UserGetPayload<{
  select: { id: true; email: true; role: true; status: true };
}>;

export type SalesforceIntegration = z.infer<typeof SalesforceIntegrationSchema>;

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  language: Language;
  theme: Theme;
  version: number;
  googleId: string | null;
  facebookId: string | null;
  salesforceIntegration: SalesforceIntegration;
  createdAt: string;
  updatedAt: string;
};

export type GetUsersResponse = {
  users: UserListItem[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    sortBy: "name" | "email" | "role" | "status" | "createdAt" | "updatedAt";
    order: "asc" | "desc";
    search: string;
    hasMore: boolean;
  };
};
