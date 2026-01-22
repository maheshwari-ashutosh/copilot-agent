import { parseCliOutput } from '../../src/executor/output-parser';

describe('parseCliOutput', () => {
    it('should parse simple response with stats', () => {
        const output = `Hello — current session ID: 837b431a-5881-42ea-bda5-7e8d586d7e91.


Total usage est:       0 Premium requests
Total duration (API):  6s
Total duration (wall): 12s
Total code changes:    0 lines added, 0 lines removed
Usage by model:
    gpt-5-mini           12.1k input, 293 output, 2.6k cache read (Est. 0 Premium requests)`;

        const result = parseCliOutput(output);

        expect(result.response).toBe('Hello — current session ID: 837b431a-5881-42ea-bda5-7e8d586d7e91.');
        expect(result.usage.model).toBe('gpt-5-mini');
        expect(result.usage.inputTokens).toBe(12100);
        expect(result.usage.outputTokens).toBe(293);
        expect(result.usage.cacheReadTokens).toBe(2600);
        expect(result.usage.premiumRequests).toBe(0);
        expect(result.duration.apiSeconds).toBe(6);
        expect(result.duration.wallSeconds).toBe(12);
        expect(result.codeChanges.linesAdded).toBe(0);
        expect(result.codeChanges.linesRemoved).toBe(0);
    });

    it('should parse response with code changes', () => {
        const output = `Fixed the bug in main.js


Total usage est:       1 Premium requests
Total duration (API):  15s
Total duration (wall): 20s
Total code changes:    25 lines added, 10 lines removed
Usage by model:
    gpt-5.2              50k input, 1.5k output, 0 cache read (Est. 1 Premium requests)`;

        const result = parseCliOutput(output);

        expect(result.response).toBe('Fixed the bug in main.js');
        expect(result.codeChanges.linesAdded).toBe(25);
        expect(result.codeChanges.linesRemoved).toBe(10);
        expect(result.usage.inputTokens).toBe(50000);
        expect(result.usage.outputTokens).toBe(1500);
    });

    it('should handle response with no stats (silent mode)', () => {
        const output = 'Just a simple response with no stats';

        const result = parseCliOutput(output);

        expect(result.response).toBe('Just a simple response with no stats');
        expect(result.usage.inputTokens).toBe(0);
        expect(result.usage.outputTokens).toBe(0);
    });

    it('should handle multi-line response', () => {
        const output = `Here is a multi-line response.

It has several paragraphs.

And some code:
\`\`\`javascript
console.log("hello");
\`\`\`


Total usage est:       0 Premium requests
Total duration (API):  5s
Total duration (wall): 8s
Total code changes:    0 lines added, 0 lines removed
Usage by model:
    gpt-5-mini           10k input, 500 output, 0 cache read (Est. 0 Premium requests)`;

        const result = parseCliOutput(output);

        expect(result.response).toContain('multi-line response');
        expect(result.response).toContain('console.log("hello");');
        expect(result.usage.inputTokens).toBe(10000);
        expect(result.usage.outputTokens).toBe(500);
    });

    it('should parse token counts with different formats', () => {
        const output = `Response


Total usage est:       2 Premium requests
Total duration (API):  10s
Total duration (wall): 15s
Total code changes:    100 lines added, 50 lines removed
Usage by model:
    claude-sonnet-4      1.5m input, 25k output, 500k cache read (Est. 2 Premium requests)`;

        const result = parseCliOutput(output);

        expect(result.usage.model).toBe('claude-sonnet-4');
        expect(result.usage.inputTokens).toBe(1500000);
        expect(result.usage.outputTokens).toBe(25000);
        expect(result.usage.cacheReadTokens).toBe(500000);
    });
});
