import type { BindToolsInput } from "@langchain/core/language_models/chat_models";
import { isOpenAITool } from "@langchain/core/language_models/base";
import { convertToOpenAITool } from "@langchain/core/utils/function_calling";
import type { CopilotToolDefinition, JsonSchema, ToolChoice } from "../types.js";
import { extractJson } from "./structured-output.js";
import { schemaToJson } from "./schema.js";

export type InternalToolChoice = "auto" | "none" | "required" | { name: string };

export interface ToolPromptDefinition {
  name: string;
  description: string;
  parameters?: JsonSchema;
}

export const DEFAULT_TOOL_CHOICE: InternalToolChoice = "auto";

const isCopilotToolDefinition = (tool: unknown): tool is CopilotToolDefinition => {
  return typeof tool === "object" && tool !== null && "name" in tool && !("type" in tool);
};

const toCopilotToolDefinition = (tool: BindToolsInput): CopilotToolDefinition => {
  if (isCopilotToolDefinition(tool)) {
    return {
      name: tool.name,
      description: tool.description,
      schema: tool.schema,
    };
  }

  if (isOpenAITool(tool)) {
    return {
      name: tool.function.name,
      description: tool.function.description,
      schema: tool.function.parameters as JsonSchema,
    };
  }

  const openAITool = convertToOpenAITool(tool as Record<string, unknown>);
  return {
    name: openAITool.function.name,
    description: openAITool.function.description,
    schema: openAITool.function.parameters as JsonSchema,
  };
};

export const normalizeBoundTools = (tools: BindToolsInput[]): CopilotToolDefinition[] => {
  return tools.map((tool) => toCopilotToolDefinition(tool));
};

export const normalizeTools = (tools: CopilotToolDefinition[]): ToolPromptDefinition[] => {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description ?? "",
    parameters: schemaToJson(tool.schema),
  }));
};

export const normalizeToolChoice = (choice?: ToolChoice): InternalToolChoice => {
  if (!choice) return DEFAULT_TOOL_CHOICE;
  if (choice === "auto") return "auto";
  if (choice === "none") return "none";
  if (choice === "any" || choice === "required") return "required";
  if (typeof choice === "string") return { name: choice };
  if (typeof choice === "object" && choice !== null && "name" in choice) {
    const name = (choice as { name?: unknown }).name;
    if (typeof name === "string" && name.length > 0) return { name };
  }
  return DEFAULT_TOOL_CHOICE;
};

export const buildToolInstruction = (
  tools: ToolPromptDefinition[],
  toolChoice: InternalToolChoice
): string => {
  const toolList = JSON.stringify(tools, null, 2);
  const base = [
    "You can call tools to help answer the user.",
    "Available tools (JSON):",
    toolList,
    "When calling a tool, respond with ONLY this JSON object:",
    '{"type":"tool_call","tool_calls":[{"name":"TOOL_NAME","arguments":{...}}]}',
    "When answering normally, respond with ONLY this JSON object:",
    '{"type":"final","content":"YOUR_RESPONSE"}',
  ];

  if (toolChoice === "required") {
    base.push("You must call at least one tool.");
  } else if (typeof toolChoice === "object" && toolChoice.name) {
    base.push(`You must call the tool named "${toolChoice.name}".`);
  } else if (toolChoice === "none") {
    base.push("Do not call tools. Always respond with a final answer JSON object.");
  }

  return base.join("\n");
};

export const parseToolResponse = (
  raw: string
):
  | { type: "final"; content: string }
  | { type: "tool_call"; toolCalls: Array<{ name: string; args: Record<string, unknown> }> } => {
  const parsed = extractJson(raw) as Record<string, unknown>;
  if (parsed.type === "final") {
    return { type: "final", content: String(parsed.content ?? "") };
  }
  if (parsed.type === "tool_call" || parsed.tool_calls || parsed.toolCalls) {
    const calls = (parsed.tool_calls ?? parsed.toolCalls) as Array<Record<string, unknown>>;
    const toolCalls =
      calls?.map((call) => ({
        name: String(call.name ?? ""),
        args: (call.arguments ?? call.args ?? {}) as Record<string, unknown>,
      })) ?? [];
    return { type: "tool_call", toolCalls };
  }
  if (typeof parsed.content === "string") {
    return { type: "final", content: parsed.content };
  }
  throw new Error("Unable to parse tool response JSON.");
};

export const assertToolResponse = (
  parsed:
    | { type: "final"; content: string }
    | { type: "tool_call"; toolCalls: Array<{ name: string; args: Record<string, unknown> }> },
  toolChoice: InternalToolChoice,
  tools?: ToolPromptDefinition[]
): void => {
  if (toolChoice === "required" && parsed.type !== "tool_call") {
    throw new Error("Expected a tool call but got a final response.");
  }

  if (parsed.type !== "tool_call") return;

  if (tools && tools.length > 0) {
    const allowed = new Set(tools.map((tool) => tool.name));
    for (const call of parsed.toolCalls) {
      if (!allowed.has(call.name)) {
        throw new Error(`Unknown tool requested: ${call.name}`);
      }
    }
  }
};
