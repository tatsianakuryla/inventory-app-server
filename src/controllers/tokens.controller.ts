import jwt from "jsonwebtoken";
import ms from "ms";
import { envStrict } from "../shared/helpers/helpers.ts";
import {toExpiresIn} from "../shared/typeguards/typeguards.ts";
import { type AppJwtPayload, AppJwtPayloadSchema } from "./types.ts";
import { type Request } from "express";

const ACCESS_TTL = toExpiresIn(process.env.ACCESS_TTL?.trim(), ms('120m'));
const JWT_SECRET = envStrict("JWT_SECRET");

export class TokensController {
    public static signAccessToken(payload: AppJwtPayload) {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: ACCESS_TTL,
            algorithm: "HS256",
            issuer: "inventory-app",
        });
    }

    public static verifyAccessToken(token: string): AppJwtPayload {
        const decoded = jwt.verify(token, JWT_SECRET, {
            algorithms: ["HS256"],
            issuer: "inventory-app",
            clockTolerance: 10,
        });
        const parsed = AppJwtPayloadSchema.safeParse(decoded);
        if (!parsed.success) throw new Error("Invalid token payload");
        return parsed.data;
    }

    public static getBearer(request: Request) {
        const header = request.headers.authorization;
        if (!header || !header.startsWith("Bearer ")) return null;
        return header.slice(7).trim();
    }
}