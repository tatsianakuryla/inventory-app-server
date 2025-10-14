import type {Request, Response} from "express";
import prisma from "../db/db.ts";
import {handleError, toUserOrderBy} from "../shared/helpers/helpers.ts";
import { Prisma } from "@prisma/client";
import { toRole, toStatus } from "../shared/typeguards/typeguards.ts";
import { ResponseBodySelected } from "../shared/constants.ts";
import type { UsersQuery } from "./types.js";

export class AdminUsersController {

  static getUsers = async (request: Request, response: Response) => {
    try {
      const { sortBy = 'createdAt', order = 'desc', search = '', page = 1, perPage = 20 }: UsersQuery  = response.locals.query;
      const skip = (page - 1) * perPage;
      const take = perPage;
      const orderBy = toUserOrderBy(sortBy, order);
      const where = this.buildSearchWhere(search);
      const [items, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          select: ResponseBodySelected,
          orderBy,
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
      handleError(error, response);
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
}