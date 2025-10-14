import { UNIQUE_VALUE_ERROR_CODE } from "../constants.ts";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import type { RoleFromEnum, StatusFromEnum } from "../types/types.js";

function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function isPrismaUniqueError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return isPrismaError(error) && error.code === UNIQUE_VALUE_ERROR_CODE;
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

export const toRole = (role: string): RoleFromEnum | null => {
  const userRole = role.toUpperCase();
  return (userRole === "USER" || userRole === "ADMIN") ? userRole : null;
};

export const toStatus = (status: string): StatusFromEnum | null => {
  const userStatus = status.toUpperCase();
  return (userStatus === "BLOCKED" || userStatus === "ACTIVE") ? userStatus : null;
};