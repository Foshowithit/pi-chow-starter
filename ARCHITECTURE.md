# Architecture — Manager + Subagent Pattern

Pi Chow is built around one idea: **the manager doesn't do the work.** It delegates. This document explains how that works, what decisions led us here, and where the tradeoffs are.

## 1. The Core Pattern: Manager + Subagents

Most AI coding tools put a single model in a loop. The model calls tools, gets results, calls more tools, and eventually produces an answer. This works for simple tasks but breaks down when:

- The context window fills with irrelevant tool outputs
- You need specialized knowledge (finance, video, macOS automation)
- You want to run multiple independent tasks in parallel
- You care about cost — one big model doing everything is expensive

Pi Chow solves this with a **manager pattern**.

```
┌──────────────────────────────────────────────────────┐
│                    Manager Model                      │
│              (DeepSeek V4 Pro / Nemotron)             │
│                                                        │
│   Role: Plan → Delegate → Review → Synthesize         │
│                                                        │
│   Does NOT: write code, search files, run tools        │
│                                                        │
└────────────────────┬───────────────────────────────────┘
                     │
      ┌──────────────┼──────────────┐
      │              │              │
      ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Coder    │  │ Auditor  │  │ Mac Op   │
│ DS Flash │  │ DS Flash │  │ DS Flash │
│ Write    │  │ Review   │  │ Automate │
│ code     │  │ code     │  │ macOS    │
└──────────┘  └──────────┘  └──────────┘
      │              │              │
      └──────────────┼──────────────┘
                     │
                     ▼
            ┌──────────────────┐
            │  Manager Review  │
            │  Acceptance Gate │
            │  Pass / Fail /   │
            │  Iterate         │
            └──────────────────┘
```

### Why this works

- **Bounded agents stay focused.** Each subagent gets a narrow task with its own system prompt, tools, and output contract. No context drift.
- **The manager sees the big picture.** It doesn't waste tokens on tool call outputs. It reads structured results and decides what to do next.
- **Parallel execution is native.** Independent subagents run concurrently. A stock analysis workflow fans out 5 agents simultaneously.
- **Cost scales with complexity.** Simple tasks use one Flash 3 call. Complex tasks fan out, but each piece is cheap.

### The tradeoff

Manager mode adds a round-trip of latency. For simple Q&A ("what's the weather") it's overhead. For multi-step workflows ("analyze this stock, generate a report, review it, and email it") it pays off in quality and cost.

## 2. Model Routing Strategy

We don't use one model. We route to the right model for the job, with automatic fallback chains.

```
┌─────────────────────────────────────────────────────────┐
│                  Model Router                            │
│                                                          │
│  Task Type          →  Primary Model   →  Fallback(s)   │
│  ─────────             ─────────────      ────────────  │
│  Planning/Review       Nemotron 3 Super   DS Flash 3     │
│  Manager orchestration DS V4 Pro         Nemotron 3      │
│  Code writing          DS Flash 3        Nemotron 3      │
│  Code review           DS Flash 3        DS V4 Pro       │
│  Heavy reasoning       DS V4 Pro         Nemotron 3 Super│
│  Stock/Finance         DS Flash 3        DS V4 Pro       │
│  Summarization         DS Flash 3        Nemotron 3      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Model rationale

| Model | Why we use it | Cost | Strengths |
|-------|---------------|------|-----------|
| **DeepSeek V4 Flash 3** | 90% of work | ~$0 via OpenCode Go free tier | Fast, capable, nearly free. Handles code, research, summarization, reviews. |
| **DeepSeek V4 Pro** | Manager, heavy reasoning | ~$0 via free tier | Stronger reasoning, better at planning and complex code. Used when Flash 3 isn't enough. |
| **Nemotron 3 Super** | Planning, review | Genuinely free | Good at structured thinking. Used as primary for planning/review, fallback for other tasks. |

### Fallback chain behavior

When a model call fails (rate limit, timeout, server error), the router tries the next model in the chain automatically:

```
Primary → First fallback → Second fallback → Fail with error message

