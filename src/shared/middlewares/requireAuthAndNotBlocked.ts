import type { Request, Response, NextFunction } from "express";
import { TokenController } from "../../users/controllers/token/token.controller.ts";
import { isTokenExpiredError } from "../../users/shared/typeguards/typeguards.ts";
import prisma from "../db/db.ts";
import { Status } from "@prisma/client";

export async function requireAuthAndNotBlocked(request: Request, response: Response, next: NextFunction) {
  const token = TokenController.getBearer(request);
  if (!token) return response.status(401).json({ error: "Unauthenticated" });
  try {
    const payload = TokenController.verifyAccessToken(token);
    if (!payload?.sub) return response.status(401).json({ error: "Invalid token" });
    const user = await prisma.user.findUnique(
      { where: { id: payload.sub },
        select: { id: true, role: true, status: true, version: true }
      });
    if (!user) return response.status(401).json({ error: "Unauthorized" });
    if (user.status === Status.BLOCKED) {
      return response.status(403).json({ error: "User is blocked" });
    }
    request.user = { ...payload, sub: user.id, role: user.role };
    return next();
  } catch (error) {
    if (isTokenExpiredError(error)) return response.status(401).json({ error: "Token expired" });
    return response.status(401).json({ error: "Invalid token" });
  }
}