import { spawn } from 'child_process';
import { CopilotExecutionError, CopilotTimeoutError } from '../errors/errors.js';

/**
 * A chunk of streamed output
 */
export interface StreamChunk {
    type: 'stdout' | 'stderr';
    data: string;
}

/**
 * Final result from streaming execution
 */
export interface StreamResult {
    exitCode: number;
    fullOutput: string;
}

/**
 * Options for streaming execution
 */
export interface StreamExecutorOptions {
    cwd?: string;
    timeout?: number;
    env?: Record<string, string>;
}

const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * Execute command and stream output chunks in real-time
 * Returns an async generator that yields chunks as they arrive
 */
export async function* executeCommandStream(
    args: string[],
    options: StreamExecutorOptions = {}
): AsyncGenerator<StreamChunk, StreamResult, unknown> {
    const { cwd = process.cwd(), timeout = DEFAULT_TIMEOUT, env } = options;

    let fullOutput = '';
    let exitCode = 0;
    let killed = false;
    let resolvePromise: () => void;
    let rejectPromise: (err: Error) => void;

    const queue: StreamChunk[] = [];
    let waitingForData: ((value: StreamChunk | null) => void) | null = null;
    let done = false;

    const child = spawn('copilot', args, {
        cwd,
        env: { ...process.env, ...env },
        shell: false,
    });

    // Set up timeout
    const timeoutId = setTimeout(() => {
        killed = true;
        child.kill('SIGTERM');
        done = true;
        if (waitingForData) {
            waitingForData(null);
        }
    }, timeout);

    const processCompleted = new Promise<void>((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
    });

    const pushChunk = (chunk: StreamChunk) => {
        if (waitingForData) {
            const callback = waitingForData;
            waitingForData = null;
            callback(chunk);
        } else {
            queue.push(chunk);
        }
    };

    child.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        fullOutput += text;
        pushChunk({ type: 'stdout', data: text });
    });

    child.stderr.on('data', (data: Buffer) => {
        pushChunk({ type: 'stderr', data: data.toString() });
    });

    child.on('error', (error: Error) => {
        clearTimeout(timeoutId);
        done = true;
        rejectPromise(new CopilotExecutionError(`Failed to execute copilot: ${error.message}`, error));
        if (waitingForData) {
            waitingForData(null);
        }
    });

    child.on('close', (code: number | null) => {
        clearTimeout(timeoutId);
        done = true;
        exitCode = code ?? 1;
        resolvePromise();
        if (waitingForData) {
            waitingForData(null);
        }
    });

    // Yield chunks as they arrive
    while (!done || queue.length > 0) {
        if (queue.length > 0) {
            yield queue.shift()!;
        } else if (!done) {
            // Wait for next chunk
            const chunk = await new Promise<StreamChunk | null>((resolve) => {
                waitingForData = resolve;
            });
            if (chunk) {
                yield chunk;
            }
        }
    }

    // Wait for process to complete if not already
    try {
        await processCompleted;
    } catch (error) {
        throw error;
    }

    if (killed) {
        throw new CopilotTimeoutError(`Command timed out after ${timeout}ms`);
    }

    return { exitCode, fullOutput };
}

/**
 * Stream executor interface for dependency injection
 */
export interface IStreamExecutor {
    executeStream(args: string[], options?: StreamExecutorOptions): AsyncGenerator<StreamChunk, StreamResult, unknown>;
}

/**
 * Default stream executor implementation
 */
export class StreamExecutor implements IStreamExecutor {
    async *executeStream(
        args: string[],
        options?: StreamExecutorOptions
    ): AsyncGenerator<StreamChunk, StreamResult, unknown> {
        return yield* executeCommandStream(args, options);
    }
}
