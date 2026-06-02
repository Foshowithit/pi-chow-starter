# Memory Directory

This directory mirrors the live Chow/Hector memory structure from `~/.pi/agent/`. Memory is the persistent
operational context for the lane-aware Pi agent personas (Chow CLI, Hector Dell GPU Agent, etc.).

## Phase 0 — Lane-Aware Prompt Builder

As of Phase 0, `build-prompt.mjs` supports multiple *lanes* (personas/configs) selected via `--lane`
or the `CHOW_LANE` environment variable. Each lane has its own persona, runtime description, and
optional lane-specific memory file overlays.

Supported lanes:

| Lane | Persona | Label | Focus |
|------|---------|-------|-------|
| `chow` (default) | Mr Chow | Chow CLI | General terminal-native Pi agent on Adam's Mac |
| `hector` | Hector | Hector Dell GPU Agent | Wan2.1 + Remotion on Dell WSL2 (RTX 4090) |

See `template/chow/build-prompt.mjs` for the full lane configuration.

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


### Lane-Specific Overlay Files

Lane-specific memory files can be placed under `lanes/{lane}/` within the chat directory.
When present, the prompt builder reads the shared base file first, then the lane overlay
(separated by `---`). This allows a shared memory root with persona-specific overrides.

| Lane File Path | Overlays Base File |
|----------------|-------------------|
| `lanes/chow/identity.md` | `identity.md` |
| `lanes/chow/active-task.md` | `active-task.md` |
| `lanes/chow/playbook.md` | `playbook.md` |
| `lanes/chow/continuity-capsule.md` | `continuity-capsule.md` |
| `lanes/chow/summaries.md` | `summaries.md` |
| `lanes/hector/identity.md` | `identity.md` |
| `lanes/hector/active-task.md` | `active-task.md` |
| `lanes/hector/playbook.md` | `playbook.md` |
| `lanes/hector/continuity-capsule.md` | `continuity-capsule.md` |
| `lanes/hector/summaries.md` | `summaries.md` |

If no lane overlay exists, the shared base file is used as-is.
### Second Brain Directory

`second-brain/` — Long-term knowledge base with:

| File | Purpose |
|------|---------|
| `context.md` | Primary second-brain context for Chow |
| `consolidated/` | Recent consolidated brain logs (up to 3 newest `.md` files) |

### Environment Variables

The prompt builder reads these environment variables to configure paths, limits, and lane selection:

- `CHOW_LANE` — Select lane (`chow` or `hector`); overridden by `--lane` CLI flag
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
    ↓ (lane overlays from lanes/{lane}/ if present)
    ↓ writes to
~/.pi/agent/chow/SYSTEM.generated.md
    ↓ consumed by
~/.pi/agent/bin/chow  (launches Pi CLI with generated system prompt)
```

### CLI Flags

| Flag | Description |
|------|-------------|
| `--lane <name>` | Select lane: `chow` (default) or `hector` |
| `--write [path]` | Write generated prompt to file (default: `~/.pi/agent/chow/SYSTEM.generated.md`) |
| `--stats` / `--check` | Print section character counts and estimated tokens instead of generating prompt |

### Regenerating the Prompt

```bash
chow --chow-prompt-file          # rebuild the generated prompt for default lane
# or directly:
node ~/.pi/agent/chow/build-prompt.mjs --write                      # default lane (chow)
node ~/.pi/agent/chow/build-prompt.mjs --lane hector --write        # hector lane
node ~/.pi/agent/chow/build-prompt.mjs --check --lane chow          # check chow stats
node ~/.pi/agent/chow/build-prompt.mjs --stats --lane hector        # check hector stats
```

## SECURITY

- **Never store raw API keys, tokens, or passwords in memory files.**
  Store only credential *locations* (e.g., `~/.pi/agent/auth.json`).
  The prompt builder's `redact()` function scrubs known key patterns at build time.
- The `TEMPLATES/` directory contains starter templates for new identity files.
