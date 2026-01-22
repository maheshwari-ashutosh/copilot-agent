# copilot-agent monorepo

Professional TypeScript packages for programmatic access to the GitHub Copilot CLI, plus a LangChain provider built on top.

## Packages

- `packages/copilot-agent`: Core CLI wrapper with session management, streaming, and usage parsing.
- `packages/langchain-copilot`: LangChain `BaseChatModel` provider with tool calling and structured output.

## Requirements

- Node.js >= 18
- pnpm
- GitHub Copilot CLI (installed and authenticated)

## Quick Start

```bash
pnpm install
pnpm -r build
pnpm -r test
```

## Workspace Commands

- `pnpm -r build` - build all packages
- `pnpm -r test` - run tests across the workspace
- `pnpm -r test:watch` - watch mode for tests
- `pnpm -r test:coverage` - coverage reports

## Documentation

- `packages/copilot-agent/README.md` - core API and configuration
- `packages/langchain-copilot/README.md` - LangChain integration and examples
