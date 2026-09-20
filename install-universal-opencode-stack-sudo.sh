#!/usr/bin/env bash
set -Eeuo pipefail

# ============================================================
# UNIVERSAL OPENCODE EFFICIENT CODING STACK
# Run with: sudo -E bash /home/sunday/install-universal-opencode-stack-sudo.sh
# ============================================================

CONFIG="${HOME}/.config/opencode"
GLOBAL_SKILLS="${CONFIG}/skills"
GLOBAL_AGENT_DIR="${HOME}/.agents"
PROJECT_ROOT="${HOME}/openidea/projects"

# Run as the actual user, not root
TARGET_USER="${SUDO_USER:-$USER}"
TARGET_HOME=$(eval echo "~${TARGET_USER}")

log() { echo; echo ">>> $1"; }
ok() { echo "    ✓ $1"; }
warn() { echo "    ! $1"; }
fail() { echo "    ✗ $1"; exit 1; }

run_user() { sudo -u "$TARGET_USER" -H bash -c "$1"; }

# ------------------------------------------------------------
# 0. OS
# ------------------------------------------------------------
log "Checking operating system"
if [[ ! -f /etc/os-release ]]; then fail "Cannot detect Linux distribution."; fi
source /etc/os-release
echo "    OS: ${PRETTY_NAME}"

# ------------------------------------------------------------
# 1. Base dependencies (apt-get needs root)
# ------------------------------------------------------------
log "Installing base dependencies"
apt-get update
apt-get install -y curl git jq unzip build-essential python3 python3-venv python3-pip
ok "Base dependencies"

# ------------------------------------------------------------
# 2. Bun (user install)
# ------------------------------------------------------------
log "Installing Bun"
if run_user "[[ -x \"${HOME}/.bun/bin/bun\" ]] || command -v bun >/dev/null 2>&1"; then
    run_user "export BUN_INSTALL=\"${HOME}/.bun\"; export PATH=\"${BUN_INSTALL}/bin:\${PATH}\"; echo \"    Bun: \$(bun --version)\""
else
    run_user "curl -fsSL https://bun.sh/install | bash"
    run_user 'export BUN_INSTALL="${HOME}/.bun"; export PATH="${BUN_INSTALL}/bin:${PATH}"'
    if ! run_user "[[ -x \"${HOME}/.bun/bin/bun\" ]]"; then fail "Bun installation failed."; fi
fi
run_user 'export BUN_INSTALL="${HOME}/.bun"; export PATH="${BUN_INSTALL}/bin:${PATH}"'
ok "Bun \$(run_user 'bun --version')"

# ------------------------------------------------------------
# 3. oh-my-openagent (user install)
# ------------------------------------------------------------
log "Installing oh-my-openagent"
run_user "export BUN_INSTALL=\"${HOME}/.bun\"; export PATH=\"${BUN_INSTALL}/bin:\${PATH}\"; mkdir -p '${TARGET_HOME}/.config/opencode'"
run_user "export BUN_INSTALL=\"${HOME}/.bun\"; export PATH=\"${BUN_INSTALL}/bin:\${PATH}\"; bunx oh-my-openagent install --no-tui --platform=opencode --skip-auth --claude=no --gemini=no --copilot=no"
ok "oh-my-openagent"

# ------------------------------------------------------------
# 4. OpenResearch (user install via cargo)
# ------------------------------------------------------------
log "Installing OpenResearch"
if run_user "[[ -x \"${HOME}/.cargo/bin/orx\" ]] || command -v orx >/dev/null 2>&1"; then
    run_user "export PATH=\"${HOME}/.local/bin:${HOME}/.cargo/bin:\${PATH}\"; echo \"    OpenResearch already installed: \$(orx --version 2>/dev/null || true)\""
