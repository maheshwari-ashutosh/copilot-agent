import type { ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { JsonSchema } from "../types.js";

export const isZodSchema = (schema: unknown): schema is ZodTypeAny => {
  return typeof schema === "object" && schema !== null && "safeParse" in schema;
};

export const schemaToJson = (schema?: ZodTypeAny | JsonSchema): JsonSchema | undefined => {
  if (!schema) return undefined;
  if (isZodSchema(schema)) {
    return zodToJsonSchema(schema, { target: "jsonSchema7" }) as JsonSchema;
  }
  return schema as JsonSchema;
};
