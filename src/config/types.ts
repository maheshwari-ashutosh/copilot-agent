import type { CopilotModelType } from './models.js';

/**
 * Log level options for the CLI
 */
export type LogLevel = 'none' | 'error' | 'warning' | 'info' | 'debug' | 'all' | 'default';

/**
 * Configuration options for CopilotClient
 */
export interface CopilotClientConfig {
    /**
     * AI model to use for responses
     */
    model?: CopilotModelType | string;

    /**
     * Resume a specific session by its ID
     */
    sessionId?: string;

    /**
     * Resume the most recent session (--continue flag)
     */
    continueLastSession?: boolean;

    /**
     * Additional directories to allow file access
     */
    additionalDirs?: string[];

    /**
     * Enable all permissions (tools, paths, URLs) - equivalent to --yolo
     */
    allowAll?: boolean;

    /**
     * Allow all tools to run without confirmation
     */
    allowAllTools?: boolean;

    /**
     * Allow access to any filesystem path
     */
    allowAllPaths?: boolean;

    /**
     * Allow access to any URL without confirmation
     */
    allowAllUrls?: boolean;

    /**
     * Specific tools to allow without prompting
     */
    allowedTools?: string[];

    /**
     * Specific tools to deny
     */
    deniedTools?: string[];

    /**
     * Specific URLs/domains to allow
     */
    allowedUrls?: string[];

    /**
     * Specific URLs/domains to deny
     */
    deniedUrls?: string[];

    /**
     * Additional MCP server configuration (JSON string or object)
     */
    additionalMcpConfig?: string | object;

    /**
     * Disable all built-in MCP servers
     */
    disableBuiltinMcps?: boolean;

    /**
     * Specific MCP servers to disable
     */
    disabledMcpServers?: string[];

    /**
     * Disable ask_user tool (autonomous mode)
     */
    noAskUser?: boolean;

    /**
     * Disable custom instructions from AGENTS.md
     */
    noCustomInstructions?: boolean;

    /**
     * Enable/disable streaming mode
     */
    streaming?: boolean;

    /**
     * Silent mode - only output agent response
     */
    silent?: boolean;

    /**
     * Disable color output
     */
    noColor?: boolean;

    /**
     * Log level for CLI output
     */
    logLevel?: LogLevel;

    /**
     * Custom log directory
     */
    logDir?: string;

    /**
     * Working directory for command execution
     */
    cwd?: string;

    /**
     * Timeout in milliseconds for command execution
     */
    timeout?: number;

    /**
     * Custom agent to use
     */
    agent?: string;
}