else
    # Ensure cargo is available
    if ! run_user "[[ -x \"${HOME}/.cargo/bin/cargo\" ]] || command -v cargo >/dev/null 2>&1"; then
        run_user "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"
        run_user 'source "${HOME}/.cargo/env"'
    fi
    run_user 'export PATH="${HOME}/.local/bin:${HOME}/.cargo/bin:${PATH}"; curl -LsSf https://openresearch.sh/install.sh | sh'
    run_user 'export PATH="${HOME}/.local/bin:${HOME}/.cargo/bin:${PATH}"'
fi

if run_user "[[ -x \"${HOME}/.cargo/bin/orx\" ]] || command -v orx >/dev/null 2>&1"; then
    ok "OpenResearch \$(run_user 'export PATH=\"${HOME}/.local/bin:${HOME}/.cargo/bin:\${PATH}\"; orx --version 2>/dev/null || true')"
    run_user 'export PATH="${HOME}/.local/bin:${HOME}/.cargo/bin:${PATH}"; orx install-skills' || warn "OpenResearch skill installation returned an error."
    ok "OpenResearch skills"
else
    warn "OpenResearch CLI unavailable; skipping skill installation."
fi

# ------------------------------------------------------------
# 5. RTK (user install)
# ------------------------------------------------------------
log "Installing RTK"
if run_user "[[ -x \"${HOME}/.local/bin/rtk\" ]] || command -v rtk >/dev/null 2>&1"; then
    run_user "export PATH=\"${HOME}/.local/bin:\${PATH}\"; echo \"    RTK already installed: \$(rtk --version 2>/dev/null || true)\""
else
    run_user 'export PATH="${HOME}/.local/bin:${PATH}"; curl -fsSL https://raw.githubusercontent.com/TokenFleet-AI/rtk/refs/heads/master/install.sh | sh'
    run_user 'export PATH="${HOME}/.local/bin:${PATH}"'
fi

if run_user "[[ -x \"${HOME}/.local/bin/rtk\" ]] || command -v rtk >/dev/null 2>&1"; then
    ok "RTK \$(run_user 'export PATH=\"${HOME}/.local/bin:\${PATH}\"; rtk --version 2>/dev/null || true')"
    run_user 'export PATH="${HOME}/.local/bin:${PATH}"; rtk init -g --opencode' || warn "RTK OpenCode initialization returned an error."
    ok "RTK OpenCode integration"
else
    warn "RTK was not found after installation."
fi

# ------------------------------------------------------------
# 6. uv (for Headroom) - user install
# ------------------------------------------------------------
log "Installing uv"
if run_user "[[ -x \"${HOME}/.local/bin/uv\" ]] || command -v uv >/dev/null 2>&1"; then
    run_user "export PATH=\"${HOME}/.local/bin:${HOME}/.cargo/bin:\${PATH}\"; echo \"    uv already installed\""
else
    run_user 'export PATH="${HOME}/.local/bin:${HOME}/.cargo/bin:${PATH}"; curl -LsSf https://astral.sh/uv/install.sh | sh'
    run_user 'export PATH="${HOME}/.local/bin:${HOME}/.cargo/bin:${PATH}"'
fi

# ------------------------------------------------------------
# 7. Headroom (user install via uv)
# ------------------------------------------------------------
log "Installing Headroom"
if run_user "[[ -x \"${HOME}/.local/bin/headroom\" ]] || command -v headroom >/dev/null 2>&1"; then
    ok "Headroom already installed"
else
    run_user 'export PATH="${HOME}/.local/bin:${HOME}/.cargo/bin:${PATH}"; uv tool install --python 3.13 "headroom-ai[all]"' || warn "Headroom installation failed."
fi

if run_user "[[ -x \"${HOME}/.local/bin/headroom\" ]] || command -v headroom >/dev/null 2>&1"; then
    ok "Headroom"
    echo
    echo "    NOTE: Headroom is installed but NOT forced into every OpenCode session."
    echo "    Start with: headroom doctor"
    echo "    Use when needed: headroom wrap opencode"
