import { parseWorkspaceContent } from '../../src/session/session-parser';

describe('parseWorkspaceContent', () => {
    it('should parse valid workspace.yaml content', () => {
        const content = `id: 785385ec-8126-484d-bc01-292dcc7f8a60
cwd: /Users/test/projects
summary_count: 0
created_at: 2026-01-21T20:59:24.565Z
updated_at: 2026-01-21T20:59:28.817Z
summary: You are the best senior LangChain curriculum designer...`;

        const result = parseWorkspaceContent(content);

        expect(result.id).toBe('785385ec-8126-484d-bc01-292dcc7f8a60');
        expect(result.cwd).toBe('/Users/test/projects');
        expect(result.summaryCount).toBe(0);
        expect(result.summary).toContain('LangChain');
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle missing optional fields', () => {
        const content = `id: test-session-id
cwd: /home/user
created_at: 2026-01-20T10:00:00.000Z
updated_at: 2026-01-20T12:00:00.000Z`;

        const result = parseWorkspaceContent(content);

        expect(result.id).toBe('test-session-id');
        expect(result.summary).toBe('');
        expect(result.summaryCount).toBe(0);
    });

    it('should parse dates correctly', () => {
        const content = `id: date-test
cwd: /test
created_at: 2026-01-15T08:30:00.000Z
updated_at: 2026-01-22T14:45:30.500Z`;

        const result = parseWorkspaceContent(content);

        expect(result.createdAt.getFullYear()).toBe(2026);
        expect(result.createdAt.getMonth()).toBe(0); // January
        expect(result.createdAt.getDate()).toBe(15);
        expect(result.updatedAt.getDate()).toBe(22);
    });

    it('should handle summary_count greater than zero', () => {
        const content = `id: compacted-session
cwd: /projects
summary_count: 3
created_at: 2026-01-10T00:00:00.000Z
updated_at: 2026-01-22T00:00:00.000Z
summary: Compacted conversation about...`;

        const result = parseWorkspaceContent(content);

        expect(result.summaryCount).toBe(3);
    });
});
