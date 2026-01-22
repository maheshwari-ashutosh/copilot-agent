/**
 * List sessions example - Discover available sessions
 */
import { CopilotClient } from '../src/index.js';

async function main() {
    console.log('Fetching available Copilot sessions...\n');

    try {
        // List recent sessions (limit to 10, sorted by most recent)
        const sessions = await CopilotClient.listSessions({
            limit: 10,
            sortBy: 'updatedAt',
            sortOrder: 'desc',
        });

        if (sessions.length === 0) {
            console.log('No sessions found.');
            console.log('Start a new session with: npx ts-node examples/basic-usage.ts');
            return;
        }

        console.log(`Found ${sessions.length} session(s):\n`);

        for (const session of sessions) {
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`ID:      ${session.id}`);
            console.log(`Summary: ${session.summary || '(no summary)'}`);
            console.log(`CWD:     ${session.cwd}`);
            console.log(`Created: ${session.createdAt.toISOString()}`);
            console.log(`Updated: ${session.updatedAt.toISOString()}`);
            console.log('');
        }

        // Show how to resume
        const mostRecent = sessions[0];
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('To resume a session programmatically:');
        console.log('');
        console.log(`  const client = new CopilotClient({`);
        console.log(`    sessionId: '${mostRecent.id}',`);
        console.log(`    allowAll: true,`);
        console.log(`  });`);
        console.log('');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
