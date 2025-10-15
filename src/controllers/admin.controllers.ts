import type { Request, Response } from "express";
import prisma from "../db/db.ts";
import { handleError, toUserOrderBy } from "../shared/helpers/helpers.ts";
import { Prisma, Role, Status } from "@prisma/client";
import { toRole, toStatus} from "../shared/typeguards/typeguards.ts";
import { ResponseBodySelected } from "../shared/constants.ts";
import type {IdsBody, UpdateUserProfile, UpdateUsersRequest, UpdateUsersResponse, UsersQuery} from "./types.ts";

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

  private static async updateStatus(
    request: Request<{}, UpdateUsersResponse, UpdateUsersRequest>,
    response: Response<UpdateUsersResponse>,
    statusToUpdate: Status,
    message: string
  ): Promise<Response<UpdateUsersResponse>> {
    try {
      const payload = request.body;
      const updated = payload.map(({ id, version }: UpdateUserProfile) =>
        prisma.user
          .updateMany({
            where: { id, version, status: { not: statusToUpdate } },
            data: { status: statusToUpdate, version: { increment: 1 } },
          })
      );
      const { updatedIds, skippedIds } = await this.getTransactionResults(payload, updated);
      const pre = `${updatedIds.length} users were ${message}`;
      const info = skippedIds.length > 0
        ? `${pre} from ${payload.length}; ${skippedIds.length} skipped due to version mismatch or already had this status.`
        : pre;
      return response.json({
        updated: updatedIds.length,
        updatedIds,
        skipped: skippedIds.length,
        skippedIds,
        message: info,
      });
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

  private static async updateRole(
    request: Request<{}, UpdateUsersResponse, UpdateUsersRequest>,
    response: Response<UpdateUsersResponse>,
    role: Role,
  ): Promise<Response<UpdateUsersResponse>>{
    try {
      const payload = request.body;
      const updated = payload.map(({id, version}: UpdateUserProfile) =>
        prisma.user
          .updateMany({
            where: { id, version, role: { not: role } },
            data: { role: role, version: { increment: 1 } },
          })
      );
      const { updatedIds, skippedIds } = await this.getTransactionResults(payload, updated);
      const pre = `${updatedIds.length} users were updated`;
      const info = skippedIds.length > 0
        ? `${pre} from ${payload.length}; ${skippedIds.length} skipped due to version mismatch or already had the role.`
        : pre;
      return response.json({
        updated: updatedIds.length,
        updatedIds,
        skipped: skippedIds.length,
        skippedIds,
        message: info,
      });
    } catch (error) {
      return handleError(error, response);
    }
  }

  private static async getTransactionResults(payload: UpdateUsersRequest, updated: Prisma.PrismaPromise<Prisma.BatchPayload>[]): Promise<{ updatedIds: string[]; skippedIds: string[] }> {
    const preResults = await prisma.$transaction(updated);
    const results = preResults.map((result, index) => ({
      id: payload[index]!.id,
      updated: result.count === 1,
    }))
    const updatedIds = results.filter((result) => result.updated).map((result) => result.id);
    const skippedIds = results.filter((result) => !result.updated).map((result) => result.id);
    return { updatedIds, skippedIds }
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