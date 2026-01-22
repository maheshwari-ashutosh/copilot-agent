# langchain-copilot

LangChain `BaseChatModel` provider for the GitHub Copilot CLI, built on `copilot-agent`. This package delivers tool calling, structured output, and streaming in a production‑ready interface.

## Key Features

- LangChain-native chat model integration with tool calling.
- Schema-validated structured output (Zod or JSON Schema).
- Robust JSON parsing with configurable retries and repair prompts.
- Optional, structured logging of prompts, responses, and retries.

## Requirements

- Node.js >= 18
- GitHub Copilot CLI installed and authenticated

## Install

```bash
pnpm add langchain-copilot
```

## Basic Usage

```ts
import { CopilotChatModel } from "langchain-copilot";

const model = new CopilotChatModel({
  copilot: {
    model: "gpt-5-mini",
    allowAll: true
  }
});

const response = await model.invoke("Write a one-line summary of the repo.");
console.log(response.content);
```

## Tool Calling

Tool calling is protocol-based: the model returns JSON that this provider parses into `tool_calls`.

```ts
import { CopilotChatModel } from "langchain-copilot";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const search = tool(
  async (input: { query: string }) => {
    return `search(${input.query})`;
  },
  {
    name: "search",
    description: "Search the web for information.",
    schema: z.object({ query: z.string() })
  }
);

const model = new CopilotChatModel({
  copilot: { model: "gpt-5-mini", allowAll: true }
});

const toolEnabled = model.bindTools([search], { tool_choice: "any" });
const response = await toolEnabled.invoke("Find the capital of France and cite the source.");

console.log(response.tool_calls);
```

## Structured Output

Return JSON that matches a schema using `withStructuredOutput`.

```ts
import { CopilotChatModel } from "langchain-copilot";
import { z } from "zod";

const schema = z.object({
  answer: z.string(),
  confidence: z.number()
});

const model = new CopilotChatModel({
  copilot: { model: "gpt-5-mini", allowAll: true }
});

const structured = model.withStructuredOutput(schema);
const result = await structured.invoke("Summarize the repo in one sentence.");

console.log(result);
```

## Configuration

```ts
const model = new CopilotChatModel({
  copilot: {
    model: "gpt-5-mini",
    allowAll: true,
    silent: true,
    noColor: true
  },
  toolChoice: "auto",
  maxParseRetries: 1
});
```

## Logging

Provide a logger to capture prompts, responses, retries, and tool calls.

```ts
const model = new CopilotChatModel({
  copilot: { model: "gpt-5-mini", allowAll: true },
  logger: (event) => {
    console.log(`[${event.timestamp}]`, event.type, event);
  }
});
```

## Examples

- `examples/tool-calling.ts`
- `examples/structured-output.ts`
- `examples/advanced-report.ts`

## Notes

- Tool calls and structured output are prompt-protocol based because the Copilot CLI is text-in/text-out.
- This provider sets `silent` and `noColor` by default for reliable JSON parsing.
