import type { Request, Response } from "express";
import prisma from "../db/db.ts";
import { handleError, toUserOrderBy } from "../shared/helpers/helpers.ts";
import { Prisma, Role, Status } from "@prisma/client";
import { toRole, toStatus } from "../shared/typeguards/typeguards.ts";
import { ResponseBodySelected } from "../shared/constants.ts";
import type { IdsBody, UsersQuery} from "./types.js";

export class AdminUsersController {

  static getUsers = async (request: Request, response: Response) => {
    try {
      const { sortBy = 'createdAt', order = 'desc', search = '', page = 1, perPage = 20 }: UsersQuery  = response.locals.query;
      const skip = (page - 1) * perPage;
      const take = perPage;
      const orderBy = toUserOrderBy(sortBy, order);
      const where = this.buildSearchWhere(search);
      const [rawItems, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          select: ResponseBodySelected,
          orderBy,
          skip, take,
        }),
        prisma.user.count({ where }),
      ]);
      const users = rawItems.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }));
      return response.json({
        users,
        meta: {
          page, perPage, total,
          totalPages: Math.max(1, Math.ceil(total / perPage)),
          sortBy, order, search: search ?? null,
        },
      });
    } catch (error) {
      return handleError(error, response);
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

  private static async updateStatus(request: Request, response: Response, statusToUpdate: Status, message: string) {
    try {
      const { ids }: IdsBody = request.body;
      const result = await prisma.user.updateMany({
        where: { id: { in: ids }, status: { not: statusToUpdate } },
        data: { status: statusToUpdate },
      });
      return response.json({ updated: result.count, message: `${result.count} users have been ${message}` });
    } catch (error) {
      return handleError(error, response);
    }
  }

  public static async block(request: Request, response: Response) {
    return this.updateStatus(request, response, Status.BLOCKED, 'blocked');
  }

  public static async unblock(request: Request, response: Response) {
    return this.updateStatus(request, response, Status.ACTIVE, 'unblocked');
  }

  private static async updateRole(request: Request, response: Response, role: Role) {
    try {
      const { ids }: IdsBody = request.body;
      const result = await prisma.user.updateMany({
        where: { id: { in: ids }, role: { not: role} },
        data: { role: role },
      });
      return response.json({ updated: result.count, message: `Roles were updated for ${result.count} users`});
    } catch (error) {
      return handleError(error, response);
    }
  }

  public static async promote(request: Request, response: Response) {
    return this.updateRole(request, response, Role.ADMIN);
  }

  public static async demote(request: Request, response: Response) {
    return this.updateRole(request, response, Role.USER);
  }

  static async remove(request: Request, response: Response) {
    try {
      const { ids }: IdsBody = request.body;
      const result = await prisma.user.deleteMany({
        where: { id: { in: ids } },
      });
      return response.json({ deleted: result.count });
    } catch (error) { return handleError(error, response); }
  }
}