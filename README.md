# generic-copilot-agent

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

**A robust, type-safe TypeScript library for programmatic interaction with the GitHub Copilot CLI.**

This library provides a high-level abstraction over the GitHub Copilot CLI, enabling developers to integrate AI-powered coding assistance directly into their Node.js applications and tools. It supports comprehensive session management, real-time streaming responses, and granular permission control.

## 🚀 Features

- **Programmatic Control**: Execute Copilot prompts directly from your TypeScript/JavaScript code.
- **Session Management**: Seamlessly create, list, resume, and manage Copilot sessions to maintain conversational context.
- **Real-time Streaming**: Consume AI responses incrementally as they are generated using async iterators.
- **Type Safety**: Fully typed configuration, responses, and events for a top-tier developer experience.
- **Granular Permissions**: Fine-grained control over file access, tool execution, and network permissions.
- **Multi-Model Support**: easy selection of various AI models (GPT-5, Claude 3.5 Sonnet, etc.).

## 📦 Installation

Ensure you have the [GitHub Copilot CLI](https://docs.github.com/en/copilot/github-copilot-in-the-cli/installing-github-copilot-in-the-cli) installed and authenticated on your machine.

```bash
npm install generic-copilot-agent
# or
yarn add generic-copilot-agent
# or
pnpm add generic-copilot-agent
```

## 🛠️ Usage

### Basic Prompt execution

Execute a simple prompt and receive the full response once complete.

```typescript
import { CopilotClient, CopilotModel } from 'generic-copilot-agent';

async function main() {
  const client = new CopilotClient({
    model: CopilotModel.GPT_5_MINI,
    allowAll: true, // Caution: Enables all permissions
  });

  try {
    const response = await client.prompt('Generate a binary search function in TypeScript');
    
    console.log(response.output);
    console.log(`Session ID: ${response.sessionId}`);
    console.log(`Tokens used: ${response.usage.inputTokens} in / ${response.usage.outputTokens} out`);
  } catch (error) {
    console.error('Execution failed:', error);
  }
}

main();
```

### Real-time Streaming

Process the response chunk-by-chunk for a responsive user experience.

```typescript
import { CopilotClient } from 'generic-copilot-agent';

const client = new CopilotClient();

for await (const chunk of client.promptStream('Explain quantum computing like I am 5')) {
  if (chunk.type === 'content') {
    process.stdout.write(chunk.content);
  } else if (chunk.type === 'error') {
    console.error(chunk.content);
  }
}

// Access session context after stream completion
const sessionId = client.getLastSessionId();
```

### Session Management

Maintain context across multiple interactions by resuming sessions.

```typescript
// 1. List available sessions
const recentSessions = await CopilotClient.listSessions({ limit: 5 });
const lastSession = recentSessions[0];

if (lastSession) {
  // 2. Resume a specific session
  const client = new CopilotClient({
    sessionId: lastSession.id,
    allowAll: true,
  });

  // The model retains context from previous interactions
  await client.prompt('Refactor the previous code to be functional style');
}
```

## ⚙️ Configuration

The `CopilotClient` constructor accepts a configuration object to tailor behavior:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `model` | `CopilotModel` \| `string` | `default` | The AI model to use (e.g., `gpt-5-mini`, `claude-sonnet-4.5`). |
| `sessionId` | `string` | `undefined` | ID of a session to resume. |
| `allowAll` | `boolean` | `false` | Enable all permissions (tools, paths, URLs). Equivalent to `--yolo`. |
| `cwd` | `string` | `process.cwd()` | Working directory for the execution. |
| `timeout` | `number` | `300000` | Execution timeout in milliseconds (default 5 mins). |
| `allowedTools` | `string[]` | `[]` | Whitelist specific tools (e.g., `['shell(git:*)']`). |
| `deniedTools` | `string[]` | `[]` | Blacklist specific tools. |
| `silent` | `boolean` | `false` | Suppress non-essential output. |

## 📚 API Reference

### `CopilotClient`

- **`prompt(text: string): Promise<CopilotResponse>`**: Executes a single prompt.
- **`promptStream(text: string): AsyncGenerator<StreamResponseChunk>`**: Streams response chunks.
- **`getLastSessionId(): string | null`**: Returns the ID of the last active session.
- **`static listSessions(options): Promise<SessionInfo[]>`**: Lists locally saved sessions.
- **`static getMostRecentSession(): Promise<SessionInfo | null>`**: Helper to find the last session.

### `CopilotResponse`

```typescript
interface CopilotResponse {
  output: string;
  sessionId: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    model: string;
    // ...
  };
  duration: {
    apiSeconds: number;
    wallSeconds: number;
  };
  codeChanges: {
    linesAdded: number;
    linesRemoved: number;
  };
  exitCode: number;
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
