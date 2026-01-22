import type { CopilotClient, CopilotClientConfig } from "copilot-agent";
import type { ZodTypeAny } from "zod";
import type {
  BaseChatModelParams,
  ToolChoice as LangchainToolChoice,
} from "@langchain/core/language_models/chat_models";

export type JsonSchema = Record<string, unknown>;

export type ToolChoice = LangchainToolChoice | "none" | "required" | { name: string };

export type CopilotLogPayload =
  | {
      type: "prompt";
      model: string;
      stage: "general" | "tool" | "structured";
      purpose: "invoke" | "repair";
      attempt: number;
      prompt: string;
    }
  | {
      type: "response";
      model: string;
      stage: "general" | "tool" | "structured";
      purpose: "invoke" | "repair";
      attempt: number;
      output: string;
      usage?: unknown;
      duration?: unknown;
      exitCode?: number;
    }
  | {
      type: "tool_calls";
      attempt: number;
      toolCalls: Array<{ name: string; args: Record<string, unknown> }>;
    }
  | {
      type: "structured_output";
      attempt: number;
      parsed: unknown;
    }
  | {
      type: "parse_error" | "validation_error";
      stage: "tool" | "structured";
      attempt: number;
      error: string;
    }
  | {
      type: "retry";
      stage: "tool" | "structured";
      attempt: number;
      remainingRetries: number;
    };

export type CopilotLogEvent = CopilotLogPayload & {
  timestamp: string;
};

export type CopilotLogger = (event: CopilotLogEvent) => void;

export interface CopilotToolDefinition {
  name: string;
  description?: string;
  schema?: ZodTypeAny | JsonSchema;
}

export interface CopilotChatModelConfig extends BaseChatModelParams {
  copilot?: CopilotClientConfig;
  client?: CopilotClient;
  tools?: CopilotToolDefinition[];
  toolChoice?: ToolChoice;
  maxParseRetries?: number;
  logger?: CopilotLogger;
}
