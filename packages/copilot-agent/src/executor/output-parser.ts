import type { UsageMetrics, DurationMetrics, CodeChangeMetrics } from './types.js';

/**
 * Parsed output from CLI stdout
 */
export interface ParsedOutput {
    response: string;
    usage: UsageMetrics;
    duration: DurationMetrics;
    codeChanges: CodeChangeMetrics;
}

/**
 * Parse the usage line from CLI output
 * Example: "    gpt-5-mini           12.1k input, 293 output, 2.6k cache read (Est. 0 Premium requests)"
 */
function parseUsageLine(line: string): Partial<UsageMetrics> {
    const result: Partial<UsageMetrics> = {};

    // Extract model name (first word)
    const modelMatch = line.match(/^\s*(\S+)/);
    if (modelMatch) {
        result.model = modelMatch[1];
    }

    // Parse token counts (handles "12.1k" format)
    const parseTokenCount = (value: string): number => {
        const normalized = value.toLowerCase().trim();
        if (normalized.endsWith('k')) {
            return Math.round(parseFloat(normalized.slice(0, -1)) * 1000);
        }
        if (normalized.endsWith('m')) {
            return Math.round(parseFloat(normalized.slice(0, -1)) * 1000000);
        }
        return parseInt(normalized, 10) || 0;
    };

    const inputMatch = line.match(/([\d.]+[km]?)\s*input/i);
    if (inputMatch) {
        result.inputTokens = parseTokenCount(inputMatch[1]);
    }

    const outputMatch = line.match(/([\d.]+[km]?)\s*output/i);
    if (outputMatch) {
        result.outputTokens = parseTokenCount(outputMatch[1]);
    }

    const cacheMatch = line.match(/([\d.]+[km]?)\s*cache\s*read/i);
    if (cacheMatch) {
        result.cacheReadTokens = parseTokenCount(cacheMatch[1]);
    }

    const premiumMatch = line.match(/Est\.\s*([\d.]+)\s*Premium/i);
    if (premiumMatch) {
        result.premiumRequests = parseFloat(premiumMatch[1]);
    }

    return result;
}

/**
 * Parse CLI output into structured data
 * Handles both silent and non-silent modes
 */
export function parseCliOutput(stdout: string): ParsedOutput {
    const lines = stdout.split('\n');

    // Default values
    const result: ParsedOutput = {
        response: '',
        usage: {
            inputTokens: 0,
            outputTokens: 0,
            cacheReadTokens: 0,
            premiumRequests: 0,
            model: '',
        },
        duration: {
            apiSeconds: 0,
            wallSeconds: 0,
        },
        codeChanges: {
            linesAdded: 0,
            linesRemoved: 0,
        },
    };

    // Find where the stats section starts
    let statsStartIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        if (line.includes('Total usage est:') || line.includes('Usage by model:')) {
            // Stats section typically starts a few lines before
            statsStartIndex = i;
            // Look for the actual start
            for (let j = i; j >= Math.max(0, i - 10); j--) {
                if (lines[j].trim() === '' && j < i) {
                    statsStartIndex = j + 1;
                    break;
                }
                if (lines[j].includes('Total usage est:')) {
                    statsStartIndex = j;
                    break;
                }
            }
            break;
        }
    }

    // Extract response (everything before stats)
    if (statsStartIndex > 0) {
        result.response = lines
            .slice(0, statsStartIndex)
            .join('\n')
            .trim();
    } else {
        // No stats found, entire output is the response
        result.response = stdout.trim();
    }

    // Parse stats lines (only if stats section was found)
    if (statsStartIndex >= 0) {
        for (let i = statsStartIndex; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;

            // Total usage
            const usageMatch = line.match(/Total usage est:\s*([\d.]+)\s*Premium/i);
            if (usageMatch) {
                result.usage.premiumRequests = parseFloat(usageMatch[1]);
            }

            // API duration
            const apiDurationMatch = line.match(/Total duration \(API\):\s*([\d.]+)s/i);
            if (apiDurationMatch) {
                result.duration.apiSeconds = parseFloat(apiDurationMatch[1]);
            }

            // Wall duration
            const wallDurationMatch = line.match(/Total duration \(wall\):\s*([\d.]+)s/i);
            if (wallDurationMatch) {
                result.duration.wallSeconds = parseFloat(wallDurationMatch[1]);
            }

            // Code changes
            const codeChangesMatch = line.match(/Total code changes:\s*([\d]+)\s*lines added,\s*([\d]+)\s*lines removed/i);
            if (codeChangesMatch) {
                result.codeChanges.linesAdded = parseInt(codeChangesMatch[1], 10);
                result.codeChanges.linesRemoved = parseInt(codeChangesMatch[2], 10);
            }

            // Model usage line
            if (line.includes('input,') && line.includes('output')) {
                const usageInfo = parseUsageLine(line);
                if (usageInfo.model) result.usage.model = usageInfo.model;
                if (usageInfo.inputTokens) result.usage.inputTokens = usageInfo.inputTokens;
                if (usageInfo.outputTokens) result.usage.outputTokens = usageInfo.outputTokens;
                if (usageInfo.cacheReadTokens) result.usage.cacheReadTokens = usageInfo.cacheReadTokens;
            }
        }
    }

    return result;
}
