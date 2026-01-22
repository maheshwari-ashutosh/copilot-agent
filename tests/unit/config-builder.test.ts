import { buildCliArgs, validateConfig } from '../../src/config/config-builder';
import type { CopilotClientConfig } from '../../src/config/types';

describe('buildCliArgs', () => {
    const prompt = 'Test prompt';

    it('should build basic args with just a prompt', () => {
        const config: CopilotClientConfig = {};
        const args = buildCliArgs(config, prompt);
        expect(args).toEqual(['-p', prompt]);
    });

    it('should include model when specified', () => {
        const config: CopilotClientConfig = { model: 'gpt-5-mini' };
        const args = buildCliArgs(config, prompt);
        expect(args).toContain('--model');
        expect(args).toContain('gpt-5-mini');
    });

    it('should include sessionId with --resume flag', () => {
        const config: CopilotClientConfig = { sessionId: 'test-session-123' };
        const args = buildCliArgs(config, prompt);
        expect(args).toContain('--resume');
        expect(args).toContain('test-session-123');
    });

    it('should include --continue when continueLastSession is true', () => {
        const config: CopilotClientConfig = { continueLastSession: true };
        const args = buildCliArgs(config, prompt);
        expect(args).toContain('--continue');
    });

    it('should include --allow-all when allowAll is true', () => {
        const config: CopilotClientConfig = { allowAll: true };
        const args = buildCliArgs(config, prompt);
        expect(args).toContain('--allow-all');
        expect(args).not.toContain('--allow-all-tools');
        expect(args).not.toContain('--allow-all-paths');
    });

    it('should include individual permission flags when allowAll is false', () => {
        const config: CopilotClientConfig = {
            allowAllTools: true,
            allowAllPaths: true,
            allowAllUrls: true,
        };
        const args = buildCliArgs(config, prompt);
        expect(args).toContain('--allow-all-tools');
        expect(args).toContain('--allow-all-paths');
        expect(args).toContain('--allow-all-urls');
    });

    it('should include allowed tools', () => {
        const config: CopilotClientConfig = {
            allowedTools: ['shell(git:*)', 'write'],
        };
        const args = buildCliArgs(config, prompt);
        expect(args).toContain('--allow-tool');
        expect(args).toContain('shell(git:*)');
        expect(args).toContain('write');
    });

    it('should include denied tools', () => {
        const config: CopilotClientConfig = {
            deniedTools: ['shell(rm)', 'shell(git push)'],
        };
        const args = buildCliArgs(config, prompt);
        expect(args).toContain('--deny-tool');
        expect(args).toContain('shell(rm)');
        expect(args).toContain('shell(git push)');
    });

    it('should include additional directories', () => {
        const config: CopilotClientConfig = {
            additionalDirs: ['/home/user/projects', '/tmp'],
        };
        const args = buildCliArgs(config, prompt);
        expect(args).toContain('--add-dir');
        expect(args).toContain('/home/user/projects');
        expect(args).toContain('/tmp');
    });

    it('should include MCP configuration as JSON', () => {
        const mcpConfig = { server: { command: 'test' } };
        const config: CopilotClientConfig = {
            additionalMcpConfig: mcpConfig,
        };
        const args = buildCliArgs(config, prompt);
        expect(args).toContain('--additional-mcp-config');
        expect(args).toContain(JSON.stringify(mcpConfig));
    });

    it('should include behavior flags', () => {
        const config: CopilotClientConfig = {
            noAskUser: true,
            noCustomInstructions: true,
            silent: true,
            noColor: true,
            logLevel: 'debug',
        };
        const args = buildCliArgs(config, prompt);
        expect(args).toContain('--no-ask-user');
        expect(args).toContain('--no-custom-instructions');
        expect(args).toContain('--silent');
        expect(args).toContain('--no-color');
        expect(args).toContain('--log-level');
        expect(args).toContain('debug');
    });

    it('should include streaming mode', () => {
        const config: CopilotClientConfig = { streaming: false };
        const args = buildCliArgs(config, prompt);
        expect(args).toContain('--stream');
        expect(args).toContain('off');
    });

    it('should always end with -p and prompt', () => {
        const config: CopilotClientConfig = { model: 'gpt-5-mini', allowAll: true };
        const args = buildCliArgs(config, prompt);
        expect(args[args.length - 2]).toBe('-p');
        expect(args[args.length - 1]).toBe(prompt);
    });
});

describe('validateConfig', () => {
    it('should not throw for valid config', () => {
        expect(() => validateConfig({})).not.toThrow();
        expect(() => validateConfig({ model: 'gpt-5-mini' })).not.toThrow();
        expect(() => validateConfig({ sessionId: 'test-123' })).not.toThrow();
    });

    it('should throw when both sessionId and continueLastSession are set', () => {
        const config: CopilotClientConfig = {
            sessionId: 'test-123',
            continueLastSession: true,
        };
        expect(() => validateConfig(config)).toThrow(/sessionId.*continueLastSession/i);
    });
});
