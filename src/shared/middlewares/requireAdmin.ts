import type { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { BACKEND_ERRORS } from "../constants/constants.ts";

export function requireAdmin(request: Request, response: Response, next: NextFunction) {
  if (!request.user) return response.status(401).json({ message: BACKEND_ERRORS.UNAUTHENTICATED });
  if (request.user.role !== Role.ADMIN)
    return response.status(403).json({ message: BACKEND_ERRORS.NOT_ADMIN });
  next();
}
