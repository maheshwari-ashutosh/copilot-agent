/**
 * Resume session example - Continue a previous conversation
 */
import { CopilotClient, CopilotModel } from '../src/index.js';

async function main() {
    // Get session ID from command line or use the most recent session
    const sessionId = process.argv[2];

    if (!sessionId) {
        // List recent sessions and use the most recent one
        const recentSession = await CopilotClient.getMostRecentSession();

        if (!recentSession) {
            console.log('No previous sessions found. Run basic-usage.ts first.');
            process.exit(1);
        }

        console.log('Using most recent session:');
        console.log(`  ID: ${recentSession.id}`);
        console.log(`  Summary: ${recentSession.summary}`);
        console.log(`  Updated: ${recentSession.updatedAt.toISOString()}`);
        console.log('');

        await resumeSession(recentSession.id);
    } else {
        await resumeSession(sessionId);
    }
}

async function resumeSession(sessionId: string) {
    // Create client with session ID to resume
    const client = new CopilotClient({
        model: CopilotModel.GPT_5_MINI,
        sessionId: sessionId, // Resume this specific session
        allowAll: true,
    });

    console.log(`Resuming session: ${sessionId}`);
    console.log('Sending follow-up prompt...\n');

    try {
        const response = await client.prompt('What was my previous question?');

        console.log('--- Response ---');
        console.log(response.output);

        console.log('\n--- Session preserved ---');
        console.log(`Session ID: ${response.sessionId}`);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
