import type { Request, Response } from "express";
import prisma from "../db/db.ts";
import { Hash } from '../security/Hash.ts'
import type { AutocompleteQuery, LoginRequestBody, RegisterRequestBody, ResponseBody} from "./types.ts";
import { isPrismaUniqueError } from "../shared/typeguards/typeguards.ts";
import { Status, Role } from '@prisma/client';
import { ResponseBodySelected, SUPERADMINS } from "../shared/constants.ts";
import { TokensController } from "./tokens.controller.ts";
import { handleError, toAutocompleteOrderBy } from "../shared/helpers/helpers.ts";

export class UserControllers {

  public static getMe = async (request: Request, response: Response): Promise<Response<ResponseBody>> => {
    try {
      const userJwt = request.user;
      const user = await prisma.user.findUnique({
        where: { id: userJwt.sub },
        select: ResponseBodySelected,
      });
      if (!user) {
        return response.status(401).json({ error: "Unauthorized" });
      }
      const token = TokensController.signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      });
      return response.json({ ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        token
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
    const normalizedEmail = email.trim().toLowerCase();
    const role: Role = SUPERADMINS.has(normalizedEmail) ? Role.ADMIN : Role.USER;
    const user = await prisma.user.create({
      data: {
        name,
        email: email.trim().toLowerCase(),
        password: passwordHash,
        role
      },
      select: ResponseBodySelected,
    });
    const token = TokensController.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });
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
        where: { email: email.trim().toLowerCase() }
      });
      if (!user) return response.status(401).json({ error: 'Invalid email or password' });
      if (user.status === Status.BLOCKED) {
        return response.status(403).json({ error: "The user is blocked" });
      }
      const isPasswordValid = await Hash.verifyPassword(password, user.password);
      if (!isPasswordValid) return response.status(401).json({ error: 'Invalid email or password' });
      if (SUPERADMINS.has(user.email) && user.role !== Role.ADMIN) {
        await prisma.user.update({ where: { id: user.id }, data: { role: Role.ADMIN } });
      }
      const token = TokensController.signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      });
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
}