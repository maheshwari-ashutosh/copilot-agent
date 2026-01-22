/**
 * Base error class for all Copilot-related errors
 */
export class CopilotError extends Error {
    constructor(message: string, public readonly cause?: Error) {
        super(message);
        this.name = 'CopilotError';
        Error.captureStackTrace?.(this, this.constructor);
    }
}

/**
 * Error during CLI command execution
 */
export class CopilotExecutionError extends CopilotError {
    constructor(message: string, cause?: Error) {
        super(message, cause);
        this.name = 'CopilotExecutionError';
    }
}

/**
 * Command timed out
 */
export class CopilotTimeoutError extends CopilotError {
    constructor(message: string) {
        super(message);
        this.name = 'CopilotTimeoutError';
    }
}

/**
 * Session not found
 */
export class SessionNotFoundError extends CopilotError {
    constructor(sessionId: string) {
        super(`Session not found: ${sessionId}`);
        this.name = 'SessionNotFoundError';
    }
}

/**
 * Failed to parse CLI output
 */
export class OutputParseError extends CopilotError {
    constructor(message: string, public readonly rawOutput: string) {
        super(message);
        this.name = 'OutputParseError';
    }
}

/**
 * Invalid configuration
 */
export class ConfigurationError extends CopilotError {
    constructor(message: string) {
        super(message);
        this.name = 'ConfigurationError';
    }
}
