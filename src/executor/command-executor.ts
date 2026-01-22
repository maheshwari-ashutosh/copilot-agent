import { spawn } from 'child_process';
import type { ExecutionResult } from './types.js';
import { CopilotExecutionError, CopilotTimeoutError } from '../errors/errors.js';

/**
 * Options for command execution
 */
export interface ExecutorOptions {
    cwd?: string;
    timeout?: number;
    env?: Record<string, string>;
}

/**
 * Default timeout in milliseconds (5 minutes)
 */
const DEFAULT_TIMEOUT = 5 * 60 * 1000;

/**
 * Execute the copilot CLI with given arguments
 */
export async function executeCommand(
    args: string[],
    options: ExecutorOptions = {}
): Promise<ExecutionResult> {
    const { cwd = process.cwd(), timeout = DEFAULT_TIMEOUT, env } = options;

    return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        let killed = false;

        const child = spawn('copilot', args, {
            cwd,
            env: { ...process.env, ...env },
            shell: false,
        });

        // Set up timeout
        const timeoutId = setTimeout(() => {
            killed = true;
            child.kill('SIGTERM');
            reject(new CopilotTimeoutError(`Command timed out after ${timeout}ms`));
        }, timeout);

        child.stdout.on('data', (data: Buffer) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data: Buffer) => {
            stderr += data.toString();
        });

        child.on('error', (error: Error) => {
            clearTimeout(timeoutId);
            reject(new CopilotExecutionError(`Failed to execute copilot: ${error.message}`, error));
        });

        child.on('close', (code: number | null) => {
            clearTimeout(timeoutId);

            if (killed) {
                return; // Already handled by timeout
            }

            const exitCode = code ?? 1;

            resolve({
                stdout,
                stderr,
                exitCode,
            });
        });
    });
}

/**
 * Command executor interface for dependency injection
 */
export interface ICommandExecutor {
    execute(args: string[], options?: ExecutorOptions): Promise<ExecutionResult>;
}

/**
 * Default command executor implementation
 */
export class CommandExecutor implements ICommandExecutor {
    async execute(args: string[], options?: ExecutorOptions): Promise<ExecutionResult> {
        return executeCommand(args, options);
    }
}
