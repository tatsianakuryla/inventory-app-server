import { randomUUID, randomInt } from "crypto";
import type { PrismaTransaction } from "../../items/shared/types/items.schemas.ts";

const CustomIdElementType = {
  FIXED_TEXT: "FIXED_TEXT",
  RANDOM_20BIT: "RANDOM_20BIT",
  RANDOM_32BIT: "RANDOM_32BIT",
  RANDOM_6DIGIT: "RANDOM_6DIGIT",
  RANDOM_9DIGIT: "RANDOM_9DIGIT",
  GUID: "GUID",
  DATETIME: "DATETIME",
  SEQUENCE: "SEQUENCE",
} as const;

type SqlParam = string | number;

type CustomIdElement = (typeof CustomIdElementType)[keyof typeof CustomIdElementType];

type CustomIdFormatSchema = {
  maxLength?: number;
  elements: CustomIdPart[];
};

type CustomIdPart = {
  type: CustomIdElement;
  value?: string;
  format?: string;
  leadingZeros?: boolean;
  separator?: string;
  sequenceName?: string;
};

export class CustomIdService {
  public static async generate(
    transactionClient: PrismaTransaction,
    inventoryId: string,
  ): Promise<string> {
    const formatSchema: CustomIdFormatSchema = await this.readFormatSchema(
      transactionClient,
      inventoryId,
    );
    this.assertExactlyOneSequence(formatSchema);
    const generationMoment: Date = new Date();
    const maximumExistingSequenceValue: number = await this.readMaximumExistingSequence(
      transactionClient,
      inventoryId,
      formatSchema,
    );

    const sequenceScopeKey: string =
      this.findSequenceElement(formatSchema)?.sequenceName || "default";

    await this.ensureCounterRowExists(transactionClient, inventoryId, sequenceScopeKey);
    await transactionClient.$executeRawUnsafe(
      `UPDATE "InventoryIdCounter"
       SET value = GREATEST(value, $1)
       WHERE "inventoryId" = $2 AND "scopeKey" = $3`,
      maximumExistingSequenceValue,
      inventoryId,
      sequenceScopeKey,
    );
    const updatedCounterRows = await transactionClient.$queryRawUnsafe<{ value: number }[]>(
      `UPDATE "InventoryIdCounter"
       SET value = value + 1
       WHERE "inventoryId" = $1 AND "scopeKey" = $2
       RETURNING value`,
      inventoryId,
      sequenceScopeKey,
    );
    const nextSequenceValue: number = Number(updatedCounterRows[0]!.value);

    const generatedId: string = this.buildCustomIdString(formatSchema, generationMoment, {
      sequenceValue: nextSequenceValue,
      isPreview: false,
    });

    if (formatSchema.maxLength && generatedId.length > formatSchema.maxLength) {
      throw new Error(`Generated ID exceeds maxLength (${formatSchema.maxLength})`);
    }
    return generatedId;
  }

  public static async preview(
    transactionClient: PrismaTransaction,
    inventoryId: string,
  ): Promise<string> {
    const formatSchema: CustomIdFormatSchema = await this.readFormatSchema(
      transactionClient,
      inventoryId,
    );
    this.assertExactlyOneSequence(formatSchema);

    const generationMoment: Date = new Date();
    const sequenceScopeKey: string =
      this.findSequenceElement(formatSchema)?.sequenceName || "default";

    const [maximumExistingSequenceValue, counterRow] = await Promise.all([
      this.readMaximumExistingSequence(transactionClient, inventoryId, formatSchema),
      transactionClient.inventoryIdCounter.findUnique({
        where: { inventoryId_scopeKey: { inventoryId, scopeKey: sequenceScopeKey } },
        select: { value: true },
      }),
    ]);

    const currentCounterValue: number = Number(counterRow?.value ?? 0);
    const peekSequenceValue: number = Math.max(
      currentCounterValue + 1,
      maximumExistingSequenceValue + 1,
    );

    const previewId: string = this.buildCustomIdString(formatSchema, generationMoment, {
      sequenceValue: peekSequenceValue,
      isPreview: true,
    });

    if (formatSchema.maxLength && previewId.length > formatSchema.maxLength) {
      return previewId.slice(0, formatSchema.maxLength);
    }
    return previewId;
  }

