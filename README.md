# copilot-agent monorepo

A pnpm-based monorepo containing the Copilot CLI wrapper library and related assets.

## Contents

- `packages/copilot-agent`: TypeScript library that wraps the GitHub Copilot CLI.

## Requirements

- Node.js >= 18
- pnpm

## Quick Start

```bash
pnpm install
pnpm -r build
pnpm -r test
```

## Common Scripts

All scripts run across packages via pnpm recursive mode:

- `pnpm -r build`
- `pnpm -r test`
- `pnpm -r test:watch`
- `pnpm -r test:coverage`

## Package Details

For library usage, configuration, and API reference, see `packages/copilot-agent/README.md`.
