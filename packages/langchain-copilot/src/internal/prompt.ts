import { AIMessage, BaseMessage, ToolMessage } from "@langchain/core/messages";
import type { StructuredConfig } from "./structured-output.js";
import {
  buildToolInstruction,
  DEFAULT_TOOL_CHOICE,
  type InternalToolChoice,
  type ToolPromptDefinition,
} from "./tools.js";
import { buildStructuredInstruction } from "./structured-output.js";

const contentToString = (content: BaseMessage["content"]): string => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text: unknown }).text);
        }
        return JSON.stringify(part);
      })
      .join("");
  }
  if (content && typeof content === "object") {
    return JSON.stringify(content);
  }
  return String(content ?? "");
};

const formatMessages = (messages: BaseMessage[]): string => {
  return messages
    .map((message) => {
      const role = message._getType();
      const text = contentToString(message.content);

      if (role === "system") return `System:\n${text}`;
      if (role === "human") return `User:\n${text}`;
      if (role === "tool") {
        const toolMessage = message as ToolMessage & { name?: string; tool_call_id?: string };
        const toolName = toolMessage.name ?? toolMessage.tool_call_id ?? "tool";
        return `Tool (${toolName}):\n${text}`;
      }

      if (role === "ai") {
        const toolCalls = (message as AIMessage).tool_calls;
        const toolBlock =
          toolCalls && toolCalls.length > 0
            ? `\n\nTool Calls:\n${JSON.stringify(toolCalls, null, 2)}`
            : "";
        return `Assistant:\n${text}${toolBlock}`;
      }

      return `Message:\n${text}`;
    })
    .join("\n\n");
};

export const buildPrompt = (
  messages: BaseMessage[],
  tools?: ToolPromptDefinition[],
  toolChoice?: InternalToolChoice,
  structured?: StructuredConfig
): string => {
  const instructions: string[] = [];

  if (tools && tools.length > 0) {
    instructions.push(buildToolInstruction(tools, toolChoice ?? DEFAULT_TOOL_CHOICE));
  }

  if (structured) {
    instructions.push(buildStructuredInstruction(structured));
  }

  const serialized = formatMessages(messages);
  return [instructions.join("\n\n"), serialized].filter(Boolean).join("\n\n");
};

export const buildRepairPrompt = (raw: string): string => {
  return [
    "You must return ONLY valid JSON.",
    "No prose. No Markdown. No code fences.",
    "Fix the following output so it is valid JSON:",
    raw,
  ].join("\n\n");
};
