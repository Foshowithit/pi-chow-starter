# Architecture

## Manager + Subagent Pattern

The core insight: **the manager doesn't do the work. It delegates.**

Most AI coding agents run every request through a single model. Pi Chow separates orchestration from execution:

- **Manager model** (DeepSeek V4 Pro): plans, delegates to subagents, reviews results, iterates
- **Subagent models** (DeepSeek V4 Flash): execute bounded tasks with focused context

### Why This Works

| Factor | Monolithic Agent | Pi Chow |
|--------|-----------------|---------|
| Context per request | 100K+ tokens | Bounded per subagent (~8K) |
| Cost per session | $3–15 (Claude Code) | $0.00–0.03 |
| Parallelism | Sequential | Fan-out to N subagents |
| Failure isolation | Single point | Subagent retries independently |

## Model Routing

Tasks route by type to the most cost-effective model:

| Task Type | Primary | Fallback |
|-----------|---------|----------|
| Planning, architecture | DeepSeek V4 Pro | Nemotron 3 Super |
| Code, debugging | DeepSeek V4 Flash | Ollama Flash |
| Research | DeepSeek V4 Flash | Gemini 3 Flash |
| Quick audit | DeepSeek V4 Flash (low) | Nemotron 3 Super |
| Vision | Mimo V2.5 | Big Pickle |

Three profiles: **balanced** (default), **fast** (all flash), **thorough** (full reasoning).

## Chain Execution

```
Scout → Plan → Implement → Validate → Report
```

Each step writes structured artifacts to disk. This provides observability, resumability, and parallelism.

## Memory OS

Four core files form the agent's persistent identity:

- **identity.md**: who the agent is, setup, principles
- **active-task.md**: current work item with progress
- **continuity-capsule.md**: state snapshot across lanes
- **playbook.md**: learned patterns and preferences

The **dynamic prompt builder** (`build-prompt.mjs`) reads these at session start, assembles them into a system prompt with per-section limits and secret redaction.

## Checkpoint System

Checkpoints capture session state for continuity across interruptions. Stored in `~/.pi/agent/chow-memory-v2/checkpoints/` and injected into the prompt builder output.

## Directory Layout

```
~/.pi/agent/
├── bin/                  # CLI entry points
├── chow/                 # Config and modules
│   ├── build-prompt.mjs  # Prompt assembler
│   └── commands/         # Custom commands
├── pi-config/            # Settings, model router, compaction
├── agents/               # Subagent definitions
├── skills/               # Skill definitions
├── extensions/           # Pi extensions
└── prompts/              # Prompt templates

~/carl-bot/memory/
├── identity.md
├── active-task.md
├── continuity-capsule.md
├── playbook.md
├── summaries.md
├── lanes/                # Lane-specific overlays
└── second-brain/         # Long-term knowledge
