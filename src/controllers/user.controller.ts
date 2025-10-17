import type { Request, Response } from "express";
import prisma from "../db/db.ts";
import { Hash } from '../security/Hash.ts'
import type {
  AutocompleteQuery,
  LoginRequestBody,
  RegisterRequestBody,
  ResponseBody,
  UserBasic
} from "./types/controllers.types.ts";
import { isPrismaUniqueError } from "../shared/typeguards/typeguards.ts";
import { Status, Role } from '@prisma/client';
import { USER_SELECTED, SUPERADMINS } from "../shared/constants.ts";
import { TokensController } from "./tokens.controller.ts";
import {handleError, normalizeEmail, toAutocompleteOrderBy} from "../shared/helpers/helpers.ts";

export class UserController {

  public static getMe = async (request: Request, response: Response): Promise<Response<ResponseBody>> => {
    try {
      const { sub } = request.user;
      const user = await prisma.user.findUnique({
        where: { id: sub },
        select: USER_SELECTED,
      });
      if (!user) return response.status(401).json({ error: "Unauthorized" });
      return response.json({ ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });
    } catch (error) {
      return handleError(error, response);
    }
  }

  public static autocompleteGetUsers = async (request: Request, response: Response) => {
    try {
      const { search, sortBy = 'name', order = 'asc', limit = 10 }: AutocompleteQuery = response.locals.query;
      const orderBy = toAutocompleteOrderBy(sortBy, order);
      const items = await prisma.user.findMany({
        where: {
          OR: [
            { name:  { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
          status: { not: Status.BLOCKED }
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

  public static register = async (request: Request<{}, ResponseBody, RegisterRequestBody>, response: Response<ResponseBody>): Promise<Response<ResponseBody>> => {
    try {
      const newUser = await this.createNewUserFromRequest(request);
      return response.status(201).json(newUser);
    } catch (error: unknown) {
      if (isPrismaUniqueError(error)) {
        return response.status(409).json({ error: 'User with such an email already exists' });
      }
      return handleError(error, response);
    }
  }

  private static async createNewUserFromRequest(request: Request<{}, ResponseBody, RegisterRequestBody>): Promise<ResponseBody> {
    const { name, email, password } = request.body;
    const passwordHash = await Hash.get(password);
    const role: Role = SUPERADMINS.has(normalizeEmail(email)) ? Role.ADMIN : Role.USER;
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizeEmail(email),
        password: passwordHash,
        role
      },
      select: USER_SELECTED,
    });
    const token = TokensController.createTokenForUser(user);
    return { ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      token
    }
  }

  public static login = async (request: Request<{}, ResponseBody, LoginRequestBody>, response: Response<ResponseBody>): Promise<Response<ResponseBody>> => {
    try {
      const { email, password } = request.body;
      const user = await prisma.user.findUnique({
        where: { email: normalizeEmail(email) }
      });
      if (!user) return response.status(401).json({ error: 'Invalid email or password' });
      if (user.status === Status.BLOCKED) {
        return response.status(403).json({ error: "The user is blocked" });
      }
      if (!user.password) {
        return response.status(400).json({ error: "This account uses social login. Sign in with Google/Facebook or set a password." });
      }
      const isPasswordValid = await Hash.verifyPassword(password, user.password);
      if (!isPasswordValid) return response.status(401).json({ error: 'Invalid email or password' });
      await this.promoteSuperAdmins(user);
      const token = TokensController.createTokenForUser(user);
      const { password: _omit, createdAt, updatedAt, ...rest } = user;
      const safe = {
        ...rest,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      };
      return response.status(200).json({...safe, token});
    } catch (error) {
      return handleError(error, response);
    }
  }

  public static async promoteSuperAdmins(user: UserBasic): Promise<void> {
    if (SUPERADMINS.has(user.email) && user.role !== Role.ADMIN) {
      await prisma.user.update({ where: { id: user.id }, data: { role: Role.ADMIN } });
    }
  }
}