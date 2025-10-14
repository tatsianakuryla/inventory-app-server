import type { Request, Response } from "express";
import prisma from "../db/db.ts";
import { Hash } from '../security/Hash.ts'
import type { LoginRequestBody, RegisterRequestBody, ResponseBody } from "./types.ts";
import { isError, isPrismaUniqueError, toRole, toStatus } from "../shared/typeguards/typeguards.ts";
import { Prisma, Status } from '@prisma/client';

const ResponseBodySelected = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  language: true,
  theme: true,
  createdAt: true,
  updatedAt: true,
  version: true,
};

export class UserControllers {

  static getUsers = async (request: Request, response: Response) => {
    try {
      const { sortBy = 'createdAt', order = 'desc', search = '', page = 1, perPage = 20 } = response.locals.query;
      const skip = (page - 1) * perPage;
      const take = perPage;
      const where = this.buildSearchWhere(search);
      const [items, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          select: ResponseBodySelected,
          orderBy: { [sortBy]: order },
          skip, take,
        }),
        prisma.user.count({ where }),
      ]);
      return response.json({
        items,
        meta: {
          page, perPage, total,
          totalPages: Math.max(1, Math.ceil(total / perPage)),
          sortBy, order, search: search ?? null,
        },
      });
    } catch (error) {
      return this.handleError(error, response);
    }
  }

  private static buildSearchWhere(search: string) {
    const tokens = (search ?? "")
      .split(/\s+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (tokens.length === 0) return {};
    return {
      AND: tokens.map((token) => {
        const or: Prisma.UserWhereInput[] = [
          { name:  { contains: token, mode: "insensitive" } },
          { email: { contains: token, mode: "insensitive" } },
        ];
        const role = toRole(token);
        if (role) or.push({ role: { equals: role } });
        const status = toStatus(token);
        if (status) or.push({ status: { equals: status } });
        return { OR: or };
      }),
    } satisfies Prisma.UserWhereInput;
  }

  public static register = async (request: Request<{}, ResponseBody, RegisterRequestBody>, response: Response<ResponseBody>) => {
    try {
      const newUser = await this.createNewUserFromRequest(request);
      return response.status(201).json(newUser);
    } catch (error: unknown) {
      if (isPrismaUniqueError(error)) {
        return response.status(409).json({ error: 'User with such an email already exists' });
      }
      return this.handleError(error, response);
    }
  }

  private static async createNewUserFromRequest(request: Request<{}, ResponseBody, RegisterRequestBody>): Promise<ResponseBody> {
    const { name, email, password } = request.body;
    const passwordHash = await Hash.get(password);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.trim().toLowerCase(),
        password: passwordHash,
      },
      select: ResponseBodySelected,
    });
    return { ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),}
  }

  public static login = async (request: Request<{}, ResponseBody, LoginRequestBody>, response: Response<ResponseBody>) => {
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
      const { password: _omit, createdAt, updatedAt, ...rest } = user;
      const safe = {
        ...rest,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      };
      return response.status(200).json(safe);
    } catch (error) {
      this.handleError(error, response);
    }
  }

  private static handleError(error: unknown, response: Response) {
    if (isError(error)) {
      return response.status(500).json({ error: error.message });
    }
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}