# copilot-agent

TypeScript SDK for programmatic access to the GitHub Copilot CLI. It provides a clean, typed interface for prompt execution, streaming, session management, and usage metrics.

## Features

- Simple prompt execution with typed responses.
- Streaming responses via async iterators.
- Session discovery and resume support.
- Fine-grained permission flags mapped to the Copilot CLI.
- Multi-model selection via `CopilotModel`.

## Requirements

- Node.js >= 18
- GitHub Copilot CLI installed and authenticated

## Install

```bash
pnpm add copilot-agent
```

## Basic Usage

```ts
import { CopilotClient, CopilotModel } from "copilot-agent";

const client = new CopilotClient({
  model: CopilotModel.GPT_5_MINI,
  allowAll: true
});

const response = await client.prompt("Generate a binary search function in TypeScript.");

console.log(response.output);
console.log(`Session ID: ${response.sessionId}`);
console.log(`Tokens: ${response.usage.inputTokens} in / ${response.usage.outputTokens} out`);
```

## Streaming

```ts
import { CopilotClient } from "copilot-agent";

const client = new CopilotClient();

for await (const chunk of client.promptStream("Explain quantum computing like I am 5")) {
  if (chunk.type === "content") {
    process.stdout.write(chunk.content);
  } else {
    console.error(chunk.content);
  }
}
```

## Session Management

```ts
const recentSessions = await CopilotClient.listSessions({ limit: 5 });
const lastSession = recentSessions[0];

if (lastSession) {
  const client = new CopilotClient({
    sessionId: lastSession.id,
    allowAll: true
  });

  await client.prompt("Refactor the previous code to be functional style.");
}
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `model` | `CopilotModel` \| `string` | `default` | Model to use (e.g., `gpt-5-mini`, `claude-sonnet-4.5`). |
| `sessionId` | `string` | `undefined` | Session to resume. |
| `continueLastSession` | `boolean` | `false` | Resume the most recent session. |
| `allowAll` | `boolean` | `false` | Enable all permissions (tools, paths, URLs). |
| `cwd` | `string` | `process.cwd()` | Working directory. |
| `timeout` | `number` | `300000` | Execution timeout in ms. |
| `allowedTools` | `string[]` | `[]` | Whitelist tools. |
| `deniedTools` | `string[]` | `[]` | Blacklist tools. |
| `silent` | `boolean` | `false` | Suppress non-essential output. |

## API Summary

- `CopilotClient.prompt(text: string): Promise<CopilotResponse>`
- `CopilotClient.promptStream(text: string): AsyncGenerator<StreamResponseChunk>`
- `CopilotClient.getLastSessionId(): string | null`
- `CopilotClient.listSessions(options): Promise<SessionInfo[]>`

## License

MIT