  private static async readFormatSchema(
    transactionClient: PrismaTransaction,
    inventoryId: string,
  ): Promise<CustomIdFormatSchema> {
    const formatRow = await transactionClient.inventoryIdFormat.findUnique({
      where: { inventoryId },
      select: { schema: true },
    });
    if (!formatRow?.schema) {
      return { elements: [{ type: CustomIdElementType.GUID }] };
    }
    return formatRow.schema as unknown as CustomIdFormatSchema;
  }

  private static assertExactlyOneSequence(formatSchema: CustomIdFormatSchema): void {
    const sequenceElementsCount: number = formatSchema.elements.filter(
      (element) => element.type === CustomIdElementType.SEQUENCE,
    ).length;
    if (sequenceElementsCount !== 1) {
      throw new Error("Custom ID format must contain exactly one SEQUENCE element");
    }
  }

  private static findSequenceElement(formatSchema: CustomIdFormatSchema): CustomIdPart {
    return formatSchema.elements.find((element) => element.type === CustomIdElementType.SEQUENCE)!;
  }

  private static async ensureCounterRowExists(
    transactionClient: PrismaTransaction,
    inventoryId: string,
    sequenceScopeKey: string,
  ): Promise<void> {
    await transactionClient.inventoryIdCounter.upsert({
      where: { inventoryId_scopeKey: { inventoryId, scopeKey: sequenceScopeKey } },
      create: { inventoryId, scopeKey: sequenceScopeKey, value: 0 },
      update: {},
    });
  }

  private static buildCustomIdString(
    formatSchema: CustomIdFormatSchema,
    generationMoment: Date,
    options: { sequenceValue: number; isPreview: boolean },
  ): string {
    const idParts: string[] = [];

    for (let elementIndex = 0; elementIndex < formatSchema.elements.length; elementIndex++) {
      const element: CustomIdPart = formatSchema.elements[elementIndex]!;
      let elementStringValue = "";

      switch (element.type) {
        case CustomIdElementType.FIXED_TEXT: {
          elementStringValue = element.value || "";
          break;
        }
        case CustomIdElementType.RANDOM_20BIT: {
          const randomNumber = options.isPreview ? 0 : randomInt(0, 1 << 20);
          elementStringValue = element.leadingZeros
            ? String(randomNumber).padStart(7, "0")
            : String(randomNumber);
          break;
        }
        case CustomIdElementType.RANDOM_32BIT: {
          const randomNumber = options.isPreview ? 0 : randomInt(0, 2 ** 32);
          elementStringValue = element.leadingZeros
            ? String(randomNumber).padStart(10, "0")
            : String(randomNumber);
          break;
        }
        case CustomIdElementType.RANDOM_6DIGIT: {
          const randomNumber = options.isPreview ? 0 : randomInt(0, 1_000_000);
          elementStringValue = String(randomNumber).padStart(6, "0");
          break;
        }
        case CustomIdElementType.RANDOM_9DIGIT: {
          const randomNumber = options.isPreview ? 0 : randomInt(0, 1_000_000_000);
          elementStringValue = String(randomNumber).padStart(9, "0");
          break;
        }
        case CustomIdElementType.GUID: {
          elementStringValue = options.isPreview
            ? "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            : randomUUID();
          break;
        }
        case CustomIdElementType.DATETIME: {
          const dateFormat: string = element.format || "YYYYMMDD";
          elementStringValue = this.formatDateUtc(generationMoment, dateFormat);
          break;
        }
        case CustomIdElementType.SEQUENCE: {
          const sequenceValueString = String(options.sequenceValue);
          elementStringValue = element.leadingZeros
            ? sequenceValueString.padStart(6, "0")
            : sequenceValueString;
          break;
        }
      }

      idParts.push(elementStringValue);

      const isLastElement: boolean = elementIndex === formatSchema.elements.length - 1;
      if (!isLastElement && element.separator) {
        idParts.push(element.separator);
      }
    }

    return idParts.join("");
  }

