import type { Request } from "express";
import { Role } from "@prisma/client";
import type { UserContext } from "../types/schemas.ts";

export function buildUserContext(request: Request): UserContext {
  if (!request.user) return undefined;
  const role = request.user.role ?? Role.USER;
  return { id: request.user.sub, role };
}
