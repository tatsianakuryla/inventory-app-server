import { UNIQUE_VALUE_ERROR_CODE } from "../constants.ts";
import { Prisma } from '@prisma/client';

function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function isPrismaUniqueError(error: unknown): error is Error {
  return isPrismaError(error) && error.code === UNIQUE_VALUE_ERROR_CODE;
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}