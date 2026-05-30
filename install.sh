#!/usr/bin/env bash
# ================================================================
# Pi Chow Starter — Installer
# ================================================================
# Copies the template setup into your ~/.pi/agent/, patches config,
# creates memory stubs, and prints shell config.
#
# Usage:
#   curl -sfL https://raw.githubusercontent.com/Foshowithit/pi-chow-starter/main/install.sh | bash
#   bash install.sh          # from cloned repo
#   bash install.sh --force  # overwrite existing files
# ================================================================

set -euo pipefail

RED='\033[0;31m'
GOLD='\033[0;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GOLD}"
echo '  ╔══════════════════════════════════════════════╗'
echo '  ║     PI CHOW STARTER — INSTALLER v1.0         ║'
echo '  ║     "TURN PI INTO AN AI IDENTITY"            ║'
echo '  ╚══════════════════════════════════════════════╝'
echo -e "${NC}"

# ---- Determine source directory ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"

# If running via curl-pipe, no SCRIPT_DIR — check for template dir
if [ ! -d "$REPO_ROOT/template" ]; then
    # Might be running from temp dir after curl
    TMP_DIR=$(mktemp -d)
    echo -e "${CYAN}📦 Downloading pi-chow-starter...${NC}"
    if command -v git &>/dev/null; then
        git clone --depth=1 https://github.com/Foshowithit/pi-chow-starter.git "$TMP_DIR/repo" 2>/dev/null || {
            echo -e "${RED}❌ git clone failed. Try: apt install git or manually download from GitHub${NC}"
            exit 1
        }
        REPO_ROOT="$TMP_DIR/repo"
    else
        # Fallback: curl the tarball
        curl -sfL "https://github.com/Foshowithit/pi-chow-starter/archive/refs/heads/main.tar.gz" -o "$TMP_DIR/repo.tar.gz"
        tar xzf "$TMP_DIR/repo.tar.gz" -C "$TMP_DIR"
        REPO_ROOT="$TMP_DIR/pi-chow-starter-main"
    fi
fi

PI_AGENT_DIR="${HOME}/.pi/agent"
MEMORY_ROOT="${HOME}/carl-bot/memory"
CHAT_ID="${CHOW_CHAT_ID:--1003665370879}"
MEMORY_DIR="${MEMORY_ROOT}/${CHAT_ID}"

FORCE="${1:-}"
if [ "$FORCE" == "--force" ]; then
    FORCE=true
else
    FORCE=false
fi

# ---- Safety checks ----
echo -e "${CYAN}🔍 Checking prerequisites...${NC}"

if [ ! -d "$PI_AGENT_DIR" ]; then
    echo -e "${RED}❌ ~/.pi/agent/ not found!${NC}"
    echo "   This installer requires pi to be installed first."
    echo "   Install pi from: https://github.com/nicepkg/pi"
    echo ""
    echo "   Quick install:"
    echo "   curl -fsSL https://pi.pkg.dev/install | bash"
    exit 1
fi

if [ ! -f "$PI_AGENT_DIR/settings.json" ]; then
    echo -e "${YELLOW}⚠️  No settings.json found — will create one${NC}"
fi

# ---- Backup existing settings ----
if [ -f "$PI_AGENT_DIR/settings.json" ]; then
    BACKUP="${PI_AGENT_DIR}/settings.json.chow-bak-$(date +%Y%m%d-%H%M%S)"
    cp "$PI_AGENT_DIR/settings.json" "$BACKUP"
    echo -e "${GREEN}✅ Backed up settings.json → ${BACKUP}${NC}"
fi

# ---- Create directories ----
echo -e "${CYAN}📁 Creating directories...${NC}"
mkdir -p "$PI_AGENT_DIR/bin"
mkdir -p "$PI_AGENT_DIR/chow"
mkdir -p "$PI_AGENT_DIR/agents"
mkdir -p "$PI_AGENT_DIR/skills"
mkdir -p "$PI_AGENT_DIR/extensions"
mkdir -p "$PI_AGENT_DIR/prompts"
mkdir -p "$MEMORY_DIR/second-brain/consolidated"
mkdir -p "$MEMORY_DIR/second-brain/daily"

