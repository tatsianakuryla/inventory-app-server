import type { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

export function requireAdmin(request: Request, response: Response, next: NextFunction) {
  if (!request.user) return response.status(401).json({ error: "Unauthenticated" });
  if (request.user.role !== Role.ADMIN) return response.status(403).json({ error: "Not an admin" });
  next();
}
