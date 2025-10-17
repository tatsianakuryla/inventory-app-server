import type { Request, Response, NextFunction } from "express";
import { Status } from '@prisma/client';

export function requireNotBlocked(request: Request, response: Response, next: NextFunction) {
  if (!response.locals.user) return response.status(401).json({ error: "Unauthenticated" });
  if (response.locals.status === Status.BLOCKED) return response.status(403).json({ error: "Blocked user" });
  next();
}