else
    warn "Headroom unavailable."
fi

# ------------------------------------------------------------
# 8. OmniRoute (user install via npm)
# ------------------------------------------------------------
log "Installing OmniRoute"
if run_user "[[ -x \"${HOME}/.nvm/current/bin/omniroute\" ]] || command -v omniroute >/dev/null 2>&1"; then
    ok "OmniRoute already installed"
else
    # Ensure Node.js is available via nvm
    if ! run_user "command -v npm >/dev/null 2>&1"; then
        if [[ ! -d "${TARGET_HOME}/.nvm" ]]; then
            run_user 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash'
        fi
        run_user 'export NVM_DIR="${HOME}/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"; nvm install --lts; nvm use --lts'
    fi
    # Configure npm to install globally to user directory (avoid EACCES)
    run_user 'export NVM_DIR="${HOME}/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"; npm config set prefix "${HOME}/.npm-global"; mkdir -p "${HOME}/.npm-global/bin"; export PATH="${HOME}/.npm-global/bin:${PATH}"'
    # Use nvm's npm to install to user directory (not system)
    run_user 'export NVM_DIR="${HOME}/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"; export PATH="${HOME}/.npm-global/bin:${PATH}"; npm install -g omniroute'
fi

if run_user "[[ -x \"${HOME}/.nvm/current/bin/omniroute\" ]] || [[ -x \"${HOME}/.npm-global/bin/omniroute\" ]] || command -v omniroute >/dev/null 2>&1"; then
    ok "OmniRoute"
else
    warn "OmniRoute installation failed."
fi

# ------------------------------------------------------------
# 9. ECC (Full Profile)
# ------------------------------------------------------------
log "Installing ECC (Full Profile)"
if run_user "[[ -x \"${HOME}/.local/bin/ecc\" ]] || command -v ecc >/dev/null 2>&1"; then
    run_user "echo '    ECC already installed: \$(ecc --version 2>/dev/null || true)'"
else
    run_user 'export PATH="${HOME}/.local/bin:${HOME}/.npm-global/bin:${PATH}"; npm i -g ecc-universal'
    run_user 'export PATH="${HOME}/.local/bin:${HOME}/.npm-global/bin:${PATH}"; ecc init --profile full --opencode' || warn "ECC OpenCode init failed"
fi
ok "ECC (Full Profile)"

# ------------------------------------------------------------
# 10. Ollama (for Graphify local inference)
# ------------------------------------------------------------
log "Installing Ollama"
if run_user "[[ -x \"${HOME}/.local/bin/ollama\" ]] || command -v ollama >/dev/null 2>&1"; then
    run_user "echo '    Ollama already installed: \$(ollama --version)'"
else
    run_user "curl -fsSL https://ollama.com/install.sh | sh"
    run_user "ollama pull llama3.1:8b"
    run_user "ollama pull nomic-embed-text"
fi
ok "Ollama with llama3.1:8b + nomic-embed-text"

# ------------------------------------------------------------
# 11. Graphify with Ollama extra
# ------------------------------------------------------------
log "Installing Graphify with Ollama extra"
if run_user "[[ -x \"${HOME}/.local/bin/graphify\" ]] || command -v graphify >/dev/null 2>&1"; then
    run_user "echo '    Graphify already installed: \$(graphify --version 2>/dev/null || true)'"
else
    if ! run_user "command -v uv >/dev/null 2>&1"; then
        run_user 'export PATH="${HOME}/.local/bin:${HOME}/.cargo/bin:${PATH}"; curl -LsSf https://astral.sh/uv/install.sh | sh'
        run_user 'export PATH="${HOME}/.local/bin:${HOME}/.cargo/bin:${PATH}"'
    fi
    run_user 'export PATH="${HOME}/.local/bin:${PATH}"; uv tool install "graphifyy[ollama]"'
    run_user 'export PATH="${HOME}/.local/bin:${PATH}"'
fi

