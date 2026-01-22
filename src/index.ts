// Main client export
export { CopilotClient } from './client/index.js';

// Session management
export { SessionManager } from './session/index.js';
export type { SessionInfo, SessionListOptions } from './session/index.js';

// Configuration
export { CopilotModel } from './config/index.js';
export type { CopilotModelType, CopilotClientConfig, LogLevel } from './config/index.js';

// Response types
export type {
    CopilotResponse,
    UsageMetrics,
    DurationMetrics,
    CodeChangeMetrics,
} from './executor/index.js';

// Errors
export {
    CopilotError,
    CopilotExecutionError,
    CopilotTimeoutError,
    SessionNotFoundError,
    OutputParseError,
    ConfigurationError,
} from './errors/index.js';
