import type { Item } from "@prisma/client";

export interface NumberAggregation {
  min: number | null;
  max: number | null;
  average: number | null;
  count: number;
}

export interface TextAggregation {
  topValues: Array<{ value: string; count: number }>;
  uniqueCount: number;
  totalCount: number;
}

export interface BooleanAggregation {
  trueCount: number;
  falseCount: number;
  nullCount: number;
}

export interface FieldAggregation {
  fieldName: string;
  fieldType: "text" | "long" | "number" | "link" | "boolean";
  aggregation: NumberAggregation | TextAggregation | BooleanAggregation;
}

export type ItemData = Pick<
  Item,
  | "text1"
  | "text2"
  | "text3"
  | "long1"
  | "long2"
  | "long3"
  | "num1"
  | "num2"
  | "num3"
  | "link1"
  | "link2"
  | "link3"
  | "bool1"
  | "bool2"
  | "bool3"
>;

export type TextFieldKey = "text1" | "text2" | "text3";
export type LongFieldKey = "long1" | "long2" | "long3";
export type NumFieldKey = "num1" | "num2" | "num3";
export type LinkFieldKey = "link1" | "link2" | "link3";
export type BoolFieldKey = "bool1" | "bool2" | "bool3";
