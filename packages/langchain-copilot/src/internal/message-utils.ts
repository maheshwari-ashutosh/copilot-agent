import type { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import { BaseMessage, HumanMessage, coerceMessageLikeToMessage } from "@langchain/core/messages";

const hasToChatMessages = (input: unknown): input is { toChatMessages: () => BaseMessage[] } => {
  return typeof input === "object" && input !== null && "toChatMessages" in input;
};

// Normalize LangChain inputs into chat messages the CLI can serialize.
export const coerceMessages = (input: BaseLanguageModelInput): BaseMessage[] => {
  if (typeof input === "string") return [new HumanMessage(input)];
  if (Array.isArray(input)) return input.map((item) => coerceMessageLikeToMessage(item));
  if (hasToChatMessages(input)) return input.toChatMessages();
  return [new HumanMessage(String(input))];
};
