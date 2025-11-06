import type { Request, Response } from "express";
import prisma from "../../../shared/db/db.ts";
import {
  type AutocompleteQuery,
  EmailSchema,
  type LoginRequestBody,
  type RegisterRequestBody,
  type ResponseBody,
  type UserBasic,
  type UpdateProfileRequest,
} from "../types/controllers.types.ts";
import { Status, Role } from "@prisma/client";
import { USER_SELECTED, SUPERADMINS } from "../../shared/constants/constants.ts";
import { TokenController } from "../token/token.controller.ts";
import { handleError, toAutocompleteOrderBy } from "../../shared/helpers/helpers.ts";
import { Hash } from "../../security/Hash.ts";
import {
  isPrismaUniqueError,
  isPrismaVersionConflictError,
} from "../../../shared/typeguards/typeguards.ts";
import {BACKEND_ERRORS} from "../../../shared/constants/constants.ts";

export class UserController {
  public static getMe = async (
    request: Request,
    response: Response,
  ): Promise<Response<ResponseBody>> => {
    try {
      const { sub } = request.user;
      const user = await prisma.user.findUnique({
        where: { id: sub },
        select: USER_SELECTED,
      });
      if (!user) return response.status(401).json({ message: BACKEND_ERRORS.UNAUTHORIZED });
      return response.json({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static autocompleteGetUsers = async (_request: Request, response: Response) => {
    try {
      const query = response.locals.query as AutocompleteQuery | undefined;
      const { search, sortBy = "name", order = "asc", limit = 10 } = query || { search: "" };
      const orderBy = toAutocompleteOrderBy(sortBy, order);
      const items = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
          status: { not: Status.BLOCKED },
        },
        select: { id: true, name: true, email: true },
        orderBy,
        take: limit,
      });
      return response.json({ items });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static register = async (
    request: Request<Record<string, never>, ResponseBody, RegisterRequestBody>,
    response: Response<ResponseBody>,
  ): Promise<Response<ResponseBody>> => {
    try {
      const newUser = await this.createNewUserFromRequest(request);
      return response.status(201).json(newUser);
    } catch (error: unknown) {
      if (isPrismaUniqueError(error)) {
        return response.status(409).json({ message: BACKEND_ERRORS.USER_ALREADY_EXISTS });
      }
      return handleError(error, response);
    }
  };

  private static async createNewUserFromRequest(
    request: Request<Record<string, never>, ResponseBody, RegisterRequestBody>,
  ): Promise<ResponseBody> {
    const { name, email, password } = request.body;
    const passwordHash = await Hash.get(password);
    const role: Role = SUPERADMINS.has(EmailSchema.parse(email)) ? Role.ADMIN : Role.USER;
    const user = await prisma.user.create({
      data: {
        name,
        email: EmailSchema.parse(email),
        password: passwordHash,
        role,
      },
      select: USER_SELECTED,
    });
    const token = TokenController.createTokenForUser(user);
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      token,
    };
  }

  public static login = async (
    request: Request<Record<string, never>, ResponseBody, LoginRequestBody>,
    response: Response<ResponseBody>,
  ): Promise<Response<ResponseBody>> => {
    try {
      const { email, password } = request.body;
      const user = await prisma.user.findUnique({
        where: { email: EmailSchema.parse(email) },
      });
      if (!user) return response.status(401).json({ message: BACKEND_ERRORS.INVALID_EMAIL_OR_PASSWORD });
      if (user.status === Status.BLOCKED) {
        return response.status(403).json({ message: BACKEND_ERRORS.USER_BLOCKED });
      }
      if (!user.password) {
        return response.status(400).json({
          message: BACKEND_ERRORS.SOCIAL_ACCOUNT_NOT_LINKED,
        });
      }
      const isPasswordValid = await Hash.verifyPassword(password, user.password);
      if (!isPasswordValid)
        return response.status(401).json({ message: BACKEND_ERRORS.INVALID_EMAIL_OR_PASSWORD });
      await this.promoteSuperAdmins(user);
      const token = TokenController.createTokenForUser(user);
      const { password: _omit, createdAt, updatedAt, ...rest } = user;
      const safe = {
        ...rest,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      };
      return response.status(200).json({ ...safe, token });
    } catch (error) {
      return handleError(error, response);
    }
  };

  public static async promoteSuperAdmins(user: UserBasic): Promise<void> {
    if (SUPERADMINS.has(user.email) && user.role !== Role.ADMIN) {
      await prisma.user.update({ where: { id: user.id }, data: { role: Role.ADMIN } });
    }
  }

  public static updateProfile = async (request: Request, response: Response): Promise<Response> => {
    try {
      const userId = request.user.sub;
      const { version, ...updateData } = request.body as UpdateProfileRequest;
      const updated = await prisma.user.update({
        where: { id: userId, version },
        data: {
          ...(updateData.name !== undefined && { name: updateData.name }),
          ...(updateData.language !== undefined && { language: updateData.language }),
          ...(updateData.theme !== undefined && { theme: updateData.theme }),
          version: { increment: 1 },
        },
        select: USER_SELECTED,
      });
      return response.json({
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      });
    } catch (error) {
      if (isPrismaVersionConflictError(error)) {
        return response
          .status(409)
          .json({ message: BACKEND_ERRORS.VERSION_CONFLICT });
      }
      return handleError(error, response);
    }
  };

  public static logout = (_request: Request, response: Response): Response => {
    return response.status(204).end();
  };
}
