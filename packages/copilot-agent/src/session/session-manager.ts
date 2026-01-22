import { readdir, stat, access } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { SessionInfo, SessionListOptions } from './types.js';
import { parseWorkspaceFile } from './session-parser.js';
import { SessionNotFoundError } from '../errors/errors.js';

/**
 * Default Copilot config directory
 */
const DEFAULT_CONFIG_DIR = join(homedir(), '.copilot');

/**
 * Session state subdirectory
 */
const SESSION_STATE_DIR = 'session-state';

/**
 * Manages Copilot session discovery and retrieval
 */
export class SessionManager {
    private readonly sessionDir: string;

    constructor() {
        this.sessionDir = join(DEFAULT_CONFIG_DIR, SESSION_STATE_DIR);
    }

    /**
     * List available sessions with optional filtering and sorting
     */
    async listSessions(options: SessionListOptions = {}): Promise<SessionInfo[]> {
        const { limit, sortBy = 'updatedAt', sortOrder = 'desc' } = options;

        try {
            await access(this.sessionDir);
        } catch {
            return []; // No sessions directory
        }

        const entries = await readdir(this.sessionDir, { withFileTypes: true });
        const sessions: SessionInfo[] = [];

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;

            const workspacePath = join(this.sessionDir, entry.name, 'workspace.yaml');

            try {
                const session = await parseWorkspaceFile(workspacePath);
                sessions.push(session);
            } catch {
                // Skip invalid/corrupted sessions
                continue;
            }
        }

        // Sort sessions
        sessions.sort((a, b) => {
            const aValue = a[sortBy].getTime();
            const bValue = b[sortBy].getTime();
            return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
        });

        // Apply limit
        if (limit && limit > 0) {
            return sessions.slice(0, limit);
        }

        return sessions;
    }

    /**
     * Get a specific session by ID
     */
    async getSession(sessionId: string): Promise<SessionInfo> {
        const workspacePath = join(this.sessionDir, sessionId, 'workspace.yaml');

        try {
            return await parseWorkspaceFile(workspacePath);
        } catch {
            throw new SessionNotFoundError(sessionId);
        }
    }

    /**
     * Get the most recently updated session
     */
    async getMostRecentSession(): Promise<SessionInfo | null> {
        const sessions = await this.listSessions({ limit: 1, sortBy: 'updatedAt', sortOrder: 'desc' });
        return sessions[0] ?? null;
    }

    /**
     * Check if a session exists
     */
    async sessionExists(sessionId: string): Promise<boolean> {
        const sessionPath = join(this.sessionDir, sessionId);
        try {
            const stats = await stat(sessionPath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }
}
