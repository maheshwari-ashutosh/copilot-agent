/**
 * Raw result from CLI execution
 */
export interface ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

/**
 * Usage metrics from a Copilot response
 */
export interface UsageMetrics {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    premiumRequests: number;
    model: string;
}

/**
 * Duration metrics from a Copilot response
 */
export interface DurationMetrics {
    apiSeconds: number;
    wallSeconds: number;
}

/**
 * Code change metrics from a Copilot response
 */
export interface CodeChangeMetrics {
    linesAdded: number;
    linesRemoved: number;
}

/**
 * Parsed response from Copilot CLI execution
 */
export interface CopilotResponse {
    /**
     * The main text response from the agent
     */
    output: string;

    /**
     * Session ID for this conversation (use to resume)
     */
    sessionId: string;

    /**
     * Token usage metrics
     */
    usage: UsageMetrics;

    /**
     * Time duration metrics
     */
    duration: DurationMetrics;

    /**
     * Code changes made during execution
     */
    codeChanges: CodeChangeMetrics;

    /**
     * CLI exit code (0 = success)
     */
    exitCode: number;
}
