import type { Request, Response, NextFunction } from "express";
import { TokensController } from "../../controllers/tokens.controller.ts";


export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const token = TokensController.getBearer(request);
  if (!token) return response.status(401).json({ error: "Unauthenticated" });
  try {
    request.user = TokensController.verifyAccessToken(token);
    return next();
  } catch {
    return response.status(401).json({ error: "Invalid or expired token" });
  }
}