Example:
  DS Flash 3 → Nemotron 3 → DS V4 Pro → Error
```

This means rate limits on free tiers degrade gracefully rather than breaking workflows. The tradeoff is slower response when hitting fallbacks — a Flash 3 task might complete on Nemotron in 2× the time.

### Key rotation

Free API tiers have daily caps. We mitigate by:
1. Maintaining multiple API keys per provider
2. Rotating keys on rate-limit errors
3. Routing to a different provider when all keys for one are exhausted

This isn't seamless — you'll notice degraded latency when rotating. But it keeps the session alive without paid keys.

## 3. Chain Execution

Workflows in Pi Chow execute in one of three modes:

### Sequential pipelines

Tasks that depend on previous results run in order:

```
Step A (researcher: gather data) ──► Step B (analyst: analyze) ──► Step C (writer: report)
```

Each step receives the artifacts from the previous step via file handoffs. The manager waits for completion before dispatching the next step.

### Parallel fan-out

Independent tasks run concurrently:

```
         ┌──► Stock price lookup ──┐
         │                         │
Manager ─┼──► SEC filing search ──┼──► Manager synthesizes
         │                         │
         └──► News sentiment ─────┘
```

All three subagents launch simultaneously. The manager collects results when all complete. This is the primary cost and speed advantage — a task that would cost $3 in Claude Code (sequential, one big model) costs $0.00 in Pi Chow (parallel, cheap models).

### Artifact contracts

Agents communicate through **files on disk** — not conversational context. This is intentional:

```
Agent A writes → /tmp/chow/chain-abc/step-1/output.json
Agent B reads  → /tmp/chow/chain-abc/step-1/output.json
Agent B writes → /tmp/chow/chain-abc/step-2/analysis.json
Manager reads  → /tmp/chow/chain-abc/step-2/analysis.json
```

Each artifact has a schema (the "contract"). Agents are prompted to follow that schema. This is deterministic — you can inspect exactly what passed between agents — but it's not conversational. Subagents can't ask clarifying questions of each other. The manager resolves any ambiguity.

### Template variables

Chains use template variables to wire connections:

| Variable | Meaning |
|----------|---------|
| `{task}` | The current task description |
| `{previous}` | Path to the previous step's output directory |
| `{chain_dir}` | Root directory for this chain execution |
| `{input_file}` | Specific input artifact path |
| `{output_file}` | Expected output artifact path |

The manager expands these before dispatching each subagent.

## 4. Acceptance Loops

Every goal-style task in Pi Chow follows a structured verification cycle:

```
┌──────────────────────────────────────────────────┐
│                  Task Assignment                   │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│             Subagent executes task                │
│  ┌──────────────────────────────────────────┐    │
│  │ Self-check: Does output meet criteria?   │    │
│  │ If no → revise and re-check              │    │
│  │ If yes → mark complete, produce evidence │    │
│  └──────────────────────────────────────────┘    │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│            Manager review gate                    │
│  ┌──────────────────────────────────────────┐    │
│  │ Verify criteria + evidence match         │    │
│  │ If fail → re-assign with specific notes  │    │
│  │ If pass → accept and synthesize          │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

### Components of an acceptance gate

Each task carries:
- **Acceptance criteria** — what "done" looks like, in measurable terms
- **Evidence** — what the subagent produces to prove it met the criteria
- **Verification** — how the manager checks the evidence (automated or manual)
- **Bound** — maximum iterations before escalating

The bound prevents infinite loops. If a subagent can't pass after N attempts, the manager flags it for human intervention rather than burning through tokens.

### Self-check before handoff

Subagents run an internal acceptance check before returning results. This catches obvious failures early and saves a round-trip to the manager. The subagent's system prompt includes instruction to verify its own output against the acceptance criteria before marking done.

## 5. Memory OS

Pi Chow replaces a static system prompt with a **live memory directory** that the prompt builder reads on every launch.

