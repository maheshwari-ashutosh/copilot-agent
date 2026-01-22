/**
 * Available Copilot AI models
 */
export const CopilotModel = {
    // Claude models
    CLAUDE_SONNET_4_5: 'claude-sonnet-4.5',
    CLAUDE_HAIKU_4_5: 'claude-haiku-4.5',
    CLAUDE_OPUS_4_5: 'claude-opus-4.5',
    CLAUDE_SONNET_4: 'claude-sonnet-4',

    // GPT Codex models
    GPT_5_2_CODEX: 'gpt-5.2-codex',
    GPT_5_1_CODEX_MAX: 'gpt-5.1-codex-max',
    GPT_5_1_CODEX: 'gpt-5.1-codex',
    GPT_5_1_CODEX_MINI: 'gpt-5.1-codex-mini',

    // GPT models
    GPT_5_2: 'gpt-5.2',
    GPT_5_1: 'gpt-5.1',
    GPT_5: 'gpt-5',
    GPT_5_MINI: 'gpt-5-mini',
    GPT_4_1: 'gpt-4.1',

    // Gemini models
    GEMINI_3_PRO_PREVIEW: 'gemini-3-pro-preview',
} as const;

export type CopilotModelType = (typeof CopilotModel)[keyof typeof CopilotModel];
