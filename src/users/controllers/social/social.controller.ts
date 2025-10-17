import prisma from "../../../shared/db/db.ts";
import { googleClient } from "../../../shared/googleClient/googleClient.ts";
import { Status, Role } from "@prisma/client";
import type { Request, Response } from "express";
import { type ResponseBody, type SafeUser } from "../types/controllers.types.ts";
import { TokenController } from "../token/token.controller.ts";
import { normalizeEmail } from "../../helpers/helpers.ts";
import {
  type FacebookLoginBody,
  type GoogleLoginBody,
  type Provider,
  PROVIDER_FIELD,
} from "./social.types.ts";
import { USER_SELECTED } from "../../shared/constants.ts";
import { Hash } from "../../security/Hash.ts";
import { SUPERADMINS } from "../../shared/constants.ts";
import { fbDebugUrl, fbProfileUrl}  from "./social.constants.ts";

export class SocialController {

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
      const email = normalizeEmail(payload?.email || "");
      if (!email || payload.email_verified !== true) {
        return response.status(400).json({ error: "Google email missing or not verified" });
      }
      const displayName = payload.name?.trim() || email.split("@")[0] || "User";
      const user = await this.findOrCreateUserByProvider("google", payload.sub!, email, displayName);
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
      const debugJson = await this.getFbDebugJson(accessToken);
      if (!debugJson?.data?.is_valid) {
        return response.status(401).json({ error: "Invalid Facebook token" });
      }
      if (debugJson?.data?.app_id !== process.env.FACEBOOK_APP_ID) {
        return response.status(401).json({ error: "Facebook token app mismatch" });
      }
      const profile = await this.getFbProfileUrl(accessToken);
      const fbId: string | undefined = profile?.id;
      const email = normalizeEmail(profile?.email || '');
      if (!fbId) return response.status(401).json({ error: "Facebook profile read failed" });
      if (!email) return response.status(400).json({ error: "Facebook email not granted" });
      const displayName = profile?.name?.trim() || email.split("@")[0] || "User";
      const user = await this.findOrCreateUserByProvider("facebook", fbId, email, displayName);
      return this.respondWithAuth(response, user);
    } catch {
      return response.status(401).json({ error: "Facebook auth failed" });
    }
  }

  private static async getFbDebugJson(accessToken: string) {
    const appAccessToken = `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`;
    const newDebugURL = new URL(fbDebugUrl);
    newDebugURL.searchParams.set("input_token", accessToken);
    newDebugURL.searchParams.set("access_token", appAccessToken);
    const response = await fetch(newDebugURL.toString());
    return await response.json();
  }

  private static async getFbProfileUrl(accessToken: string) {
    const newFbProfileUrl = new URL(fbProfileUrl);
    newFbProfileUrl.searchParams.set("fields", "id,name,email");
    newFbProfileUrl.searchParams.set("access_token", accessToken);
    newFbProfileUrl.searchParams.set(
      "appsecret_proof",
      Hash.makeAppSecretProof(accessToken, process.env.FACEBOOK_APP_SECRET!)
    );
    const response = await fetch(newFbProfileUrl.toString());
    return await response.json();
  }

  private static async findOrCreateUserByProvider(
    provider: Provider,
    providerUserId: string,
    email: string,
    displayName: string,
  ): Promise<SafeUser> {
    const providerField = PROVIDER_FIELD[provider];
    const user = await prisma.$transaction(async (transactionClient) => {
      const userByProvider = await transactionClient.user.findFirst({
        where: { [providerField]: providerUserId },
        select: USER_SELECTED,
      });
      if (userByProvider) return userByProvider;
      const userByEmail = await transactionClient.user.findUnique({
        where: { email },
        select: USER_SELECTED,
      });
      if (userByEmail) {
        const needsPromote = SUPERADMINS.has(email) && userByEmail.role !== Role.ADMIN;
        return transactionClient.user.update({
          where: { id: userByEmail.id },
          data: {
            [providerField]: providerUserId,
            ...(needsPromote ? { role: Role.ADMIN } : {}),
          },
          select: USER_SELECTED,
        });
      }
      const role = SUPERADMINS.has(email) ? Role.ADMIN : Role.USER;
      return transactionClient.user.create({
        data: { email, name: displayName, [providerField]: providerUserId, role },
        select: USER_SELECTED,
      });
    });
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private static respondWithAuth(
    response: Response<ResponseBody>,
    user: SafeUser
  ) {
    if (user.status === Status.BLOCKED) {
      return response.status(403).json({ error: "User is blocked" });
    }
    const token = TokenController.createTokenForUser(user);
    return response.json({ ...user, token });
  }
}