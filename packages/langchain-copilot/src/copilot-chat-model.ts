import { CopilotClient, type CopilotClientConfig, type CopilotResponse } from "copilot-agent";
import { randomUUID } from "crypto";
import {
  BaseChatModel,
  type BaseChatModelCallOptions,
  type BindToolsInput,
} from "@langchain/core/language_models/chat_models";
import type {
  BaseLanguageModelInput,
  StructuredOutputMethodOptions,
} from "@langchain/core/language_models/base";
import type { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { AIMessage, AIMessageChunk, BaseMessage } from "@langchain/core/messages";
import { ChatGenerationChunk, type ChatResult } from "@langchain/core/outputs";
import { RunnableLambda, type Runnable } from "@langchain/core/runnables";
import type {
  CopilotChatModelConfig,
  CopilotLogger,
  CopilotToolDefinition,
  ToolChoice,
} from "./types.js";
import { buildPrompt, buildRepairPrompt } from "./internal/prompt.js";
import { coerceMessages } from "./internal/message-utils.js";
import { extractJson, validateStructured, type StructuredConfig } from "./internal/structured-output.js";
import { logEvent, type LogPayload } from "./internal/logging.js";
import {
  normalizeBoundTools,
  normalizeToolChoice,
  normalizeTools,
  parseToolResponse,
  assertToolResponse,
} from "./internal/tools.js";

export class CopilotChatModel extends BaseChatModel {
  lc_namespace = ["copilot-agent", "langchain"];
  private readonly copilotConfig: CopilotClientConfig;
  private readonly explicitClient?: CopilotClient;
  private readonly tools?: CopilotToolDefinition[];
  private readonly toolChoice: ToolChoice;
  private readonly maxParseRetries: number;
  private readonly logger?: CopilotLogger;

  constructor(config: CopilotChatModelConfig = {}) {
    const { copilot, client, tools, toolChoice, ...baseParams } = config;
    super(baseParams);
    this.copilotConfig = copilot ?? {};
    this.explicitClient = client;
    this.tools = tools;
    this.toolChoice = toolChoice ?? "auto";
    this.maxParseRetries = config.maxParseRetries ?? 1;
    this.logger = config.logger;
  }

  _llmType(): string {
    return "copilot-chat";
  }

  bindTools(
    tools: BindToolsInput[],
    options?: Partial<BaseChatModelCallOptions>
  ): Runnable<BaseLanguageModelInput, AIMessageChunk, BaseChatModelCallOptions> {
    const normalizedTools = normalizeBoundTools(tools);
    const choice = normalizeToolChoice(options?.tool_choice ?? this.toolChoice);
    return new CopilotChatModel({
      copilot: this.copilotConfig,
      client: this.explicitClient,
      tools: normalizedTools,
      toolChoice: choice,
    });
  }

  withStructuredOutput<RunOutput extends Record<string, any>>(
    schema: StructuredConfig["schema"],
    config?: StructuredOutputMethodOptions<false>
  ): Runnable<BaseLanguageModelInput, RunOutput>;
  withStructuredOutput<RunOutput extends Record<string, any>>(
    schema: StructuredConfig["schema"],
    config?: StructuredOutputMethodOptions<true>
  ): Runnable<BaseLanguageModelInput, { raw: BaseMessage; parsed: RunOutput }>;
  withStructuredOutput<RunOutput extends Record<string, any>>(
    schema: StructuredConfig["schema"],
    config: StructuredOutputMethodOptions<boolean> = {}
  ):
    | Runnable<BaseLanguageModelInput, RunOutput>
    | Runnable<BaseLanguageModelInput, { raw: BaseMessage; parsed: RunOutput }> {
    const structured: StructuredConfig = {
      schema,
      name: config.name,
    };

    if (config.includeRaw) {
      return new RunnableLambda<BaseLanguageModelInput, { raw: BaseMessage; parsed: RunOutput }>({
        func: async (input: BaseLanguageModelInput) => {
          const messages = coerceMessages(input);
          const prompt = buildPrompt(messages, undefined, undefined, structured);
          const response = await this.runPrompt(prompt, {
            purpose: "invoke",
            stage: "structured",
            attempt: 0,
          });
          const parsed = (await this.parseStructuredWithRetry(
            response.output,
            structured,
            this.maxParseRetries,
            0
          )) as RunOutput;
          return { raw: new AIMessage(response.output), parsed };
        },
      });
    }

    return new RunnableLambda<BaseLanguageModelInput, RunOutput>({
      func: async (input: BaseLanguageModelInput) => {
        const messages = coerceMessages(input);
        const prompt = buildPrompt(messages, undefined, undefined, structured);
        const response = await this.runPrompt(prompt, {
          purpose: "invoke",
          stage: "structured",
          attempt: 0,
        });
        return (await this.parseStructuredWithRetry(
          response.output,
          structured,
          this.maxParseRetries,
          0
        )) as RunOutput;
      },
    });
  }

  async _generate(
    messages: BaseMessage[],
    options: this["ParsedCallOptions"],
    _runManager?: CallbackManagerForLLMRun
  ): Promise<ChatResult> {
    const choice = normalizeToolChoice(options?.tool_choice ?? this.toolChoice);
    const normalizedTools = this.tools ? normalizeTools(this.tools) : undefined;
    const prompt = buildPrompt(messages, normalizedTools, choice);
    const response = await this.runPrompt(prompt, {
      purpose: "invoke",
      stage: normalizedTools && normalizedTools.length > 0 ? "tool" : "general",
      attempt: 0,
    });

    if (normalizedTools && normalizedTools.length > 0 && choice !== "none") {
      const parsed = await this.parseToolWithRetry(
        response.output,
        messages,
        normalizedTools,
        choice,
        this.maxParseRetries,
        0
      );
      if (parsed.type === "tool_call") {
        this.log({
          type: "tool_calls",
          attempt: 0,
          toolCalls: parsed.toolCalls,
        });
        const toolCalls = parsed.toolCalls.map((call: { name: string; args: Record<string, unknown> }) => ({
          id: randomUUID(),
          name: call.name,
          args: call.args,
        }));
        const message = new AIMessage({ content: "", tool_calls: toolCalls as never });
        return {
          generations: [
            {
              text: "",
              message,
            },
          ],
          llmOutput: this.buildLlmOutput(response),
        };
      }

      const message = new AIMessage(parsed.content);
      return {
        generations: [
          {
            text: parsed.content,
            message,
          },
        ],
        llmOutput: this.buildLlmOutput(response),
      };
    }

    const message = new AIMessage(response.output);
    return {
      generations: [
        {
          text: response.output,
          message,
        },
      ],
      llmOutput: this.buildLlmOutput(response),
    };
  }

  async *_streamResponseChunks(
    messages: BaseMessage[],
    options: this["ParsedCallOptions"],
    runManager?: CallbackManagerForLLMRun
  ): AsyncGenerator<ChatGenerationChunk> {
    const choice = normalizeToolChoice(options?.tool_choice ?? this.toolChoice);
    const normalizedTools = this.tools ? normalizeTools(this.tools) : undefined;
    const prompt = buildPrompt(messages, normalizedTools, choice);
    const client = this.createClient({ streaming: true, silent: true, noColor: true });
    let buffer = "";

    this.log({
      type: "prompt",
      model: this.getModelName(),
      stage: normalizedTools && normalizedTools.length > 0 ? "tool" : "general",
      purpose: "invoke",
      attempt: 0,
      prompt,
    });

    for await (const chunk of client.promptStream(prompt)) {
      if (chunk.type === "error") {
        throw new Error(chunk.content);
      }
      buffer += chunk.content;
      runManager?.handleLLMNewToken?.(chunk.content);
      const message = new AIMessageChunk({ content: chunk.content });
      yield new ChatGenerationChunk({ text: chunk.content, message });
    }

    if (normalizedTools && normalizedTools.length > 0 && choice !== "none") {
      try {
        const parsed = await this.parseToolWithRetry(
          buffer,
          messages,
          normalizedTools,
          choice,
          this.maxParseRetries,
          0
        );
        if (parsed.type === "tool_call") {
          this.log({
            type: "tool_calls",
            attempt: 0,
            toolCalls: parsed.toolCalls,
          });
          const toolCalls = parsed.toolCalls.map((call: { name: string; args: Record<string, unknown> }) => ({
            id: randomUUID(),
            name: call.name,
            args: call.args,
          }));
          const message = new AIMessageChunk({ content: "", tool_calls: toolCalls as never });
          yield new ChatGenerationChunk({ text: "", message });
        }
      } catch {
        // Streaming is best-effort for tool calls; ignore parse failures.
      }
    }

    this.log({
      type: "response",
      model: this.getModelName(),
      stage: normalizedTools && normalizedTools.length > 0 ? "tool" : "general",
      purpose: "invoke",
      attempt: 0,
      output: buffer,
    });
  }

  private createClient(overrides: Partial<CopilotClientConfig> = {}): CopilotClient {
    if (this.explicitClient && Object.keys(overrides).length === 0) {
      return this.explicitClient;
    }

    const config: CopilotClientConfig = {
      ...this.copilotConfig,
      ...overrides,
    };

    if (config.silent === undefined) config.silent = true;
    if (config.noColor === undefined) config.noColor = true;

    return new CopilotClient(config);
  }

  private async executePrompt(
    prompt: string,
    overrides: Partial<CopilotClientConfig> = {}
  ): Promise<CopilotResponse> {
    const client = this.createClient(overrides);
    return client.prompt(prompt);
  }

  private async parseStructuredWithRetry(
    raw: string,
    structured: StructuredConfig,
    retries: number,
    attempt: number
  ): Promise<unknown> {
    try {
      const parsed = extractJson(raw);
      const validated = validateStructured(parsed, structured.schema);
      this.log({
        type: "structured_output",
        attempt,
        parsed: validated,
      });
      return validated;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const type = message.includes("validation") ? "validation_error" : "parse_error";
      this.log({
        type,
        stage: "structured",
        attempt,
        error: message,
      });
      if (retries <= 0) throw error;
      this.log({
        type: "retry",
        stage: "structured",
        attempt: attempt + 1,
        remainingRetries: retries - 1,
      });
      const repairPrompt = buildRepairPrompt(raw);
      const repairResponse = await this.runPrompt(repairPrompt, {
        purpose: "repair",
        stage: "structured",
        attempt: attempt + 1,
      });
      return this.parseStructuredWithRetry(
        repairResponse.output,
        structured,
        retries - 1,
        attempt + 1
      );
    }
  }

  private async parseToolWithRetry(
    raw: string,
    messages: BaseMessage[],
    tools: ReturnType<typeof normalizeTools>,
    choice: ReturnType<typeof normalizeToolChoice>,
    retries: number,
    attempt: number
  ): Promise<
    | { type: "final"; content: string }
    | { type: "tool_call"; toolCalls: Array<{ name: string; args: Record<string, unknown> }> }
  > {
    try {
      const parsed = parseToolResponse(raw);
      assertToolResponse(parsed, choice, tools);
      return parsed;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const type = message.includes("tool") ? "validation_error" : "parse_error";
      this.log({
        type,
        stage: "tool",
        attempt,
        error: message,
      });
      if (retries <= 0) throw error;
      this.log({
        type: "retry",
        stage: "tool",
        attempt: attempt + 1,
        remainingRetries: retries - 1,
      });
      const basePrompt = buildPrompt(messages, tools, choice);
      const repairPrompt = buildRepairPrompt(raw);
      const response = await this.runPrompt(
        [basePrompt, repairPrompt].filter(Boolean).join("\n\n"),
        {
          purpose: "repair",
          stage: "tool",
          attempt: attempt + 1,
        }
      );
      return this.parseToolWithRetry(
        response.output,
        messages,
        tools,
        choice,
        retries - 1,
        attempt + 1
      );
    }
  }

  private log(event: LogPayload): void {
    logEvent(this.logger, event);
  }

  private getModelName(): string {
    return this.copilotConfig.model ? String(this.copilotConfig.model) : "default";
  }

  private async runPrompt(
    prompt: string,
    meta: {
      purpose: "invoke" | "repair";
      stage: "general" | "tool" | "structured";
      attempt: number;
    }
  ): Promise<CopilotResponse> {
    this.log({
      type: "prompt",
      model: this.getModelName(),
      stage: meta.stage,
      purpose: meta.purpose,
      attempt: meta.attempt,
      prompt,
    });

    const response = await this.executePrompt(prompt, { silent: true, noColor: true });

    this.log({
      type: "response",
      model: this.getModelName(),
      stage: meta.stage,
      purpose: meta.purpose,
      attempt: meta.attempt,
      output: response.output,
      usage: response.usage,
      duration: response.duration,
      exitCode: response.exitCode,
    });

    return response;
  }

  private buildLlmOutput(response: CopilotResponse) {
    const input = response.usage.inputTokens ?? 0;
    const output = response.usage.outputTokens ?? 0;
    return {
      tokenUsage: {
        promptTokens: input,
        completionTokens: output,
        totalTokens: input + output,
      },
      copilot: {
        usage: response.usage,
        duration: response.duration,
        codeChanges: response.codeChanges,
        exitCode: response.exitCode,
      },
    };
  }
}
