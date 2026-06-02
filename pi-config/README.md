# Pi Config Files

This directory contains configuration for the Pi agent CLI. These files live at
`~/.pi/agent/` at runtime and are versioned here as templates/starters.

## Files

### `settings.json`

The main Pi agent settings file. Controls:

- **`defaultProvider`** / **`defaultModel`** / **`defaultThinkingLevel`** — Default model routing
- **`providers`** — Registered provider names (actual API keys are in `auth.json`, not here)
- **`enabledModels`** — List of model identifiers available for use
- **`packages`** — Installed Pi packages/extensions (npm packages and local paths)
- **`compaction`** — Session compaction settings (reserve tokens, keep recent)
- **`terminal`** — Terminal UI preferences
- **`theme`** — UI theme ("light" or "dark")

> **Note**: API keys are stored in `auth.json` and excluded from this repository.
> Provider objects in settings.json are empty stubs (`{}`) — keys are loaded from auth at runtime.

### `model-router.json`

Advanced model routing configuration. Controls:

- **`defaultProfile`** — Which profile to use by default (e.g., "balanced", "fast", "thorough")
- **`profiles`** — Named profiles each with high/medium/low tiers and fallback models
- **`routerModel`** — The model used for routing decisions
- **`routerThinking`** — Thinking level for the router
- **`zenPool`** — Provider pool and model list for OpenCode Zen load-balancing
- **`debug`** — Enable debug logging

Each profile defines:
- **high/medium/low** — Model + thinking level for each complexity tier
- **fallbackModels** — Ordered list of models to try if the primary is unavailable

### `compaction-policy.json`

Controls session context compaction behavior:

- **`trigger.maxTokens`** / **`minTokens`** — Token thresholds that trigger compaction
- **`cooldownMs`** — Minimum time between compactions
- **`summaryRetention`** — How much summarized history to retain
- **`models`** — Models used for generating compaction summaries

## Security

- **`auth.json`** (NOT versioned) — Contains API keys for all providers
- **`models.json`** (NOT versioned) — Contains model metadata including API key references
- **`sessions/`** (NOT versioned) — Live session state

These excluded files are documented in `.gitignore` and must be created locally.
Copy `template/auth/auth.json.example` to `~/.pi/agent/auth.json` and populate with your keys.
