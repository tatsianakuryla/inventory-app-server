import type { Request, Response } from "express";
import prisma from "../db/db.ts";
import { Hash } from '../security/Hash.ts'
import type { RegisterBody, RegisterResponseBody } from "./types.ts";
import { isError, isPrismaUniqueError } from "../shared/typeguards/typeguards.ts";

export class UserControllers {

  public static register = async (request: Request<{}, RegisterResponseBody, RegisterBody>, response: Response<RegisterResponseBody>) => {
    try {
      const newUser = await this.createNewUserFromRequest(request);
      return response.status(201).json(newUser);
    } catch (error: unknown) {
      return this.handleRegisterError(error, response);
    }
  }

  private static async createNewUserFromRequest(request: Request<{}, RegisterResponseBody, RegisterBody>): Promise<RegisterResponseBody> {
    const { name, email, password } = request.body;
    const passwordHash = await Hash.get(password);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.trim().toLowerCase(),
        password: passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        language: true,
        theme: true,
        createdAt: true,
        updatedAt: true,
        version: true,
      }
    });
    return { ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),}
  }

  private static handleRegisterError (error: unknown, response: Response<RegisterResponseBody>) {
    if (isPrismaUniqueError(error)) {
      return response.status(409).json({ error: 'User with such an email already exists' });
    }
    if (isError(error)) return response.status(500).json({error: error.message})
    else return response.status(500).json({ error: 'Internal Server Error' });
  }
}