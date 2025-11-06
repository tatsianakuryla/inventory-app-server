import jwt from "jsonwebtoken";
import ms from "ms";
import { envStrict } from "../../shared/helpers/helpers.ts";
import { toExpiresIn } from "../../shared/typeguards/typeguards.ts";
import { type Payload, PayloadSchema, type UserForToken } from "../types/controllers.types.ts";
import { type Request, type Response } from "express";
import { BACKEND_ERRORS, AUTH_COOKIE_NAME } from "../../../shared/constants/constants.ts";

const ACCESS_TTL = toExpiresIn(process.env.ACCESS_TTL?.trim(), ms("120m"));
const JWT_SECRET = envStrict("JWT_SECRET");

export class TokenController {
  private static signAccessToken(payload: Payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TTL,
      algorithm: "HS256",
      issuer: "inventory-app",
    });
  }

  public static verifyAccessToken(token: string): Payload {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "inventory-app",
      clockTolerance: 10,
    });
    const parsed = PayloadSchema.safeParse(decoded);
    if (!parsed.success) throw new Error(BACKEND_ERRORS.INVALID_TOKEN);
    return parsed.data;
  }

  public static getTokenFromRequest(request: Request): string | null {
    const cookieToken = request.cookies?.[AUTH_COOKIE_NAME];
    if (cookieToken) return cookieToken;
    const header = request.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) return null;
    return header.slice(7).trim();
  }

  public static createTokenForUser(user: UserForToken) {
    return this.signAccessToken({ sub: user.id, role: user.role });
  }

  public static setAuthCookie(response: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === "production";
    const maxAge = typeof ACCESS_TTL === "string" ? ms(ACCESS_TTL) : ACCESS_TTL * 1000;
    
    response.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge,
      path: "/",
    });
  }

  public static clearAuthCookie(response: Response): void {
    const isProduction = process.env.NODE_ENV === "production";
    response.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });
  }
}