  private static async readMaximumExistingSequence(
    transactionClient: PrismaTransaction,
    inventoryId: string,
    formatSchema: CustomIdFormatSchema,
  ): Promise<number> {
    const { regularExpressionPattern, likePrefix, likeSuffix } =
      this.buildSequenceExtractionHelpers(formatSchema);
    const params: SqlParam[] = [regularExpressionPattern, inventoryId];
    let paramIndex = 3;

    let whereClauses = `"inventoryId" = $2`;

    if (likePrefix) {
      whereClauses += ` AND "customId" LIKE $${paramIndex}`;
      params.push(`${likePrefix}%`);
      paramIndex++;
    }

    if (likeSuffix) {
      whereClauses += ` AND "customId" LIKE $${paramIndex}`;
      params.push(`%${likeSuffix}`);
    }

    const queryResultRows = await transactionClient.$queryRawUnsafe<{ maxseq: number }[]>(
      `
          SELECT MAX((matches[1])::int) AS maxseq
          FROM (
                   SELECT regexp_matches("customId", $1) AS matches
                   FROM "Item"
                   WHERE ${whereClauses}
               ) subquery
      `,
      ...params,
    );

    const maximumSequenceValue: number = Number(queryResultRows?.[0]?.maxseq ?? 0);
    return Number.isFinite(maximumSequenceValue) ? maximumSequenceValue : 0;
  }

  private static buildSequenceExtractionHelpers(formatSchema: CustomIdFormatSchema): {
    regularExpressionPattern: string;
    likePrefix: string;
    likeSuffix: string;
  } {
    const escapeForRegExp = (value: string) => value.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

    let likePrefix = "";
    let likeSuffix = "";
    let sequenceEncountered = false;
    let regularExpressionPattern = "^";

    for (const element of formatSchema.elements) {
      let deterministicLiteralForRegExp = "";

      switch (element.type) {
        case CustomIdElementType.FIXED_TEXT:
          deterministicLiteralForRegExp = escapeForRegExp(element.value || "");
          break;
        case CustomIdElementType.DATETIME:
        case CustomIdElementType.GUID:
        case CustomIdElementType.RANDOM_20BIT:
        case CustomIdElementType.RANDOM_32BIT:
        case CustomIdElementType.RANDOM_6DIGIT:
        case CustomIdElementType.RANDOM_9DIGIT:
          deterministicLiteralForRegExp = ".*";
          break;
        case CustomIdElementType.SEQUENCE:
          deterministicLiteralForRegExp = "(\\d+)";
          sequenceEncountered = true;
          break;
      }

      regularExpressionPattern += deterministicLiteralForRegExp;

      if (element.separator) {
        const escapedSeparator = escapeForRegExp(element.separator);
        regularExpressionPattern += escapedSeparator;
        if (!sequenceEncountered) likePrefix += element.separator;
        else likeSuffix += element.separator;
      } else {
        if (!sequenceEncountered && element.type === CustomIdElementType.FIXED_TEXT) {
          likePrefix += element.value || "";
        }
        if (sequenceEncountered && element.type === CustomIdElementType.FIXED_TEXT) {
          likeSuffix += element.value || "";
        }
      }
    }

    regularExpressionPattern += "$";
    return { regularExpressionPattern, likePrefix, likeSuffix };
  }

  private static formatDateUtc(dateValue: Date, dateFormat: string): string {
    const year = String(dateValue.getUTCFullYear());
    const month = String(dateValue.getUTCMonth() + 1).padStart(2, "0");
    const day = String(dateValue.getUTCDate()).padStart(2, "0");
    const hours = String(dateValue.getUTCHours()).padStart(2, "0");
    const minutes = String(dateValue.getUTCMinutes()).padStart(2, "0");
    const seconds = String(dateValue.getUTCSeconds()).padStart(2, "0");

    switch (dateFormat) {
      case "ISO":
        return dateValue.toISOString();
      case "timestamp":
        return String(dateValue.getTime());
      case "YYYY":
        return year;
      case "YYYY-MM":
        return `${year}-${month}`;
      case "YYYYMM":
        return `${year}${month}`;
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`;
      case "YYYYMMDD":
        return `${year}${month}${day}`;
      case "HH:MM:SS":
        return `${hours}:${minutes}:${seconds}`;
      case "HHMMSS":
        return `${hours}${minutes}${seconds}`;
      default:
        return `${year}${month}${day}`;
    }
  }
}
