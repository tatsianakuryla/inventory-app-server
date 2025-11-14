import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default prisma;

export const DEFAULT_ID_SCHEMA = {
  maxLength: 96,
  elements: [
    { type: "FIXED_TEXT", value: "INV", separator: "-" },
    { type: "DATETIME", format: "YYYYMMDD", separator: "-" },
    { type: "SEQUENCE", leadingZeros: true },
  ],
} as const;
