/**
 * Streaming example - Watch response come in real-time
 */
import { CopilotClient } from '../src/index.js';

async function main() {
    const client = new CopilotClient();

    console.log('Streaming response from Copilot...\n');
    console.log('─'.repeat(50));

    try {
        // Use promptStream for real-time output
        for await (const chunk of client.promptStream('Write a 500 word essay about corporate life for HR')) {
            if (chunk.type === 'content') {
                process.stdout.write(chunk.content);
            } else if (chunk.type === 'error') {
                // process.stderr.write(`[Error]: ${chunk.content}`);
            }
        }

        console.log('\n' + '─'.repeat(50));
        console.log('\n✓ Streaming complete');

        // Session ID is available after streaming completes
        const sessionId = client.getLastSessionId();
        if (sessionId) {
            console.log(`Session ID: ${sessionId}`);
        }
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
