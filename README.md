# Pi Chow Starter

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](VERSION)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**Turn `pi` into a terminal-native agent framework with identity, memory, and subagent delegation.**

Pi Chow adds structured identity, persistent memory, and a manager+subagent execution pattern on top of the [pi coding agent](https://github.com/nicepkg/pi). One model plans and delegates while bounded specialist agents execute — reducing cost by 100× versus monolithic approaches.

```bash
curl -sfL https://raw.githubusercontent.com/Foshowithit/pi-chow-starter/main/install.sh | bash
```

## Why Pi Chow

| Approach | Cost per session | Architecture |
|----------|-----------------|--------------|
| **Pi Chow** | $0.00–0.03 | Manager delegates to bounded subagents |
| Claude Code | $3–15 | Single monolithic model |
| Aider + GPT-4o | $1–5 | Single model per request |

The manager handles planning, delegation, and review. Subagents execute bounded tasks using cheaper models. The result is production output at near-zero cost.

## Features

- **Manager + subagent pattern** — plan, delegate, review, iterate
- **Memory OS** — identity, active-task, continuity, playbook as structured files
- **Model routing** — task-type routing with fallback chains across providers
- **Chain execution** — sequential pipelines, parallel fan-out, artifact contracts
- **Dynamic prompt builder** — lane-aware assembly with secret redaction
- **Checkpoint system** — session continuity across interruptions
- **3 core agents**: Coder, Auditor, Mac Operator
- **10 custom skills**: Alpha Extractor, Archon DAG, Eval Gate, and more

## Quick Start

**Prerequisites:** [pi CLI](https://github.com/nicepkg/pi), API key, bash 3.2+, node 18+

```bash
# One-line install
curl -sfL https://raw.githubusercontent.com/Foshowithit/pi-chow-starter/main/install.sh | bash

# Add to shell config
export PATH="$HOME/.pi/agent/bin:$PATH"
export CHOW_CLI_MODEL="opencode-go/deepseek-v4-pro"
export CHOW_WORKER_MODEL="opencode-go/deepseek-v4-flash"

# Start a session
chow
```

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design.

```
Manager (DS V4 Pro) ──delegates──→ Subagent (DS V4 Flash)
       │                                    │
       │ routes by task                     │ bounded execution
       ▼                                    ▼
  Model Router                         File Artifacts
```

## Project Status

Active development. Core architecture is stable and used daily in production. See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

MIT
