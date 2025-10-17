import type { Request, Response, NextFunction } from "express";
import { TokensController } from "../../controllers/tokens.controller.ts";
import { isTokenExpiredError } from "../typeguards/typeguards.ts";
import prisma from "../../db/db.ts";

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const token = TokensController.getBearer(request);
  if (!token) return response.status(401).json({ error: "Unauthenticated" });
  try {
    const payload = TokensController.verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return response.status(401).json({ error: "Unauthorized" });
    request.user = payload;
    response.locals.user = user;
    return next();
  } catch (error) {
    if (isTokenExpiredError(error)) return response.status(401).json({ error: "Token expired" });
    return response.status(401).json({ error: "Invalid token" });
  }
}