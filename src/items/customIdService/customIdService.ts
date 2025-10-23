import { randomUUID, randomInt } from "crypto";
import type { PrismaTransaction } from "../shared/types/schemas.ts";

const IdElementType = {
  FIXED_TEXT: "FIXED_TEXT",
  RANDOM_20BIT: "RANDOM_20BIT",
  RANDOM_32BIT: "RANDOM_32BIT",
  RANDOM_6DIGIT: "RANDOM_6DIGIT",
  RANDOM_9DIGIT: "RANDOM_9DIGIT",
  GUID: "GUID",
  DATETIME: "DATETIME",
  SEQUENCE: "SEQUENCE",
} as const;

type IdElementType = (typeof IdElementType)[keyof typeof IdElementType];

interface IdElement {
  type: IdElementType;
  value?: string;
  format?: string;
  leadingZeros?: boolean;
  separator?: string;
}

interface CustomIdFormatSchema {
  maxLength?: number;
  elements: IdElement[];
}

export class CustomIdService {
  public static async generate(tx: PrismaTransaction, inventoryId: string): Promise<string> {
    const idFormat = await tx.inventoryIdFormat.findUnique({
      where: { inventoryId },
      select: { schema: true },
    });
    if (!idFormat?.schema) return randomUUID();
    const schema = idFormat.schema as unknown as CustomIdFormatSchema;
    if (!schema.elements?.length) return randomUUID();
    const now = new Date();
    const parts: string[] = [];
    for (let i = 0; i < schema.elements.length; i++) {
      const element = schema.elements[i];
      if (!element) continue;
      const part = await this.generateElement(tx, inventoryId, element, now);
      parts.push(part);
      const isLast = i === schema.elements.length - 1;
      if (!isLast && element.separator) parts.push(element.separator);
    }
    const id = parts.join("");
    if (schema.maxLength && id.length > schema.maxLength) {
      throw new Error(`Generated ID exceeds maxLength (${schema.maxLength})`);
    }
    return id;
  }

  private static async generateElement(
    tx: PrismaTransaction,
    inventoryId: string,
    element: IdElement,
    now: Date,
  ): Promise<string> {
    switch (element.type) {
      case IdElementType.FIXED_TEXT:
        return element.value || "";
      case IdElementType.RANDOM_20BIT: {
        const number = randomInt(0, 1 << 20);
        return element.leadingZeros ? String(number).padStart(7, "0") : String(number);
      }
      case IdElementType.RANDOM_32BIT: {
        const number = randomInt(0, 2 ** 32);
        return element.leadingZeros ? String(number).padStart(10, "0") : String(number);
      }
      case IdElementType.RANDOM_6DIGIT: {
        const number = randomInt(0, 1_000_000);
        return String(number).padStart(6, "0");
      }
      case IdElementType.RANDOM_9DIGIT: {
        const number = randomInt(0, 1_000_000_000);
        return String(number).padStart(9, "0");
      }
      case IdElementType.GUID:
        return randomUUID();
      case IdElementType.DATETIME: {
        const format = element.format || "YYYYMMDD";
        return this.formatDate(now, format);
      }
      case IdElementType.SEQUENCE: {
        const scopeKey = "global";
        await tx.inventoryIdCounter.upsert({
          where: { inventoryId_scopeKey: { inventoryId, scopeKey } },
          create: { inventoryId, scopeKey, value: 0 },
          update: {},
        });
        const updated = await tx.inventoryIdCounter.update({
          where: { inventoryId_scopeKey: { inventoryId, scopeKey } },
          data: { value: { increment: 1 } },
          select: { value: true },
        });
        const nextSeq = updated.value;
        return element.leadingZeros ? String(nextSeq).padStart(6, "0") : String(nextSeq);
      }
      default:
        return "";
    }
  }

  private static formatDate(now: Date, format: string): string {
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const hh = String(now.getUTCHours()).padStart(2, "0");
    const mi = String(now.getUTCMinutes()).padStart(2, "0");
    const ss = String(now.getUTCSeconds()).padStart(2, "0");
    switch (format) {
      case "ISO":
        return now.toISOString();
      case "timestamp":
        return String(now.getTime());
      case "YYYY":
        return yyyy;
      case "YYYY-MM":
        return `${yyyy}-${mm}`;
      case "YYYYMM":
        return `${yyyy}${mm}`;
      case "YYYY-MM-DD":
        return `${yyyy}-${mm}-${dd}`;
      case "YYYYMMDD":
        return `${yyyy}${mm}${dd}`;
      case "HH:MM:SS":
        return `${hh}:${mi}:${ss}`;
      case "HHMMSS":
        return `${hh}${mi}${ss}`;
      default:
        return `${yyyy}${mm}${dd}`;
    }
  }
}