# ---- Helper: copy with optional overwrite ----
copy_template() {
    local src="$REPO_ROOT/template/$1"
    local dst="$2"
    local label="${3:-$1}"

    if [ -e "$dst" ] && [ "$FORCE" != "true" ]; then
        echo -e "  ⏭️  ${label} exists (use --force to overwrite)"
    else
        mkdir -p "$(dirname "$dst")"
        cp -r "$src" "$dst" 2>/dev/null && echo -e "  ${GREEN}✅${NC} ${label}" || echo -e "  ${YELLOW}⚠️  ${label} not found, skipping${NC}"
    fi
}

# ---- Copy template files ----
echo -e "${CYAN}📦 Installing template files...${NC}"

# Binaries
copy_template "bin/chow" "$PI_AGENT_DIR/bin/chow" "bin/chow"
copy_template "bin/chow-worker" "$PI_AGENT_DIR/bin/chow-worker" "bin/chow-worker"

# Chow prompt builder
copy_template "chow/build-prompt.mjs" "$PI_AGENT_DIR/chow/build-prompt.mjs" "chow/build-prompt.mjs"
copy_template "chow/SYSTEM.md" "$PI_AGENT_DIR/chow/SYSTEM.md" "chow/SYSTEM.md"

# Agents
for agent_file in "$REPO_ROOT/template/agents/"*.md; do
    [ -f "$agent_file" ] || continue
    name="$(basename "$agent_file")"
    if [ -f "$PI_AGENT_DIR/agents/$name" ] && [ "$FORCE" != "true" ]; then
        echo -e "  ⏭️  agents/$name exists"
    else
        cp "$agent_file" "$PI_AGENT_DIR/agents/$name"
        echo -e "  ${GREEN}✅${NC} agents/$name"
    fi
done
for agent_file in "$REPO_ROOT/template/agents/"*.yaml; do
    [ -f "$agent_file" ] || continue
    name="$(basename "$agent_file")"
    if [ -f "$PI_AGENT_DIR/agents/$name" ] && [ "$FORCE" != "true" ]; then
        echo -e "  ⏭️  agents/$name exists"
    else
        cp "$agent_file" "$PI_AGENT_DIR/agents/$name"
        echo -e "  ${GREEN}✅${NC} agents/$name"
    fi
done

# Skills
for skill_dir in "$REPO_ROOT/template/skills/"*/; do
    [ -d "$skill_dir" ] || continue
    name="$(basename "$skill_dir")"
    if [ -d "$PI_AGENT_DIR/skills/$name" ] && [ "$FORCE" != "true" ]; then
        echo -e "  ⏭️  skills/$name exists"
    else
        cp -r "$skill_dir" "$PI_AGENT_DIR/skills/$name"
        echo -e "  ${GREEN}✅${NC} skills/$name"
    fi
done

# Extensions
for ext_dir in "$REPO_ROOT/template/extensions/"*/; do
    [ -d "$ext_dir" ] || continue
    name="$(basename "$ext_dir")"
    if [ -d "$PI_AGENT_DIR/extensions/$name" ] && [ "$FORCE" != "true" ]; then
        echo -e "  ⏭️  extensions/$name exists"
    else
        cp -r "$ext_dir" "$PI_AGENT_DIR/extensions/$name"
        echo -e "  ${GREEN}✅${NC} extensions/$name"
    fi
done

# Prompt templates
for prompt_file in "$REPO_ROOT/template/prompts/"*.md; do
    [ -f "$prompt_file" ] || continue
    name="$(basename "$prompt_file")"
    if [ -f "$PI_AGENT_DIR/prompts/$name" ] && [ "$FORCE" != "true" ]; then
        echo -e "  ⏭️  prompts/$name exists"
    else
        cp "$prompt_file" "$PI_AGENT_DIR/prompts/$name"
        echo -e "  ${GREEN}✅${NC} prompts/$name"
    fi
done

