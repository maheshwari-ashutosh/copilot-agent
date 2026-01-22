# copilot-agent

TypeScript library for programmatic access to GitHub Copilot CLI with session management.

## Installation

```bash
npm install copilot-agent
```

**Prerequisites**: GitHub Copilot CLI must be installed and authenticated.

## Quick Start

```typescript
import { CopilotClient, CopilotModel } from 'copilot-agent';

// Create a new session
const client = new CopilotClient({
  model: CopilotModel.GPT_5_MINI,
  allowAll: true,
});

const response = await client.prompt('Explain this code');
console.log(response.output);
console.log(`Session ID: ${response.sessionId}`);
```

## Session Resumption

```typescript
// Resume a specific session
const client = new CopilotClient({
  sessionId: 'your-session-uuid',
  allowAll: true,
});

const followUp = await client.prompt('Now fix the bug');
```

## Session Discovery

```typescript
// List recent sessions
const sessions = await CopilotClient.listSessions({ limit: 10 });

// Get most recent session
const recent = await CopilotClient.getMostRecentSession();

// Check if session exists
const exists = await CopilotClient.sessionExists('session-id');
```

## Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `model` | string | AI model to use (e.g., `gpt-5-mini`) |
| `sessionId` | string | Resume a specific session |
| `continueLastSession` | boolean | Resume the most recent session |
| `allowAll` | boolean | Enable all permissions (tools, paths, URLs) |
| `allowAllTools` | boolean | Auto-approve tool executions |
| `allowedTools` | string[] | Specific tools to allow |
| `deniedTools` | string[] | Specific tools to deny |
| `additionalDirs` | string[] | Extra directories to allow |
| `timeout` | number | Timeout in milliseconds |
| `cwd` | string | Working directory |

## Available Models

```typescript
import { CopilotModel } from 'copilot-agent';

CopilotModel.GPT_5_MINI       // 'gpt-5-mini'
CopilotModel.GPT_5_2          // 'gpt-5.2'
CopilotModel.CLAUDE_SONNET_4  // 'claude-sonnet-4'
// ... and more
```

## Response Object

```typescript
interface CopilotResponse {
  output: string;           // Agent's response
  sessionId: string;        // Use to resume session
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    premiumRequests: number;
    model: string;
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

## Error Handling

```typescript
import { 
  CopilotError,
  CopilotExecutionError,
  CopilotTimeoutError,
  SessionNotFoundError 
} from 'copilot-agent';

try {
  const response = await client.prompt('...');
} catch (error) {
  if (error instanceof CopilotTimeoutError) {
    console.log('Request timed out');
  } else if (error instanceof SessionNotFoundError) {
    console.log('Session not found');
  }
}
```

## License

MIT
