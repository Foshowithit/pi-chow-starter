# Pi Chow Starter

**A starter kit that turns `pi` into a terminal-native agent framework — with identity, memory, subagent delegation, and a cost that beats Claude Code by 100×.**

One command to install. No subscription. No lock-in. Bring your own API key and you're running the same architecture used in production for stock analysis, code review, video pipelines, and market research.

## What This Is

Most AI coding tools give you one model doing everything. Claude Code runs a flat `while(model_has_tool_call)` loop — one model, one context window, 8 tools. Aider splits Architect/Editor but still uses the same model approach.

**Pi Chow is different.** It uses a **manager model + subagent pattern**:

- One model (the Manager) plans, delegates, and reviews — it doesn't do the work
- Bounded specialist agents (Subagents) execute focused tasks with their own context
- Results come back to the manager for synthesis and quality check
- You can fan out 10 subagents in parallel — each with their own model, tools, and context

The result: near-zero cost per session, better quality through specialization, and the ability to scale to complex multi-step workflows without context rot.

## Architecture in 30 Seconds

```
You (terminal)
  │
  └── pi (manager mode)
        ├── Delegates to: Subagent A (coder) — writes code
        ├── Delegates to: Subagent B (researcher) — investigates
        ├── Delegates to: Subagent C (auditor) — reviews results
        ├── Chains: A → B → C with artifact handoffs
        └── Reviews: Acceptance criteria → self-check → loop or done
```

The manager never does the work itself. It orchestrates. This is the difference between a solo developer and a team lead.

## Cost Comparison

| Tool | Cost per session | Architecture | Lock-in |
|------|-----------------|--------------|---------|
| **Claude Code** | $3–15 | Single model loop | Claude-only |
| **Aider** | $0.50–5 | Architect/Editor | Model configurable |
| **Copilot** | $10/mo | Chat + inline | GitHub-only |
| **Pi Chow (this)** | **$0.00–0.03** | **Manager + subagents** | **Any model** |

We route the manager to DeepSeek V4 Pro (~$0/task via free tier) and workers to DS Flash 3 (~$0/task). Heavy reasoning uses V4 Pro. 90% of tasks use Flash 3. Free Nemotron models handle planning and review.

**Real result: a full stock analysis workflow costs $0.00 in API fees.**

## One-Line Install

```bash
curl -sfL https://raw.githubusercontent.com/Foshowithit/pi-chow-starter/main/install.sh | bash
```

Requires: `pi` CLI installed (https://github.com/nicepkg/pi) and at least one API key.

## What You Get

| Feature | Description |
|---------|-------------|
| **`chow` CLI** | Wrapper that builds your system prompt from memory files every session |
| **Memory OS** | Identity, active tasks, playbook, continuity capsule — structured knowledge that persists |
| **3 core agents** | Coder, Auditor, Mac Operator — focused, bounded specialists |
| **10 custom skills** | Archon DAGs, stock/finance lookup, evaluation gates, summarization, video tools |
| **Model router** | Automatic fallback chains — if Flash 3 is rate-limited, Nemotron handles it |
| **Max Effort extension** | Auto-injects "think harder" directive for DeepSeek models |
| **13 pi packages** | Subagents, web access, inter-shell, intercom, messenger, review-loop, model-switch, and more |

## Where We're Honest About Weaknesses

This section is for people who actually evaluate tooling. Every framework has tradeoffs:

- **Rate limits bite us.** Free tiers have daily caps per key. We rotate keys and route to fallbacks, but it's not seamless. If you need guaranteed always-on, add a paid key.
- **Subagents lose context.** Fork mode helps but bounded agents don't always see the full picture. We use artifact contracts (files on disk) for handoffs — deterministic but not conversational.
- **No messaging gateway.** Unlike OpenCLAW (Slack/Telegram/Discord) or Hermes (20+ channel adapters), we're terminal-native. That's a feature for developers, a gap if you want a Slackbot.
- **Memory sync is v1.** Local and remote memory aren't fully synced. Manual merge with timestamped sidecars.
- **No skill compounding.** Hermes creates skills from experience (claims 40% faster on repeated tasks). We do acceptance loops but no automated pattern extraction yet.
- **Manager latency.** Manager mode adds overhead vs a single model. Worth it for complex tasks, overkill for "what's the weather."

## How It Compares

| Dimension | Claude Code | OpenCLAW | Hermes | **Us** |
|-----------|------------|----------|--------|--------|
| Subagent delegation | No (flat loop) | Hierarchical | delegate_tool | **Manager pattern** |
| Self-review | No | No | No | **Acceptance loops** |
| Parallel execution | No | Via cron | No | **Native fan-out** |
| Model routing | Claude-only | Configurable | 18+ providers | **Auto fallback chains** |
| Cost per session | $3–15 | API + infra | API costs | **$0–0.03** |
| Install | npm global | `git clone` | `pip install` | **`curl \| bash`** |

## Quick Start After Install

```bash
# Add to ~/.zshrc
export PATH="$HOME/.pi/agent/bin:$PATH"
export CHOW_CLI_MODEL="opencode-go/deepseek-v4-pro"
export CHOW_WORKER_MODEL="opencode-go/deepseek-v4-flash"

# Start Chow
chow

# Delegate to a specialist
chow-worker coder "add error handling to this function"
chow-worker researcher "investigate this API's rate limits"
```

---

*Built with 🔥 by Mr Chow. MIT Licensed. Not affiliated with the Hangover movie. Mostly.*
