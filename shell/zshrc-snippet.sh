# Pi Chow shell config — add to ~/.zshrc or ~/.bashrc
export PATH="$HOME/.pi/agent/bin:$PATH"

# Model configuration
export CHOW_CLI_MODEL="opencode-go/deepseek-v4-pro"
export CHOW_WORKER_MODEL="opencode-go/deepseek-v4-flash"
export CHOW_CLI_THINKING="low"

# Lane: chow, hector, or terminal-chow
# export CHOW_LANE="chow"

# API keys are stored in ~/.pi/agent/auth.json — never in shell configs
