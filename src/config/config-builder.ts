import type { CopilotClientConfig } from './types.js';

/**
 * Builds CLI arguments from configuration options
 * Pure function for easy testing
 */
export function buildCliArgs(config: CopilotClientConfig, prompt: string): string[] {
    const args: string[] = [];

    // Model selection
    if (config.model) {
        args.push('--model', config.model);
    }

    // Session management
    if (config.sessionId) {
        args.push('--resume', config.sessionId);
    } else if (config.continueLastSession) {
        args.push('--continue');
    }

    // Permissions - check allowAll first (shortcut)
    if (config.allowAll) {
        args.push('--allow-all');
    } else {
        if (config.allowAllTools) {
            args.push('--allow-all-tools');
        }
        if (config.allowAllPaths) {
            args.push('--allow-all-paths');
        }
        if (config.allowAllUrls) {
            args.push('--allow-all-urls');
        }
    }

    // Specific tool permissions
    if (config.allowedTools?.length) {
        for (const tool of config.allowedTools) {
            args.push('--allow-tool', tool);
        }
    }

    if (config.deniedTools?.length) {
        for (const tool of config.deniedTools) {
            args.push('--deny-tool', tool);
        }
    }

    // URL permissions
    if (config.allowedUrls?.length) {
        for (const url of config.allowedUrls) {
            args.push('--allow-url', url);
        }
    }

    if (config.deniedUrls?.length) {
        for (const url of config.deniedUrls) {
            args.push('--deny-url', url);
        }
    }

    // Additional directories
    if (config.additionalDirs?.length) {
        for (const dir of config.additionalDirs) {
            args.push('--add-dir', dir);
        }
    }

    // MCP configuration
    if (config.additionalMcpConfig) {
        const mcpConfig =
            typeof config.additionalMcpConfig === 'string'
                ? config.additionalMcpConfig
                : JSON.stringify(config.additionalMcpConfig);
        args.push('--additional-mcp-config', mcpConfig);
    }

    if (config.disableBuiltinMcps) {
        args.push('--disable-builtin-mcps');
    }

    if (config.disabledMcpServers?.length) {
        for (const server of config.disabledMcpServers) {
            args.push('--disable-mcp-server', server);
        }
    }

    // Behavior flags
    if (config.noAskUser) {
        args.push('--no-ask-user');
    }

    if (config.noCustomInstructions) {
        args.push('--no-custom-instructions');
    }

    if (config.streaming !== undefined) {
        args.push('--stream', config.streaming ? 'on' : 'off');
    }

    if (config.silent) {
        args.push('--silent');
    }

    if (config.noColor) {
        args.push('--no-color');
    }

    if (config.logLevel) {
        args.push('--log-level', config.logLevel);
    }

    if (config.logDir) {
        args.push('--log-dir', config.logDir);
    }

    if (config.agent) {
        args.push('--agent', config.agent);
    }

    // The prompt itself (non-interactive mode)
    args.push('-p', prompt);

    return args;
}

/**
 * Validates configuration and throws on invalid combinations
 */
export function validateConfig(config: CopilotClientConfig): void {
    if (config.sessionId && config.continueLastSession) {
        throw new Error('Cannot specify both sessionId and continueLastSession');
    }
}
