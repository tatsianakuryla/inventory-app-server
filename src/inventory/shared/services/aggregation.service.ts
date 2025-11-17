import type { Item, InventoryFields } from "@prisma/client";
import type {
  FieldAggregation,
  ItemData,
  TextFieldKey,
  LongFieldKey,
  NumFieldKey,
  LinkFieldKey,
  BoolFieldKey,
  NumberAggregation,
  TextAggregation,
  BooleanAggregation,
} from "./aggregation.types.js";

export class AggregationService {
  public static calculateFieldAggregations(
    items: ItemData[],
    fields: InventoryFields | null,
  ): FieldAggregation[] {
    const result: FieldAggregation[] = [];

    if (!fields) {
      return result;
    }
    const textFields: TextFieldKey[] = ["text1", "text2", "text3"];
    for (const fieldKey of textFields) {
      const state = fields[`${fieldKey}State`];
      const name = fields[`${fieldKey}Name`];

      if (state === "SHOWN" && name) {
        const aggregation = this.aggregateTextValues(items, fieldKey);
        result.push({ fieldName: name, fieldType: "text", aggregation });
      }
    }
    const longFields: LongFieldKey[] = ["long1", "long2", "long3"];
    for (const fieldKey of longFields) {
      const state = fields[`${fieldKey}State`];
      const name = fields[`${fieldKey}Name`];

      if (state === "SHOWN" && name) {
        const aggregation = this.aggregateTextValues(items, fieldKey);
        result.push({ fieldName: name, fieldType: "long", aggregation });
      }
    }
    const numFields: NumFieldKey[] = ["num1", "num2", "num3"];
    for (const fieldKey of numFields) {
      const state = fields[`${fieldKey}State`];
      const name = fields[`${fieldKey}Name`];

      if (state === "SHOWN" && name) {
        const aggregation = this.aggregateNumberValues(items, fieldKey);
        result.push({ fieldName: name, fieldType: "number", aggregation });
      }
    }
    const linkFields: LinkFieldKey[] = ["link1", "link2", "link3"];
    for (const fieldKey of linkFields) {
      const state = fields[`${fieldKey}State`];
      const name = fields[`${fieldKey}Name`];

      if (state === "SHOWN" && name) {
        const aggregation = this.aggregateTextValues(items, fieldKey);
        result.push({ fieldName: name, fieldType: "link", aggregation });
      }
    }
    const boolFields: BoolFieldKey[] = ["bool1", "bool2", "bool3"];
    for (const fieldKey of boolFields) {
      const state = fields[`${fieldKey}State`];
      const name = fields[`${fieldKey}Name`];

      if (state === "SHOWN" && name) {
        const aggregation = this.aggregateBooleanValues(items, fieldKey);
        result.push({ fieldName: name, fieldType: "boolean", aggregation });
      }
    }

    return result;
  }

  private static aggregateNumberValues(
    items: ItemData[],
    fieldKey: NumFieldKey,
  ): NumberAggregation {
    const values = items
      .map((item) => item[fieldKey])
      .filter((value): value is number => value !== null);

    if (values.length === 0) {
      return { min: null, max: null, average: null, count: 0 };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const average = values.reduce((a, b) => a + b, 0) / values.length;

    return { min, max, average, count: values.length };
  }

  private static aggregateTextValues(
    items: ItemData[],
    fieldKey: TextFieldKey | LongFieldKey | LinkFieldKey,
    topN = 10,
  ): TextAggregation {
    const values = items
      .map((item) => item[fieldKey])
      .filter((value): value is string => value !== null);

    if (values.length === 0) {
      return { topValues: [], uniqueCount: 0, totalCount: 0 };
    }

    const valueCounts = values.reduce(
      (acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topValues = Object.entries(valueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN)
      .map(([value, count]) => ({ value, count }));

    return {
      topValues,
      uniqueCount: Object.keys(valueCounts).length,
      totalCount: values.length,
    };
  }

  private static aggregateBooleanValues(
    items: ItemData[],
    fieldKey: BoolFieldKey,
  ): BooleanAggregation {
    const values = items.map((item) => item[fieldKey]);

    return {
      trueCount: values.filter((value) => value === true).length,
      falseCount: values.filter((value) => value === false).length,
      nullCount: values.filter((value) => value === null).length,
    };
  }

  public static calculateStatistics(
    items: Array<
      Pick<
        Item,
        "text1" | "text2" | "text3" | "long1" | "long2" | "long3" | "num1" | "num2" | "num3"
      >
    >,
  ) {
    const numericStats: Record<
      string,
      { avg: number | null; min: number | null; max: number | null; count: number }
    > = {};

    const numFields: NumFieldKey[] = ["num1", "num2", "num3"];
    for (const field of numFields) {
      const stats = this.aggregateNumberValues(items as ItemData[], field);
      numericStats[field] = {
        avg: stats.average,
        min: stats.min,
        max: stats.max,
        count: stats.count,
      };
    }

    const textStats: Record<string, Array<{ value: string; count: number }>> = {};
    const textFields: Array<TextFieldKey | LongFieldKey> = [
      "text1",
      "text2",
      "text3",
      "long1",
      "long2",
      "long3",
    ];
    for (const field of textFields) {
      const stats = this.aggregateTextValues(items as ItemData[], field, 10);
      textStats[field] = stats.topValues;
    }

    return { numericStats, textStats };
  }
}
