import { Ajv, type ErrorObject } from "ajv";
import type { ZodTypeAny } from "zod";
import type { JsonSchema } from "../types.js";
import { isZodSchema, schemaToJson } from "./schema.js";

export interface StructuredConfig {
  schema: ZodTypeAny | JsonSchema;
  name?: string;
  description?: string;
}

const ajv = new Ajv({ allErrors: true, strict: false });

export const buildStructuredInstruction = (config: StructuredConfig): string => {
  const schema = schemaToJson(config.schema);
  const schemaText = schema ? JSON.stringify(schema, null, 2) : "{}";
  const header = config.name ? `Return JSON for: ${config.name}` : "Return JSON that matches the schema.";
  const description = config.description ? `Description: ${config.description}` : "";

  return [
    "Return ONLY valid JSON that matches the following schema.",
    header,
    description,
    schemaText,
  ]
    .filter(Boolean)
    .join("\n");
};

export const extractJson = (raw: string): unknown => {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  const objectStart = candidate.indexOf("{");
  const arrayStart = candidate.indexOf("[");
  const start =
    objectStart === -1
      ? arrayStart
      : arrayStart === -1
        ? objectStart
        : Math.min(objectStart, arrayStart);
  const end = start === arrayStart ? candidate.lastIndexOf("]") : candidate.lastIndexOf("}");

  // Allow a fenced block or a raw JSON blob, with extra text around it.
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model response.");
  }

  const jsonText = candidate.slice(start, end + 1).trim();
  return JSON.parse(jsonText);
};

export const validateStructured = (value: unknown, schema: ZodTypeAny | JsonSchema): unknown => {
  if (isZodSchema(schema)) {
    const result = schema.safeParse(value);
    if (!result.success) {
      throw new Error(`Structured output validation failed: ${result.error.message}`);
    }
    return result.data;
  }

  const validate = ajv.compile(schema as JsonSchema);
  const ok = validate(value);
  if (!ok) {
    const errors = (validate.errors as ErrorObject[] | null | undefined)
      ?.map((err) => `${err.instancePath} ${err.message ?? ""}`.trim())
      .join("; ");
    throw new Error(`Structured output validation failed: ${errors || "unknown error"}`);
  }

  return value;
};
