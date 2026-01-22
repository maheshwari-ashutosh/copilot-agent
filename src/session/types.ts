/**
 * Information about a Copilot session
 */
export interface SessionInfo {
    /**
     * Unique session identifier (UUID)
     */
    id: string;

    /**
     * Working directory where session was started
     */
    cwd: string;

    /**
     * Summary/title of the session
     */
    summary: string;

    /**
     * Number of times the session was compacted
     */
    summaryCount: number;

    /**
     * When the session was created
     */
    createdAt: Date;

    /**
     * When the session was last updated
     */
    updatedAt: Date;
}

/**
 * Options for listing sessions
 */
export interface SessionListOptions {
    /**
     * Maximum number of sessions to return
     */
    limit?: number;

    /**
     * Sort by field
     */
    sortBy?: 'createdAt' | 'updatedAt';

    /**
     * Sort order
     */
    sortOrder?: 'asc' | 'desc';
}
