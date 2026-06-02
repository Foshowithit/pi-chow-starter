# Memory Directory

This directory mirrors the live Chow memory structure from `~/.pi/agent/`. Memory is the persistent
operational context for Chow — the CLI-native Pi agent persona.

## Memory File Structure

The memory mirror lives at `~/carl-bot/memory/<chat-id>/` (or `~/hector-telegram-bot/memory/<chat-id>/`)
and is consumed by the Chow prompt builder at `template/chow/build-prompt.mjs`.

### Core Files

| File | Purpose | Max Chars |
|------|---------|-----------|
| `identity.md` | Durable facts about who Chow is, infrastructure, non-negotiables | 22,000 |
| `active-task.md` | Current active work, goals, in-progress state | 5,000 |
| `continuity-capsule.md` | Rolling context across sessions — key decisions, status | 9,000 |
| `summaries.md` | Automated conversation/session summaries | 14,000 |
| `playbook.md` | Learned patterns, preferences, standard operating procedures | 8,000 |

### Second Brain Directory

`second-brain/` — Long-term knowledge base with:

| File | Purpose |
|------|---------|
| `context.md` | Primary second-brain context for Chow |
| `consolidated/` | Recent consolidated brain logs (up to 3 newest `.md` files) |

### Environment Variables

The prompt builder reads these environment variables to configure paths and limits:

- `CHOW_MEMORY_ROOT` — Override memory root directory
- `CHOW_CHAT_ID` — Telegram chat ID for memory lane (default: `-1003665370879`)
- `CHOW_PROMPT_IDENTITY_CHARS`, `CHOW_PROMPT_ACTIVE_TASK_CHARS`, etc. — Size limits per section
- `CHOW_DSFLASH_MODE` — Enable DS Flash worker mode in prompts
- `CHOW_MANAGER_MODE` — Enable manager/orchestrator-only mode

## Build Pipeline

The prompt is built dynamically at runtime:

```
~/.pi/agent/chow/build-prompt.mjs
    ↓ reads from
~/carl-bot/memory/-1003665370879/{identity,active-task,...}.md
    ↓ writes to
~/.pi/agent/chow/SYSTEM.generated.md
    ↓ consumed by
~/.pi/agent/bin/chow  (launches Pi CLI with generated system prompt)
```

### Regenerating the Prompt

```bash
chow --chow-prompt-file          # rebuild the generated prompt
# or directly:
node ~/.pi/agent/chow/build-prompt.mjs --write
```

## SECURITY

- **Never store raw API keys, tokens, or passwords in memory files.**
  Store only credential *locations* (e.g., `~/.pi/agent/auth.json`).
  The prompt builder's `redact()` function scrubs known key patterns at build time.
- The `TEMPLATES/` directory contains starter templates for new identity files.