```
~/.pi/agent/
└── memory/
    ├── identity.md              # Who you are
    ├── active-task.md           # Current focus
    ├── continuity-capsule.md    # Cross-session state
    ├── playbook.md              # Learned patterns
    ├── summaries.md             # Rolling session summaries
    └── second-brain/
        ├── context.md           # Active context
        ├── consolidated/        # Daily brain dumps
        └── daily/               # Daily logs
```

### Memory file purposes

| File | What it holds | When it changes |
|------|---------------|-----------------|
| **identity.md** | Name, role, personality, tools, machine setup | Rarely — manual edits |
| **active-task.md** | What you're working on right now | Every session start/end |
| **continuity-capsule.md** | Running state, decisions in flight, open questions | Throughout a session |
| **playbook.md** | Patterns you've learned, setups, workflows | When you discover a repeatable pattern |
| **summaries.md** | Compressed history of recent sessions | After each session |
| **second-brain/context.md** | Bundled context for the current focus area | When context shifts |

### Why files instead of a database

- **You can edit them with any editor.** No special tooling needed.
- **You can version them with git.** The whole memory directory can live in a repo.
- **You can read them without Pi Chow.** Plain markdown.
- **No lock-in.** If you stop using `pi`, your memory is just markdown files.

### Known limitation

Local and remote memory aren't synced automatically. If you have a multi-machine setup, you manually merge using timestamped sidecar files. This is v1 — we expect to improve it, but for now it's honest about what it is.

## 6. Dynamic Prompt Builder

The prompt builder (`build-prompt.mjs`) is the bridge between memory and the AI session.

### What it does

1. Reads every file in the memory directory
2. Assembles them into a structured system prompt
3. Applies lane-specific instructions (chow/hector/other personas)
4. Truncates each section to configured character limits
5. Writes the result to `SYSTEM.generated.md`
6. `chow` passes this to `pi` as `--system-prompt`

### Lane awareness

Different personas get different prompt assembly:

| Lane | Personality | Memory sections included |
|------|-------------|------------------------|
| **chow** | Direct, technical, high-effort | Identity + active-task + playbook + continuity + second-brain |
| **hector** | Financial analyst, trading focus | Identity (finance) + active-task + stock playbook + continuity |
| **default** | Standard coding assistant | Identity + active-task + summaries |

### Truncation strategy

Each memory section has a configurable character limit. Defaults:

| Section | Default limit | Notes |
|---------|--------------|-------|
| identity.md | 5,000 | Durable facts — shouldn't be huge |
| active-task.md | 3,000 | Current focus — short by nature |
| continuity-capsule.md | 5,000 | Running state — pruned as tasks complete |
| playbook.md | 10,000 | Patterns — can grow, oldest entries dropped first |
| summaries.md | 22,000 | Rolling history — truncated from the top |
| second-brain/ | 10,000 | Context — most recent entries kept |

These are set in `settings.json` and can be adjusted. The truncation ensures the system prompt stays under the model's effective context window even with months of accumulated memory.

### Output

