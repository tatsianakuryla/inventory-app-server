import prisma from "../../db/db.ts";
import { Status } from "@prisma/client";
import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { type ResponseBody, SafeUserSchema, type SafeUser } from "../types/controllers.types.ts";
import { TokensController } from "../tokens.controller.ts";
import { normalizeEmail } from "../../shared/helpers/helpers.ts";
import {
  type FacebookLoginBody,
  type GoogleLoginBody,
  type Provider,
  PROVIDER_FIELD,
} from "./social.types.ts";
import { USER_SELECTED } from "../../shared/constants.ts";
import { Hash } from "../../security/Hash.ts";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID!);

export class SocialController {
  private static async upsertUserByProvider(options: {
    provider: Provider;
    providerUserId: string;
    email: string;
    displayName: string;
  }): Promise<SafeUser> {
    const { provider, providerUserId, email, displayName } = options;
    const providerField = PROVIDER_FIELD[provider];
    let user = await prisma.user.findFirst({
      where: { OR: [{ [providerField]: providerUserId }, { email }] },
      select: USER_SELECTED,
    });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name: displayName, [providerField]: providerUserId },
        select: USER_SELECTED,
      });
    } else if (!user[providerField]) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { [providerField]: providerUserId },
        select: USER_SELECTED,
      });
    }
    const dto = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      language: user.language,
      theme: user.theme,
      version: user.version,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      ...(user.googleId ? { googleId: user.googleId } : {}),
      ...(user.facebookId ? { facebookId: user.facebookId } : {}),
    };
    return SafeUserSchema.parse(dto);
  }

  private static respondWithAuth(
    response: Response<ResponseBody>,
    user: SafeUser
  ) {
    if (user.status === Status.BLOCKED) {
      return response.status(403).json({ error: "User is blocked" });
    }
    const token = TokensController.createTokenForUser(user);
    return response.json({ ...user, token });
  }

  public static async googleLogin(
    request: Request<{}, ResponseBody, GoogleLoginBody>,
    response: Response<ResponseBody>
  ): Promise<Response<ResponseBody>> {
    try {
      const { idToken } = request.body;
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID!,
      });
      const payload = ticket.getPayload();
      if (!payload) return response.status(401).json({ error: "Invalid Google token" });
      const sub = payload.sub!;
      const email = normalizeEmail(payload.email || "");
      if (!email || payload.email_verified !== true) {
        return response.status(400).json({ error: "Google email missing or not verified" });
      }
      const displayName = payload.name?.trim() || email.split("@")[0] || "User";
      const user = await this.upsertUserByProvider({
        provider: "google",
        providerUserId: sub,
        email,
        displayName,
      });
      return this.respondWithAuth(response, user);
    } catch {
      return response.status(401).json({ error: "Google auth failed" });
    }
  }

  public static async facebookLogin(
    request: Request<{}, ResponseBody, FacebookLoginBody>,
    response: Response<ResponseBody>
  ): Promise<Response<ResponseBody>> {
    try {
      const { accessToken } = request.body;
      const appId = process.env.FACEBOOK_APP_ID!;
      const appSecret = process.env.FACEBOOK_APP_SECRET!;
      const appAccessToken = `${appId}|${appSecret}`;
      const debugUrl = new URL("https://graph.facebook.com/debug_token");
      debugUrl.searchParams.set("input_token", accessToken);
      debugUrl.searchParams.set("access_token", appAccessToken);
      const debugResp = await fetch(debugUrl.toString());
      const debugJson = await debugResp.json();
      if (!debugJson?.data?.is_valid) {
        return response.status(401).json({ error: "Invalid Facebook token" });
      }
      const profileUrl = new URL("https://graph.facebook.com/v19.0/me");
      profileUrl.searchParams.set("fields", "id,name,email");
      profileUrl.searchParams.set("access_token", accessToken);
      profileUrl.searchParams.set(
        "appsecret_proof",
        Hash.makeAppSecretProof(accessToken, appSecret)
      );
      const profResp = await fetch(profileUrl.toString());
      const profile: any = await profResp.json();
      const fbId: string | undefined = profile?.id;
      const email = normalizeEmail(profile?.email);
      if (!fbId) return response.status(401).json({ error: "Facebook profile read failed" });
      if (!email) return response.status(400).json({ error: "Facebook email not granted" });
      const displayName = profile?.name?.trim() || email.split("@")[0] || "User";
      const user = await this.upsertUserByProvider({
        provider: "facebook",
        providerUserId: fbId,
        email,
        displayName,
      });
      return this.respondWithAuth(response, user);
    } catch {
      return response.status(401).json({ error: "Facebook auth failed" });
    }
  }
}