import type { Response } from "express";
import { isError } from "../typeguards/typeguards.ts";
import { Prisma } from '@prisma/client';
import { Email, type UsersQuery } from '../../controllers/types.ts';

export function handleError(error: unknown, response: Response) {
  if (isError(error)) {
    return response.status(500).json({ error: error.message });
  }
  return response.status(500).json({ error: 'Internal Server Error' });
}

export function toUserOrderBy(
  sortBy: UsersQuery['sortBy'],
  order: UsersQuery['order']
): Prisma.UserOrderByWithRelationInput {
  switch (sortBy) {
    case 'name':      return { name: order };
    case 'email':     return { email: order };
    case 'role':      return { role: order };
    case 'status':    return { status: order };
    case 'createdAt': return { createdAt: order };
    case 'updatedAt': return { updatedAt: order };
    default: {
      return { createdAt: 'desc' };
    }
  }
}

export function toAutocompleteOrderBy(
  sortBy: 'name'|'email',
  order: 'asc'|'desc'
): Prisma.UserOrderByWithRelationInput {
  return sortBy === 'name' ? { name: order } : { email: order };
}

export function getAdminEmails(): Set<string> {
  const raw =
    process.env.SUPERADMIN_EMAILS ??
    process.env.SUPERADMIN_EMAIL ??
    "";
  const emails = raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email) => Email.parse(email))
    .filter((email) => email !== "");
  return new Set(emails);
}

export function envStrict(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}