# PI-CHOW-STARTER 🐉🔥

> **Turn `pi` into a terminal-native agent with identity, memory, skills, and weapons.**

Mr Chow's personal Pi agent setup — now yours for the taking. This gives you the same framework Chow uses: a dynamic system prompt builder that reads from a local "memory" directory, a squadron of specialist sub-agents, 12+ custom skills, and a `chow` wrapper that makes `pi` feel like a persistent AI identity instead of a blank session.

## What You Get

| Feature | What It Does |
|---------|-------------|
| **`chow` CLI** | Wrapper around `pi` that injects your identity, memory, and skills on every launch |
| **Dynamic Prompt Builder** | Reads `identity.md`, `playbook.md`, `active-task.md`, and `second-brain/` → builds your system prompt live |
| **Memory OS** | Structured identity + rolling summaries + continuity capsule + daily logs |
| **12 Custom Skills** | Archon DAG workflows, stock/finance lookup, eval gates, orchestration patterns, video tools, alpha extraction, and more |
| **11 Specialist Agents** | Coder, Auditor, Mac Operator, Finance Analyst, Trading Quant pipeline (5 agents), and more |
| **Max Effort Extension** | Injects "MAXIMUM EFFORT DIRECTIVE" into DeepSeek model prompts automatically |
| **Model Router** | 3 profiles (balanced/fast/thorough) × 3 thinking levels for intelligent model selection |
| **30+ npm Packages** | Subagents, web access, interactive shells, intercom messaging, git nexus, visual explainer, QMD knowledge search, LSP integration, and many more |
| **DS Flash Foreman Mode** | One command delegates bounded tasks to DS Flash coder/researcher workers while you keep control |

## Quick Install

```bash
curl -sfL https://raw.githubusercontent.com/Foshowithit/pi-chow-starter/main/install.sh | bash
```

Or clone and run manually:

```bash
git clone https://github.com/Foshowithit/pi-chow-starter.git
cd pi-chow-starter
bash install.sh
```

## What Happens

The installer does NOT overwrite your existing pi setup. It:

1. **Copies** the `chow` wrapper, prompt builder, and template files into `~/.pi/agent/`
2. **Patches** your `~/.pi/agent/settings.json` to add the package list and config (creates backup first)
3. **Creates** a memory stub directory with template identity files
4. **Prints** the shell config you need to add to `~/.zshrc`
5. **Guides** you to set up API keys (or copies the example)

## After Install

Add to `~/.zshrc`:

```bash
export PATH="$HOME/.pi/agent/bin:$PATH"
export CHOW_CLI_MODEL="ollama/deepseek-v4-pro:cloud"
export CHOW_WORKER_MODEL="ollama/deepseek-v4-flash:cloud"
export CHOW_CLI_THINKING="low"
```

Then:

```bash
chow                    # Start Chow in Pi TUI
chow -c                 # Continue latest session
chow -p "hello"         # One-shot print mode
chow --chow-where       # Show paths/config
chow --dsflashmode      # Start in foreman mode

# Edit your identity
chow --chow-memory

# Specialist agents
chow-worker coder "fix this bug"
chow-worker researcher "investigate this API"
```

## Customize Your Identity

Edit `~/carl-bot/memory/-1003665370879/identity.md` with your own info:

```markdown
# Identity

## Who You Are
- Name: Your Name
- Role: Your Role
- Personality: What makes you unique

## Your Setup
- Key tools and workflows
- Machine info
- Preferred models
```

The prompt builder reads this file + `active-task.md` + `playbook.md` + `second-brain/` on every launch.

## Directory Structure

```
~/.pi/agent/
├── bin/
│   ├── chow              # Main wrapper (in PATH)
│   ├── chow-worker       # DS Flash worker delegate
│   └── chow-*            # Other helpers
├── chow/
│   ├── build-prompt.mjs  # Dynamic prompt builder
│   └── SYSTEM.md         # Reference prompt
├── agents/               # Specialist agent definitions
│   ├── coder.md
│   ├── auditor.md
│   ├── mac-operator.md
│   ├── john-finance.md
│   ├── trading-quant-*.md
│   └── agent-chain.yaml
├── skills/               # Custom skill modules
│   ├── archon-dag/
│   ├── stock-lookup/
│   ├── summarize/
│   └── ...
├── extensions/           # Pi extensions
│   └── max-effort/
├── prompts/              # Custom prompt templates
├── sessions/chow-terminal/  # Session storage
├── settings.json         # Pi config (patched)
├── compaction-policy.json
└── model-router.json

~/carl-bot/memory/-1003665370879/  # Your "brain"
├── identity.md            # Who you are (edit this)
├── active-task.md         # What you're working on
├── continuity-capsule.md  # Running state
├── playbook.md            # Your playbook
├── summaries.md           # Rolling summaries
└── second-brain/          # Context + logs
```

## API Keys Needed

The template ships with an `auth.json.example`. You need at least one provider keyed up:

- **Ollama Cloud** (free tier): `ollama` provider with API key
- **OpenCode Go** (free tier): `opencode-go` provider with API key
- **OpenAI Codex**: OAuth-based (set up via `pi`)

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full breakdown of how all pieces fit together.

---

*Built with 🔥 by Mr Chow. Fork it. Customize it. Make it yours.*
