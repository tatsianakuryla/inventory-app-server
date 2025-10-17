import bcrypt from 'bcryptjs';
import { HASH_WORK_FACTOR } from '../shared/constants.ts';
import { createHmac } from "node:crypto";

export class Hash {
  public static async get(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(HASH_WORK_FACTOR);
    return bcrypt.hashSync(password, salt);
  }

  public static async verifyPassword(password: string, compare: string): Promise<boolean> {
    return await bcrypt.compare(password, compare);
  }

  public static makeAppSecretProof(accessToken: string, appSecret: string): string {
    return createHmac("sha256", appSecret).update(accessToken).digest("hex");
  }
}