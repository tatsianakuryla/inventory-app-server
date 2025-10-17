import type { Request, Response, NextFunction } from "express";
import { Role } from '@prisma/client';

export function requireAdmin(request: Request, response: Response, next: NextFunction) {
  if (!response.locals.user) return response.status(401).json({ error: "Unauthenticated" });
  if (response.locals.user.role !== Role.ADMIN) return response.status(403).json({ error: "Not an admin" });
  next();
}