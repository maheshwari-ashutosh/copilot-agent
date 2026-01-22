/**
 * Basic usage example - Create a new session and execute a prompt
 */
import { CopilotClient, CopilotModel } from '../src/index.js';

async function main() {
    // Create a new client with permissions enabled
    const client = new CopilotClient({
        model: CopilotModel.GPT_5_MINI,
        allowAll: true, // Enable all permissions for non-interactive use
    });

    console.log('Sending prompt to Copilot...');

    try {
        const response = await client.prompt('What is 2 + 2? Answer in one word.');

        console.log('\n--- Response ---');
        console.log(response.output);

        console.log('\n--- Session Info ---');
        console.log(`Session ID: ${response.sessionId}`);
        console.log(`Exit Code: ${response.exitCode}`);

        console.log('\n--- Usage Metrics ---');
        console.log(`Model: ${response.usage.model}`);
        console.log(`Input Tokens: ${response.usage.inputTokens}`);
        console.log(`Output Tokens: ${response.usage.outputTokens}`);
        console.log(`Cache Read: ${response.usage.cacheReadTokens}`);
        console.log(`Premium Requests: ${response.usage.premiumRequests}`);

        console.log('\n--- Duration ---');
        console.log(`API Time: ${response.duration.apiSeconds}s`);
        console.log(`Wall Time: ${response.duration.wallSeconds}s`);

        // Save session ID for later resumption
        console.log('\n💡 To resume this session, use:');
        console.log(`   sessionId: '${response.sessionId}'`);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
