import type { CopilotClientConfig } from '../config/types.js';
import type { CopilotResponse } from '../executor/types.js';
import type { SessionInfo, SessionListOptions } from '../session/types.js';
import { buildCliArgs, validateConfig } from '../config/config-builder.js';
import { CommandExecutor, type ICommandExecutor } from '../executor/command-executor.js';
import { parseCliOutput } from '../executor/output-parser.js';
import { SessionManager } from '../session/session-manager.js';
import { CopilotExecutionError, ConfigurationError } from '../errors/errors.js';

/**
 * Client for interacting with the GitHub Copilot CLI
 *
 * @example
 * ```typescript
 * // Create a new session
 * const client = new CopilotClient({ model: 'gpt-5-mini', allowAll: true });
 * const response = await client.prompt('Explain this code');
 * console.log(response.output);
 *
 * // Resume a session
 * const client2 = new CopilotClient({
 *   model: 'gpt-5-mini',
 *   sessionId: response.sessionId,
 *   allowAll: true
 * });
 * const followUp = await client2.prompt('Now fix the bug');
 * ```
 */
export class CopilotClient {
    private readonly config: CopilotClientConfig;
    private readonly executor: ICommandExecutor;
    private readonly sessionManager: SessionManager;
    private lastSessionId: string | null = null;

    /**
     * Create a new CopilotClient instance
     */
    constructor(config: CopilotClientConfig = {}, executor?: ICommandExecutor) {
        try {
            validateConfig(config);
        } catch (error) {
            throw new ConfigurationError((error as Error).message);
        }

        this.config = config;
        this.executor = executor ?? new CommandExecutor();
        this.sessionManager = new SessionManager();
    }

    /**
     * Execute a prompt and get a response
     *
     * @param text - The prompt to send to Copilot
     * @returns Parsed response with output, session ID, and usage metrics
     * @throws {CopilotExecutionError} If the command fails
     */
    async prompt(text: string): Promise<CopilotResponse> {
        const args = buildCliArgs(this.config, text);

        const result = await this.executor.execute(args, {
            cwd: this.config.cwd,
            timeout: this.config.timeout,
        });

        if (result.exitCode !== 0 && result.stderr) {
            throw new CopilotExecutionError(
                `Copilot CLI exited with code ${result.exitCode}: ${result.stderr}`
            );
        }

        const parsed = parseCliOutput(result.stdout);

        // Get the session ID from the most recent session
        // (since we just ran a command, it should be the latest)
        const recentSession = await this.sessionManager.getMostRecentSession();
        const sessionId = recentSession?.id ?? '';

        this.lastSessionId = sessionId;

        return {
            output: parsed.response,
            sessionId,
            usage: parsed.usage,
            duration: parsed.duration,
            codeChanges: parsed.codeChanges,
            exitCode: result.exitCode,
        };
    }

    /**
     * Get the session ID from the last prompt execution
     */
    getLastSessionId(): string | null {
        return this.lastSessionId;
    }

    /**
     * Get the configured session ID (if resuming)
     */
    getConfiguredSessionId(): string | undefined {
        return this.config.sessionId;
    }

    // Static convenience methods for session management

    /**
     * List available sessions
     */
    static async listSessions(options?: SessionListOptions): Promise<SessionInfo[]> {
        const manager = new SessionManager();
        return manager.listSessions(options);
    }

    /**
     * Get a specific session by ID
     */
    static async getSession(sessionId: string): Promise<SessionInfo> {
        const manager = new SessionManager();
        return manager.getSession(sessionId);
    }

    /**
     * Get the most recently updated session
     */
    static async getMostRecentSession(): Promise<SessionInfo | null> {
        const manager = new SessionManager();
        return manager.getMostRecentSession();
    }

    /**
     * Check if a session exists
     */
    static async sessionExists(sessionId: string): Promise<boolean> {
        const manager = new SessionManager();
        return manager.sessionExists(sessionId);
    }
}
