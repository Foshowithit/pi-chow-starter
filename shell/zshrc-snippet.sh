# ----- Pi Chow Starter -----
# Add to ~/.zshrc or ~/.bashrc

# Add chow CLI to PATH
export PATH="$HOME/.pi/agent/bin:$PATH"

# Default model for main Chow sessions (use pro for thinking, flash for speed)
export CHOW_CLI_MODEL="ollama/deepseek-v4-pro:cloud"

# Worker model for chow-worker delegation (use flash for speed/cost)
export CHOW_WORKER_MODEL="ollama/deepseek-v4-flash:cloud"

# Default thinking level (high, low, off)
export CHOW_CLI_THINKING="low"

# Pi auth lives in ~/.pi/agent/auth.json — do not hard-code API keys here.
