import { Prisma } from "@prisma/client";
import {
  FOREIGN_KEY_ERROR_CODE,
  UNIQUE_VALUE_ERROR_CODE,
  VERSION_CONFLICT_ERROR_CODE,
  VERSION_CONFLICT_ERROR_MESSAGE,
} from "../constants/constants.ts";
import { ZodError } from "zod";

function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function isPrismaUniqueError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return isPrismaError(error) && error.code === UNIQUE_VALUE_ERROR_CODE;
}

export function isPrismaForeignKeyError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return isPrismaError(error) && error.code === FOREIGN_KEY_ERROR_CODE;
}

export function isPrismaVersionConflictError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    isPrismaError(error) &&
    (error.code === VERSION_CONFLICT_ERROR_CODE || error.message === VERSION_CONFLICT_ERROR_MESSAGE)
  );
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}