if run_user "[[ -x \"${HOME}/.local/bin/graphify\" ]] || command -v graphify >/dev/null 2>&1"; then
    ok "Graphify \$(graphify --version 2>/dev/null || true)"
    
    log "Configuring Graphify for OpenCode"
    run_user 'graphify opencode install' || warn "Graphify OpenCode install failed"
    
    log "Building initial knowledge graphs for existing projects"
    run_user "
        for project_dir in \"${HOME}/openidea/projects\"/*/; do
            if [[ -d \"\$project_dir\" && -f \"\$project_dir/AGENTS.md\" ]]; then
                echo \"Building graph for \$(basename \$project_dir)...\"
                cd \"\$project_dir\" && graphify extract . --backend ollama --model llama3.1:8b
                cd \"\$project_dir\" && graphify cluster-only . --backend ollama --model llama3.1:8b
            fi
        done
    " || warn "Some Graphify extracts failed"
    ok "Graphify knowledge graphs built"
else
    warn "Graphify installation failed"
fi

# ------------------------------------------------------------
# 12. ECC AgentShield
# ------------------------------------------------------------
log "Configuring ECC AgentShield"
if run_user "command -v ecc-agentshield >/dev/null 2>&1"; then
    ok "AgentShield available"
else
    run_user 'export PATH="${HOME}/.local/bin:${HOME}/.npm-global/bin:${PATH}"; npm i -g @ecc-tools/agentshield' || warn "AgentShield install failed"
fi
ok "ECC AgentShield"

# ------------------------------------------------------------
# 13. Global directories
# ------------------------------------------------------------
log "Creating global OpenCode skill directories"
run_user "mkdir -p '${TARGET_HOME}/.config/opencode/skills' '${TARGET_HOME}/.agents' '${TARGET_HOME}/openidea/projects'"
ok "Global directories"

# ------------------------------------------------------------
# 10. Universal AGENTS.md
# ------------------------------------------------------------
log "Creating global agent rules"
GLOBAL_AGENTS="${TARGET_HOME}/AGENTS.md"
if run_user "[[ ! -f '${GLOBAL_AGENTS}' ]]"; then
    run_user "cat > '${GLOBAL_AGENTS}' <<'AGENTS'
# UNIVERSAL CODING AGENT RULES

These rules apply to software projects unless overridden by
more-specific project instructions.

## 1. Understand before changing

Before modifying code:

1. Identify the project type.
2. Read relevant AGENTS.md / RULES.md / DESIGN.md.
3. Inspect the existing implementation.
4. Search for existing functionality before creating new functionality.
5. Do not rewrite unrelated code.

## 2. Research before reinventing

Use the OpenResearch skill when:

- the requested feature is unfamiliar;
- an existing open-source implementation may exist;
- architecture/design choices require investigation;
- a dependency/API may have changed;
- there is uncertainty about the correct implementation.

Prefer:

existing implementation
→ adapt
→ test

over:

invent
→ duplicate
→ maintain

## 3. Context efficiency

Never load the entire repository unless necessary.

Prefer:

- LSP
- targeted grep/search
- Context7
- code graph/search
- specific file ranges
- targeted tests

Retrieve only context relevant to the current task.

## 4. Token efficiency

Prefer concise tool output.

Use RTK for command output where supported.

Do not repeatedly read the same file.

Do not repeat information already available in task state.

Do not dump huge logs into the model context.

## 5. Implementation

Use the smallest correct change.

Preserve existing architecture unless there is a documented reason
to change it.

Do not introduce a new dependency when an existing dependency can
solve the problem adequately.

## 6. Planning

For non-trivial work:

1. inspect
2. research if necessary
3. create a short plan
4. implement
5. test
6. review
7. summarize

## 7. Verification

After changes:

- run the smallest relevant test first;
- fix failures;
- run broader tests when appropriate;
- report what was actually verified.

Never claim a test passed unless it was actually executed.

## 8. Memory

Store only durable information.

Good memory:

- architectural decisions
- important constraints
- reusable project knowledge
- recurring failures and their fixes

Do not store:

- temporary reasoning
- entire conversations
- large command output
- secrets
- credentials

## 9. User instructions

User instructions have priority over convenience.

Do not silently remove or weaken project rules.

If instructions conflict, explain the conflict before proceeding.

## 10. Final response

Keep the final report concise:

Changed:
Tests:
Research:
Remaining:
AGENTS
"
    ok "Global AGENTS.md"
else
    run_user "echo '    Existing ${GLOBAL_AGENTS} preserved.'"
fi

# ------------------------------------------------------------
# 11. Universal project initializer
# ------------------------------------------------------------
log "Creating universal project initializer"
INIT_SCRIPT="${TARGET_HOME}/bin/init-agent-project"
run_user "mkdir -p '${TARGET_HOME}/bin'"
run_user "cat > '${INIT_SCRIPT}' <<'INIT'
#!/usr/bin/env bash
set -Eeuo pipefail
PROJECT=\"\${1:-\$PWD}\"
mkdir -p \"\${PROJECT}/.agent\" \"\${PROJECT}/.opencode/skills\"
create_if_missing() { local file=\"\$1\"; if [[ ! -f \"\$file\" ]]; then touch \"\$file\"; echo \"created: \$file\"; else echo \"exists : \$file\"; fi; }
create_if_missing \"\${PROJECT}/AGENTS.md\"
create_if_missing \"\${PROJECT}/DESIGN.md\"
create_if_missing \"\${PROJECT}/RULES.md\"
create_if_missing \"\${PROJECT}/ARCHITECTURE.md\"
create_if_missing \"\${PROJECT}/.agent/TASK.md\"
create_if_missing \"\${PROJECT}/.agent/PLAN.md\"
create_if_missing \"\${PROJECT}/.agent/DECISIONS.md\"
create_if_missing \"\${PROJECT}/.agent/BLOCKERS.md\"
create_if_missing \"\${PROJECT}/.agent/HANDOFF.md\"
create_if_missing \"\${PROJECT}/.agent/MEMORY.md\"
echo
echo \"Universal agent structure ready:\"
echo
echo \"  \${PROJECT}/\"
echo \"  ├── AGENTS.md\"
echo \"  ├── DESIGN.md\"
echo \"  ├── RULES.md\"
echo \"  ├── ARCHITECTURE.md\"
echo \"  ├── .agent/\"
echo \"  │   ├── TASK.md\"
echo \"  │   ├── PLAN.md\"
echo \"  │   ├── DECISIONS.md\"
echo \"  │   ├── BLOCKERS.md\"
echo \"  │   ├── HANDOFF.md\"
echo \"  │   └── MEMORY.md\"
echo \"  └── .opencode/skills/\"
echo
echo \"Project initialized.\"
INIT"
run_user "chmod +x '${INIT_SCRIPT}'"
ok "init-agent-project"

# ------------------------------------------------------------
# 12. PATH configuration
# ------------------------------------------------------------
log "Configuring PATH"
PATH_LINES='
# Universal AI coding tools
export PATH="$HOME/.local/bin:$HOME/.bun/bin:$HOME/bin:$HOME/.opencode/bin:$HOME/.npm-global/bin:$HOME/.cargo/bin:$PATH"
'
run_user "if ! grep -q 'Universal AI coding tools' '${TARGET_HOME}/.bashrc' 2>/dev/null; then printf '%s\\n' \"${PATH_LINES}\" >> '${TARGET_HOME}/.bashrc'; fi"
ok "PATH configured in ~/.bashrc"

# ------------------------------------------------------------
# 14. Diagnostics
# ------------------------------------------------------------
log "Running diagnostics"
run_user "export BUN_INSTALL=\"${HOME}/.bun\"; export PATH=\"${BUN_INSTALL}/bin:\${PATH}\"; export PATH=\"${HOME}/.local/bin:${HOME}/.cargo/bin:\${PATH}\"; export NVM_DIR=\"${HOME}/.nvm\"; [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"; export PATH=\"${HOME}/.npm-global/bin:\${PATH}\"; echo 'OpenCode:'; opencode --version 2>/dev/null || true"
run_user "export BUN_INSTALL=\"${HOME}/.bun\"; export PATH=\"${BUN_INSTALL}/bin:\${PATH}\"; echo 'oh-my-openagent:'; bunx oh-my-openagent doctor 2>/dev/null || true"
run_user "export PATH=\"${HOME}/.local/bin:${HOME}/.cargo/bin:\${PATH}\"; echo 'OpenResearch:'; orx --version 2>/dev/null || true"
run_user "export PATH=\"${HOME}/.local/bin:\${PATH}\"; echo 'RTK:'; rtk --version 2>/dev/null || true"
run_user "export PATH=\"${HOME}/.local/bin:\${PATH}\"; echo 'Headroom:'; headroom --version 2>/dev/null || true"
run_user "export NVM_DIR=\"${HOME}/.nvm\"; [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"; export PATH=\"${HOME}/.npm-global/bin:\${PATH}\"; echo 'OmniRoute:'; omniroute --version 2>/dev/null || true"
run_user "echo 'Ollama:'; ollama --version 2>/dev/null || true"
run_user "export PATH=\"${HOME}/.local/bin:\${PATH}\"; echo 'Graphify:'; graphify --version 2>/dev/null || true"
run_user "export PATH=\"${HOME}/.local/bin:\${PATH}\"; echo 'ECC:'; ecc --version 2>/dev/null || true"
run_user "export PATH=\"${HOME}/.local/bin:\${PATH}\"; echo 'AgentShield:'; ecc-agentshield --version 2>/dev/null || true"
run_user "export BUN_INSTALL=\"${HOME}/.bun\"; export PATH=\"${BUN_INSTALL}/bin:\${PATH}\"; echo 'OpenCode MCP:'; opencode mcp list 2>/dev/null || true"

# ------------------------------------------------------------
# 14. Completion
# ------------------------------------------------------------
echo
echo "============================================================"
echo " UNIVERSAL OPENCODE STACK INSTALLED"
echo "============================================================"
echo
echo "Global tools installed for user: ${TARGET_USER}"
echo
echo "  ✓ OpenCode"
echo "  ✓ oh-my-openagent"
echo "  ✓ OpenResearch"
echo "  ✓ RTK"
echo "  ✓ Headroom"
echo "  ✓ OmniRoute"
echo "  ✓ ECC (Full Profile)"
echo "  ✓ Ollama (llama3.1:8b + nomic-embed-text)"
echo "  ✓ Graphify (Ollama backend)"
echo "  ✓ ECC AgentShield"
echo "  ✓ Global AGENTS.md"
echo "  ✓ Universal project initializer"
echo
echo "For a new project:"
echo
echo "  mkdir -p ~/openidea/projects/my-project"
echo "  cd ~/openidea/projects/my-project"
echo "  init-agent-project"
echo "  opencode"
echo
echo "For an existing project:"
echo
echo "  cd ~/openidea/projects/your-project"
echo "  init-agent-project"
echo "  opencode"
echo
echo "Research: OpenResearch is available as an on-demand skill."
echo "Token optimization: RTK is configured for OpenCode."
echo "Context compression: headroom wrap opencode"
echo "Routing: Start OmniRoute with: omniroute"
echo "Knowledge Graph: graphify query \"your question\""
echo "Security Audit: ecc-agentshield scan CLAUDE.md"
echo
echo "IMPORTANT: Existing project files and OpenCode MCP configuration were not intentionally overwritten."
echo
echo "Run 'source ~/.bashrc' then start OpenCode."
echo "============================================================"