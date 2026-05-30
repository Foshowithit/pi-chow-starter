# Architecture — How It All Fits Together

## The Core Loop

```
You (terminal)
    │
    ▼
chow (bash wrapper)
    │
    ├── Reads env vars (CHOW_CLI_MODEL, CHOW_WORKER_MODEL, etc.)
    ├── Runs build-prompt.mjs
    │       │
    │       ├── Reads ~/carl-bot/memory/<CHAT_ID>/identity.md
    │       ├── Reads active-task.md
    │       ├── Reads continuity-capsule.md
    │       ├── Reads playbook.md
    │       ├── Reads summaries.md
    │       └── Reads second-brain/context.md + consolidated logs
    │       │
    │       └── Outputs: SYSTEM.generated.md (structured system prompt)
    │
    ├── Passes generated prompt to pi via --system-prompt
    └── Launches pi with session dir, model, provider overrides
            │
            ▼
        pi (the coding agent)
            │
            ├── Loads settings.json (packages, models, providers)
            ├── Loads extensions (max-effort, etc.)
            ├── Has access to skills, agents, tools
            └── Starts interactive TUI session
```

## Key Design Decisions

### Why a dynamic prompt builder instead of a static system prompt?

A static system prompt is the same every session. Chow's prompt builder reads from structured memory files, so:

- Your **identity** changes as you update it
- Your **active task** tracks what you're currently working on
- Your **continuity capsule** carries running state between sessions
- Your **playbook** captures learned patterns over time
- Your **second brain** provides consolidated context from past work

This means every Chow session starts with fresh, relevant context — not a stale blob.

### Why specialist agents instead of one super-agent?

Each agent has a narrow scope, specific tools, and a focused system prompt:

| Agent | Model | Scope |
|-------|-------|-------|
| `coder` | DS Flash | Scoped implementation, build-fix cycles |
| `auditor` | DS Flash | Code review, smoke tests, bug finding |
| `mac-operator` | DS Flash | macOS GUI automation via Axon |
| `john-finance` | DS Flash Pro | Stock research, SEC filings, markets |
| `trading-quant-*` | DS Flash | 5-agent ML/trading pipeline |

The **foreman pattern** (`chow --dsflashmode` or `chow-worker`) lets Chow delegate bounded tasks to these specialists while keeping final judgment and user-facing answers.

### Why max-effort extension?

DeepSeek models benefit from a "think harder" preamble. The max-effort extension auto-injects it for any model ID containing "deepseek", without bloating every agent's system prompt.

## Data Flow

```
identity.md  ──┐
active-task.md ─┤
playbook.md   ─┤── build-prompt.mjs ──► SYSTEM.generated.md ──► pi (as --system-prompt)
summaries.md  ─┤
second-brain/ ─┘

settings.json ──────────────────────────► pi (packages, models, providers)
compaction-policy.json ─────────────────► pi (compaction behavior)
model-router.json ──────────────────────► pi (model routing profiles)

extensions/max-effort/index.ts ─────────► pi extension API
agents/*.md ───────────────────────────► pi can load these as subagents
skills/*/SKILL.md ─────────────────────► pi loads on demand
```

## Package Architecture

The `settings.json` `packages` array loads 30+ npm modules that add:

- **Subagents** (`pi-subagents`): Delegate work to specialist agents
- **Web access** (`pi-web-access`): Browse, search, scrape
- **Interactive shells** (`pi-interactive-shell`): Launch TUI tools
- **Intercom** (`pi-intercom`): Cross-session messaging
- **Messenger** (`pi-messenger`): Multi-agent coordination/Crews
- **GitNexus** (`pi-gitnexus`): Code knowledge graph
- **LSP** (`pi-lsp-extension`): Language server protocol
- **Visual Explainer** (`visual-explainer`): Generate diagrams as HTML
- **QMD** (`pi-qmd`): Fast knowledge base search
- **Zerg Swarm** (`pi-zerg-swarm`): Multi-agent task orchestration
- **Stock Ticker** (`pi-stock-ticker`): Stock data
- **Model Router** (`pi-model-router`): Smart model selection
- **Review Loop** (`pi-review-loop`): Automated code review
- **Context Prune** (`pi-context-prune`): Smart compaction
- **Mermaid** (`pi-mermaid`): Diagram generation
- **And more...**

## Memory OS

```
~/carl-bot/memory/<CHAT_ID>/
├── identity.md           # Durable facts about you
├── active-task.md        # Current work focus
├── continuity-capsule.md # Running state across sessions
├── playbook.md           # Learned patterns and decisions
├── summaries.md          # Rolling session summaries
└── second-brain/
    ├── context.md        # Active context bundle
    ├── consolidated/     # Daily brain consolidations
    └── daily/            # Daily log files
```

The prompt builder reads these on every launch, truncating each section to configurable character limits (default 5K-22K depending on section). This keeps the prompt focused while carrying forward what matters.

## Custom Skills

Skills are structured markdown files with instructions for specific tasks:

- **archon-dag**: Multi-agent DAG workflows with isolated worktrees
- **stock-lookup**: Financial data via yfinance, SEC EDGAR, FRED, Polymarket
- **summarize**: URL/video/podcast/article summarization
- **orch-patterns**: Evidence-based agent orchestration
- **eval-gate**: Deterministic + LLM eval gates for code/video/agent outputs
- **hyperframes**: Video composition templates (4-phase)
- **cole-consult**: Cole Medlin Academy patterns translated to Pi/Ollama
- **alpha-extractor**: YouTube/podcast transcript → no-BS alpha report
- **oracle**: Prompt bundling for second-model review
- **video-frames**: FFmpeg frame extraction

Each skill lives in its own directory with a `SKILL.md` and optional associated files.
