import jwt from "jsonwebtoken";
import type { RoleFromEnum, StatusFromEnum } from "../types/types.js";

export const toRole = (role: string): RoleFromEnum | null => {
  const userRole = role.toUpperCase();
  return (userRole === "USER" || userRole === "ADMIN") ? userRole : null;
};

export const toStatus = (status: string): StatusFromEnum | null => {
  const userStatus = status.toUpperCase();
  return (userStatus === "BLOCKED" || userStatus === "ACTIVE") ? userStatus : null;
};

type ExpiresIn = NonNullable<jwt.SignOptions["expiresIn"]>;

export const toExpiresIn = (value: string | number | undefined, fallback: ExpiresIn): ExpiresIn => {
  return (value ?? fallback) as ExpiresIn;
}

export function isTokenExpiredError(error: unknown): boolean {
  return error instanceof jwt.TokenExpiredError;
}