# Chow CLI System Prompt

This file is intentionally no longer the source of truth.

`~/.pi/agent/bin/chow` now builds Chow's system prompt dynamically from the local Chow memory mirror:

- Memory root: `~/carl-bot/memory`
- Default Chow lane: `-1003665370879`
- Prompt builder: `~/.pi/agent/chow/build-prompt.mjs`
- Generated prompt cache: `~/.pi/agent/chow/SYSTEM.generated.md`
- Session dir: `~/.pi/agent/sessions/chow-terminal`

Commands:

```bash
chow                    # start Chow in Pi TUI
chow -c                 # continue latest session
chow -r                 # resume picker
chow -p "message"       # one-shot
chow --chow-where       # show config
chow --chow-prompt-file # rebuild generated prompt cache
```