# ---- Memory stub ----
echo -e "${CYAN}🧠 Setting up memory directory...${NC}"
TEMPLATE_IDENTITY="$REPO_ROOT/template/memory/TEMPLATES/TEMPLATE_identity.md"
if [ ! -f "$MEMORY_DIR/identity.md" ] || [ "$FORCE" == "true" ]; then
    if [ -f "$TEMPLATE_IDENTITY" ]; then
        cp "$TEMPLATE_IDENTITY" "$MEMORY_DIR/identity.md"
        echo -e "  ${GREEN}✅${NC} memory/identity.md (template)"
    fi
fi
for f in active-task.md continuity-capsule.md playbook.md summaries.md; do
    if [ ! -f "$MEMORY_DIR/$f" ]; then
        echo "# $f" > "$MEMORY_DIR/$f"
        echo "" >> "$MEMORY_DIR/$f"
        echo "Edit this file to set up your $f" >> "$MEMORY_DIR/$f"
        echo -e "  ${GREEN}✅${NC} memory/$f (stub)"
    fi
done

# ---- Patch settings.json ----
echo -e "${CYAN}⚙️  Patching settings.json...${NC}"

# Read current settings
SETTINGS="$PI_AGENT_DIR/settings.json"

# We use node to safely modify JSON
if command -v node &>/dev/null; then
    node -e "
    const fs = require('fs');
    const path = require('path');

    const settingsPath = '$SETTINGS';
    let cfg = {};
    try { cfg = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch(e) {}

    // Default provider and model
    cfg.defaultProvider = cfg.defaultProvider || 'ollama';
    cfg.defaultModel = cfg.defaultModel || 'ollama/deepseek-v4-flash:cloud';
    cfg.defaultThinkingLevel = cfg.defaultThinkingLevel || 'high';

    // Providers
    cfg.providers = cfg.providers || {};
    if (!cfg.providers.ollama) cfg.providers.ollama = {};
    if (!cfg.providers['opencode-go']) cfg.providers['opencode-go'] = {};

    // Packages (merge, deduplicate)
    const NEW_PACKAGES = [
        'npm:pi-subagents',
        'npm:pi-web-access',
        'npm:pi-interactive-shell',
        'npm:pi-intercom',
        'npm:pi-messenger',
        'npm:pi-boomerang',
        'npm:pi-review-loop',
        'npm:pi-model-switch',
        'npm:pi-powerline-footer',
        'npm:pi-annotate',
        'npm:pi-tool-display',
        'npm:pi-hashline-edit',
        'npm:pi-qmd',
        'npm:pi-context-prune',
        'npm:pi-goal',
        'npm:pi-mermaid',
        'npm:pi-gitnexus',
        'npm:pi-lsp-extension',
        'npm:pi-session-merge',
        'npm:pi-zerg-swarm',
        'npm:pi-stock-ticker',
        'npm:pi-model-router',
        'npm:pi-custom-compaction',
        'npm:pi-rtk-optimizer',
        'npm:visual-explainer',
    ];

    cfg.packages = cfg.packages || [];
    for (const pkg of NEW_PACKAGES) {
        if (!cfg.packages.includes(pkg)) {
            cfg.packages.push(pkg);
        }
    }

    // Compaction
    cfg.compaction = cfg.compaction || {
        enabled: true,
        reserveTokens: 16384,
        keepRecentTokens: 25000
    };

    // Enabled models
    cfg.enabledModels = cfg.enabledModels || [
        'opencode-go/mimo-v2-pro',
        'ollama/minimax-m2.7:cloud',
        'ollama/gemini-3-flash-preview:cloud',
        'ollama/kimi-k2.6:cloud',
        'ollama/deepseek-v4-flash:cloud',
        'ollama/deepseek-v4-pro:cloud',
        'ollama/glm-5.1:cloud'
    ];

    fs.writeFileSync(settingsPath, JSON.stringify(cfg, null, 2) + '\n');
    console.log('  ✅ settings.json patched');
    "
else
    echo -e "${YELLOW}⚠️  node not found — cannot patch settings.json automatically${NC}"
    echo "   See pi-config/ for manual settings to add"
fi

# ---- Copy compaction and model router if they don't exist ----
if [ ! -f "$PI_AGENT_DIR/compaction-policy.json" ] || [ "$FORCE" == "true" ]; then
    if [ -f "$REPO_ROOT/pi-config/compaction-policy.json" ]; then
        cp "$REPO_ROOT/pi-config/compaction-policy.json" "$PI_AGENT_DIR/compaction-policy.json"
        echo -e "  ${GREEN}✅${NC} compaction-policy.json"
    fi
fi
if [ ! -f "$PI_AGENT_DIR/model-router.json" ] || [ "$FORCE" == "true" ]; then
    if [ -f "$REPO_ROOT/pi-config/model-router.json" ]; then
        cp "$REPO_ROOT/pi-config/model-router.json" "$PI_AGENT_DIR/model-router.json"
        echo -e "  ${GREEN}✅${NC} model-router.json"
    fi
fi

# ---- Auth guide ----
if [ ! -f "$PI_AGENT_DIR/auth.json" ]; then
    echo ""
    echo -e "${GOLD}🔑 API Key Setup${NC}"
    echo "   No auth.json found. You need at least one provider."
    echo ""
    echo "   Quick setup for Ollama Cloud (free tier):"
    echo "     1. Go to https://cloud.ollama.com/ → get API key"
    echo "     2. Create ~/.pi/agent/auth.json:"
    echo ""
    echo '      {'
    echo '        "ollama": {'
    echo '          "type": "api_key",'
    echo '          "key": "your-ollama-cloud-key"'
    echo '        }'
    echo '      }'
    echo ""
    echo "   Or copy the example:"
    echo "   cp $REPO_ROOT/template/auth/auth.json.example $PI_AGENT_DIR/auth.json"
    echo "   (then edit with your keys)"
fi

# ---- Make binaries executable ----
chmod +x "$PI_AGENT_DIR/bin/chow" "$PI_AGENT_DIR/bin/chow-worker" 2>/dev/null || true

# ---- Shell config guide ----
echo ""
echo -e "${GOLD}🔧 Shell Configuration${NC}"
echo "   Add these to your ~/.zshrc or ~/.bashrc:"
echo ""
echo -e "${CYAN}   # ----- Pi Chow Starter -----${NC}"
echo "   export PATH=\"\$HOME/.pi/agent/bin:\$PATH\""
echo "   export CHOW_CLI_MODEL=\"ollama/deepseek-v4-pro:cloud\""
echo "   export CHOW_WORKER_MODEL=\"ollama/deepseek-v4-flash:cloud\""
echo "   export CHOW_CLI_THINKING=\"low\""
echo ""

# ---- Summary ----
echo ""
echo -e "${GOLD}══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo "   What was installed:"
 echo "   📁 ~/.pi/agent/bin/        — chow wrapper + worker"
 echo "   📁 ~/.pi/agent/chow/       — Prompt builder + system prompt"
 echo "   📁 ~/.pi/agent/agents/     — Specialist agent definitions"
 echo "   📁 ~/.pi/agent/skills/     — Custom skill modules"
 echo "   📁 ~/.pi/agent/extensions/ — Max Effort + others"
 echo "   📁 ~/.pi/agent/prompts/    — Prompt templates"
 echo "   📁 ~/$MEMORY_DIR/          — Memory stub (edit identity.md)"
 echo "   ⚙️  settings.json         — Patched with packages"
 echo ""
 echo "   Next steps:"
 echo "   1. Add the shell config above to ~/.zshrc"
 echo "   2. Edit ~/$MEMORY_DIR/identity.md with YOUR info"
 echo "   3. Set up API keys in ~/.pi/agent/auth.json"
 echo "   4. Reload shell: source ~/.zshrc"
 echo "   5. Run: chow"
 echo ""
 echo -e "${GOLD}   \"I AM THE FUCKIN MR CHOW — NOW YOU TOO\"${NC}"
 echo -e "${GOLD}══════════════════════════════════════════════${NC}"

# Clean up temp dir if we created one
if [ -n "${TMP_DIR:-}" ] && [ -d "$TMP_DIR" ]; then
    rm -rf "$TMP_DIR"
fi
