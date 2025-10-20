import type { Request, Response } from "express";
import prisma from "../../../shared/db/db.ts";
import { handleError, toUserOrderBy } from "../../shared/helpers/helpers.ts";
import { Prisma, Role, Status } from "@prisma/client";
import { toRole, toStatus } from "../../shared/typeguards/typeguards.ts";
import { SUPERADMINS, USER_SELECTED } from "../../shared/constants/constants.ts";
import type {
  IdsBody,
  UpdateUserProfile,
  UpdateUsersRequest,
  UpdateUsersResponse, UserBasic,
  UsersQuery
} from "../types/controllers.types.ts";

export class AdminUsersController {

  public static getUsers = async (
    request: Request,
    response: Response<any, { query: UsersQuery }>
  ) => {
    try {
      const {
        sortBy = "createdAt",
        order = "desc",
        search = "",
        page = 1,
        perPage = 20,
      } = response.locals.query;
      const finalPage = Math.max(1, Number(page) || 1);
      const take = Math.max(1, Number(perPage) || 20);
      const skip = (finalPage - 1) * take;
      const cleanSearch = (search ?? "").trim();
      const where = this.buildSearchWhere(cleanSearch);
      const [rawItems, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          select: USER_SELECTED,
          orderBy: toUserOrderBy(sortBy, order),
          skip,
          take,
        }),
        prisma.user.count({where}),
      ]);
      const users = rawItems.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      }));
      const hasMore = skip + rawItems.length < total;
      const totalPages = Math.max(1, Math.ceil(total / take));
      return response.json({
        users,
        meta: {
          page: finalPage,
          perPage: take,
          total,
          totalPages,
          sortBy,
          order,
          search: cleanSearch,
          hasMore,
        },
      });
    } catch (error) {
      return handleError(error, response);
    }
  }

  private static buildSearchWhere(search: string) {
    const tokens = (search ?? "")
      .split(/\s+/)
      .map((s) => s.trim())
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
      const payload: UpdateUsersRequest = request.body;
      let allowedIds: string[] = payload.map((user) => user.id);
      let preSkippedIds: string[] = [];
      if (statusToUpdate === Status.BLOCKED) {
        const currentUserId = request.user?.sub ?? "";
        const { allowedIds: allowed, preSkippedIds: skipped } =
          await this.filterProtectedUserIds(allowedIds, currentUserId);
        allowedIds = allowed;
        preSkippedIds = skipped;
      }
      const allowedSet = new Set(allowedIds);
      const filteredPayload: UpdateUsersRequest = payload.filter((user) => allowedSet.has(user.id));
      const updates = filteredPayload.map(({ id, version }: UpdateUserProfile) =>
        prisma.user.updateMany({
          where: { id, version, status: { not: statusToUpdate } },
          data: { status: statusToUpdate, version: { increment: 1 } },
        })
      );
      const { updatedIds, trSkippedIds } =
        await this.getTransactionResults(filteredPayload, updates);
      const skippedIds = Array.from(new Set([...trSkippedIds, ...preSkippedIds]));
      const pre = `${updatedIds.length} users were ${message}`;
      const info = skippedIds.length > 0
        ? `${pre} from ${payload.length}; ${skippedIds.length} skipped due to restrictions, version mismatch, or already had this status.`
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

  public static async promote(request: Request, response: Response) {
    return this.updateRole(request, response, Role.ADMIN);
  }

  public static async demote(request: Request, response: Response) {
    return this.updateRole(request, response, Role.USER);
  }

  public static async remove(
    request: Request<{}, any, IdsBody>,
    response: Response
  ) {
    try {
      const { ids } = request.body;
      const currentUserId = request.user?.sub ?? "";
      const { allowedIds, preSkippedIds } =
        await this.filterProtectedUserIds(ids, currentUserId);
      let deleted = 0;
      if (allowedIds.length > 0) {
        const result = await prisma.user.deleteMany({
          where: { id: { in: allowedIds } },
        });
        deleted = result.count;
      }
      return response.json({
        deleted,
        skipped: preSkippedIds.length,
        skippedIds: preSkippedIds,
      });
    } catch (error) {
      return handleError(error, response);
    }
  }

  private static async updateRole(
    request: Request<{}, UpdateUsersResponse, UpdateUsersRequest>,
    response: Response<UpdateUsersResponse>,
    targetRole: Role,
  ): Promise<Response<UpdateUsersResponse>> {
    try {
      const { allowedIds, preSkippedIds } = await this.filterAllowedIdsForRoleUpdate(request, targetRole);
      const itemsToUpdate = request.body.filter((user) => allowedIds.includes(user.id));
      const updateQueries = itemsToUpdate.map(({ id, version }) =>
        prisma.user.updateMany({
          where: { id, version, role: { not: targetRole } },
          data: { role: targetRole, version: { increment: 1 } },
        })
      );
      const { updatedIds, trSkippedIds } =
        await this.getTransactionResults(itemsToUpdate, updateQueries);
      const skippedIds = Array.from(new Set([...preSkippedIds, ...trSkippedIds]));
      const pre = `${updatedIds.length} users were updated`;
      const message = skippedIds.length
        ? `${pre} from ${request.body.length}; ${skippedIds.length} skipped due to restrictions, version mismatch, or already had the role.`
        : pre;
      return response.json({
        updated: updatedIds.length,
        updatedIds,
        skipped: skippedIds.length,
        skippedIds,
        message,
      });
    } catch (error) {
      return handleError(error, response);
    }
  }

  private static async getUsersWithIds(ids: string[]): Promise<UserBasic[]> {
    return prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, role: true, status: true, email: true },
    });
  }

  private static async filterProtectedUserIds(ids: string[], meId?: string) {
    const { userById, allowedIds, preSkippedIds} = await this.buildUserGuardContext(ids);
    for (const id of ids) {
      const user = userById.get(id);
      if (!user) { preSkippedIds.push(id); continue; }
      if (id === meId) { preSkippedIds.push(id); continue; }
      if (SUPERADMINS.has(user.email)) { preSkippedIds.push(id); continue; }
      allowedIds.push(id);
    }
    return { allowedIds, preSkippedIds };
  }

  private static async filterAllowedIdsForRoleUpdate(request: Request<{}, any, UpdateUsersRequest>, targetRole: Role): Promise<{allowedIds: string[], preSkippedIds: string[]}> {
    const requestItems: UpdateUsersRequest = request.body;
    const currentUserId = request.user?.sub ?? "";
    const fetchedUsers = await this.getUsersWithIds(requestItems.map((user) => user.id));
    const usersMap = new Map(fetchedUsers.map((user) => [user.id, user]));
    const allowedIds: string[] = [];
    const preSkippedIds: string[] = [];
    for (const { id } of requestItems) {
      const foundUser = usersMap.get(id);
      if (!foundUser) { preSkippedIds.push(id); continue; }
      if (SUPERADMINS.has(foundUser.email)) { preSkippedIds.push(id); continue; }
      if (id === currentUserId && !(foundUser.role === Role.ADMIN && targetRole === Role.USER)) {
        preSkippedIds.push(id);
        continue;
      }
      allowedIds.push(id);
    }
    return { allowedIds, preSkippedIds };
  }

  private static async buildUserGuardContext(ids: string[]): Promise<{
    userById: Map<string, UserBasic>;
    allowedIds: string[];
    preSkippedIds: string[];
  }> {
    if (!ids.length) return { userById: new Map(), allowedIds: [], preSkippedIds: [] };
    const users = await this.getUsersWithIds(ids);
    const userById = new Map(users.map((user) => [user.id, user]));
    return { userById, allowedIds: [], preSkippedIds: [] };
  }

  private static async getTransactionResults(payload: UpdateUsersRequest, updated: Prisma.PrismaPromise<Prisma.BatchPayload>[]): Promise<{ updatedIds: string[]; trSkippedIds: string[] }> {
    const preResults = await prisma.$transaction(updated);
    const results = preResults.map((result, index) => ({
      id: payload[index]!.id,
      updated: result.count === 1,
    }))
    const updatedIds = results.filter((result) => result.updated).map((result) => result.id);
    const trSkippedIds = results.filter((result) => !result.updated).map((result) => result.id);
    return { updatedIds, trSkippedIds }
  }
}