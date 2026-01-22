import { readFile } from 'fs/promises';
import { parse as parseYaml } from 'yaml';
import type { SessionInfo } from './types.js';

/**
 * Raw workspace.yaml structure
 */
interface WorkspaceYaml {
    id: string;
    cwd: string;
    summary?: string;
    summary_count?: number;
    created_at: string;
    updated_at: string;
}

/**
 * Parse a workspace.yaml file into SessionInfo
 */
export async function parseWorkspaceFile(filePath: string): Promise<SessionInfo> {
    const content = await readFile(filePath, 'utf-8');
    const data = parseYaml(content) as WorkspaceYaml;

    return {
        id: data.id,
        cwd: data.cwd,
        summary: data.summary ?? '',
        summaryCount: data.summary_count ?? 0,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
    };
}

/**
 * Parse workspace.yaml content directly (for testing)
 */
export function parseWorkspaceContent(content: string): SessionInfo {
    const data = parseYaml(content) as WorkspaceYaml;

    return {
        id: data.id,
        cwd: data.cwd,
        summary: data.summary ?? '',
        summaryCount: data.summary_count ?? 0,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
    };
}
