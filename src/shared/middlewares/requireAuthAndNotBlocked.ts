import type { Request, Response, NextFunction } from "express";
import { TokenController } from "../../users/controllers/token/token.controller.ts";
import { isTokenExpiredError } from "../../users/shared/typeguards/typeguards.ts";
import prisma from "../db/db.ts";
import { Status } from "@prisma/client";
import { BACKEND_ERRORS } from "../constants/constants.ts";

export async function requireAuthAndNotBlocked(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const token = TokenController.getTokenFromRequest(request);
  if (!token) return response.status(401).json({ message: BACKEND_ERRORS.UNAUTHENTICATED });

  try {
    const payload = TokenController.verifyAccessToken(token);
    if (!payload?.sub) {
      return response.status(401).json({ message: BACKEND_ERRORS.INVALID_TOKEN });
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, status: true },
    });
    if (!user) {
      return response.status(410).json({ message: BACKEND_ERRORS.USER_DELETED });
    }

    if (user.status === Status.BLOCKED) {
      return response.status(403).json({ message: BACKEND_ERRORS.USER_BLOCKED });
    }
    request.user = { ...payload, sub: user.id, role: user.role };
    return next();
  } catch (error) {
    if (isTokenExpiredError(error)) {
      return response.status(401).json({ message: BACKEND_ERRORS.TOKEN_EXPIRED });
    }
    return response.status(401).json({ message: BACKEND_ERRORS.INVALID_TOKEN });
  }
}
