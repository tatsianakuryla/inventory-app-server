import type { Response } from "express";
import { isError } from "../typeguards/typeguards.ts";
import { Prisma } from '@prisma/client';
import type { UsersQuery } from '../../controllers/types.ts';

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