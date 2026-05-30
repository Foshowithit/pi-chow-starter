import type { ExtensionAPI, ExtensionCommandContext } from '@earendil-works/pi-coding-agent';

const MAX_EFFORT_PREAMBLE = `## MAXIMUM EFFORT DIRECTIVE

You are operating at MAXIMUM EFFORT. Think exhaustively before every action.
Double-check your reasoning. Consider alternative approaches before committing.
Verify assumptions — do not trust memory over fresh evidence. When in doubt,
investigate deeper rather than guessing. Your answers should demonstrate
thorough analysis, not quick reactions.`;

// Model IDs containing these strings get the max-effort preamble
const MAX_EFFORT_PATTERNS = ['deepseek'];

const maxEffort = (pi: ExtensionAPI) => {
  let enabled = true;

  pi.on('before_agent_start', (event, ctx) => {
    if (!enabled) return;

    const modelId = ctx.model?.id?.toLowerCase() || '';
    const shouldInject = MAX_EFFORT_PATTERNS.some((p) => modelId.includes(p));

    if (!shouldInject) return;

    // Avoid double-injection (e.g., after compaction)
    if (event.systemPrompt.includes('MAXIMUM EFFORT DIRECTIVE')) return;

    return {
      systemPrompt: `${MAX_EFFORT_PREAMBLE}\n\n${event.systemPrompt}`,
    };
  });

  pi.registerCommand('max-effort', {
    description: 'Toggle the max-effort system prompt directive for DeepSeek models',
    handler: async (_args: string, ctx: ExtensionCommandContext) => {
      enabled = !enabled;
      ctx.ui.notify(
        `Max-effort directive: ${enabled ? 'ON' : 'OFF'}\n` +
        `Affects models matching: ${MAX_EFFORT_PATTERNS.join(', ')}`,
        'info',
      );
    },
  });
};

export default maxEffort;