The builder produces `SYSTEM.generated.md` — a single file containing the assembled prompt. This file is git-ignored (it's a build artifact, not source). You can inspect it after any `chow` launch to see exactly what was sent to the model.

## 7. Comparison with Other Architectures

Understanding where Pi Chow fits relative to other tools helps decide when to use which.

### Claude Code

Claude Code runs a flat loop: a single Claude model calling tools until the task is done. There's no delegation, no parallel execution, no routing.

```
while (model_has_tool_call) {
    result = model.call_tool(tool_call);
    context.append(result);
}
```

- **Strengths**: Simple, works well for single-file edits, strong code generation
- **Weaknesses**: Expensive ($3–15/session), single model single context, no specialization, no parallelism
- **Cost**: You pay Claude's token rates for every tool call + output token in the loop

Pi Chow's advantage: cost (100× cheaper), parallelism, specialization. Claude Code's advantage: simpler setup, no manager overhead, stronger out-of-box code generation for simple tasks.

### OpenCLAW

OpenCLAW is a gateway daemon — it sits between messaging channels and AI providers, routing messages through hierarchical models. It's designed for Slack/Telegram/Discord bots.

```
Slack → OpenCLAW Gateway → Router → Model → Response → Slack
```

- **Strengths**: Multi-channel messaging, hierarchical model routing, stateful conversations
- **Weaknesses**: Terminal-native? No. Designed for chat platforms. Setup is `git clone` + configuration.
- **Model routing**: Configurable but doesn't auto-fallback like Pi Chow's chain system.

Pi Chow's advantage: terminal-native, auto-fallback chains, memory OS. OpenCLAW's advantage: messaging gateways, production-ready for chatbot scenarios.

### Hermes

Hermes is a Python agent framework with a compounding skill loop — it creates reusable skills from experience, claiming 40% faster task completion on repeated work.

```python
result = await hermes.execute(task)
hermes.learn_from_experience(task, result)  # Compounds skills
```

- **Strengths**: Skill compounding is real — repeated tasks get measurably faster. 18+ model providers. MCP support.
- **Weaknesses**: No native parallel fan-out. Python dependency (not terminal-native). Cost scales with API usage.
- **Install**: `pip install hermes` — Python ecosystem only.

Pi Chow's advantage: parallel execution, terminal-native, cost optimization. Hermes's advantage: skill compounding, MCP ecosystem, Python integration.

### Where Pi Chow fits

| Dimension | Pi Chow | Best for |
|-----------|---------|----------|
| **Cost-sensitive workflows** | ✅ $0–0.03/session | Batch processing, research, analysis |
| **Complex multi-step tasks** | ✅ Manager + acceptance loops | Stock analysis, code review pipelines |
| **Parallel fan-out** | ✅ Native | Independent subtasks |
| **Terminal-native** | ✅ Install via curl | Developers, CLI workflows |
| **Chat/messaging integration** | ❌ Not built-in | Slack bots, Telegram assistants |
| **Skill compounding** | ❌ Not yet | Repetitive task automation |
| **Simple single-file edit** | ⚠️ Overkill | Claude Code or direct edit |
| **One-shot Q&A** | ⚠️ Overkill | Direct LLM chat |

### The bottom line

Pi Chow optimizes for **cost** and **complexity**. If your task can be done by a single model call, use something simpler. If you're running multi-step workflows, need specialization, or want to keep API costs at zero, Pi Chow's architecture wins.

## Summary

```
┌──────────────────────────────────────────────────────────────────┐
│                    Pi Chow Architecture                           │
│                                                                  │
│  ┌─────────┐    ┌──────────────┐    ┌─────────────────────────┐ │
│  │ Memory  │───►│ Prompt       │───►│ pi (manager model)      │ │
│  │ OS      │    │ Builder      │    │                         │ │
│  │         │    │ (build-      │    │  Plans tasks            │ │
│  │ Files:  │    │  prompt.mjs) │    │  Delegates to subagents │ │
│  │ identity│    │              │    │  Reviews results        │ │
│  │ tasks   │    │ Reads memory │    │  Synthesizes output     │ │
│  │ capsule │    │ → Truncates  │    │                         │ │
│  │ playbook│    │ → Assembles  │    └─────────┬───────────────┘ │
│  │ brain/  │    │ → Outputs    │              │                 │
│  └─────────┘    └──────────────┘              │                 │
│                                               ▼                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Subagent Pool                               │   │
│  │                                                          │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │   │
│  │  │ Coder  │ │Auditor │ │Mac Op  │ │Finance │  ...       │   │
│  │  │Flash 3 │ │Flash 3 │ │Flash 3 │ │V4 Pro  │           │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘           │   │
│  │                                                          │   │
│  │  Each subagent: bounded task + tools + output contract   │   │
│  │  Results → file artifacts → manager review               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Model Router: Flash 3 ↔ V4 Pro ↔ Nemotron (auto fallback)      │
│  Chain Modes: Sequential │ Parallel │ Hybrid                     │
│  Acceptance: Criteria → Evidence → Verify → Bound               │
└──────────────────────────────────────────────────────────────────┘
```

---

*Built with 🔥 by Mr Chow. MIT Licensed.*
