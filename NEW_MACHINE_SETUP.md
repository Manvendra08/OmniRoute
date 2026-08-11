# 🚀 OmniRoute Setup Instructions for New Machine

This document contains all the changes and customizations made to the original OmniRoute repository. An AI agent should follow these instructions after cloning the repo on a new machine.

## 📋 Overview

**Repository**: OmniRoute (release/v3.8.50 branch)
**Purpose**: Unified AI proxy/router with 290+ providers, 90+ free tiers
**Customizations**: Bug fixes, MCP improvements, custom scripts, executor updates

---

## 🔧 Critical Changes to Apply

### 1. MCP stdio Transport Fix

**File**: `bin/omniroute.mjs`

The MCP stdio transport fix ensures that stdout is strictly reserved for JSON-RPC messages. This prevents background logs from corrupting the MCP protocol.

**What was changed**:
- Moved the console redirection to the very top of the entrypoint (before imports)
- Added `stdout.write` filtering to only allow JSON-RPC messages through stdout
- All other output (logs, errors, debug info) goes to stderr

**How to verify**:
```bash
# Test MCP server
node bin/omniroute.mjs --mcp
# Should only output JSON-RPC messages to stdout
```

**New file added**: `open-sse/mcp-server/stdio-wrapper.ts`
- This file handles the console and stdout redirection for MCP servers
- It's imported at the top of `open-sse/mcp-server/server.ts`

---

### 2. Executor Updates

#### 2.1 Qwen-Web Executor (`open-sse/executors/qwen-web.ts`)

**Changes**:
- Updated SPA version from `0.2.66` to `0.2.81` (August 2026)
- Added new model aliases:
  - `qwen3.8-coder-flash` → `qwen3.6-plus`
  - `qwen3.8-max` → `qwen3.7-max`
  - `qwen3.8-plus` → `qwen3.7-plus`
- Added error handling for SSE delta errors
- Changed unrecognized phase handling to treat as answer content (prevents "Provider returned empty content" errors)

**How to verify**:
```bash
# Test Qwen provider
curl -X POST http://localhost:20128/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen3.8-max", "messages": [{"role": "user", "content": "Hello"}]}'
```

#### 2.2 OpenCode Executor (`open-sse/executors/opencode.ts`)

**Changes**:
- Changed `OPENCODE_SYNTHESIZE_CLI_HEADERS` default from `false` to `true`
- Added model ID normalization: strips provider prefix (e.g., `openai/gpt-4` → `gpt-4`)

**How to verify**:
```bash
# Test OpenCode provider
curl -X POST http://localhost:20128/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "opencode/gpt-4", "messages": [{"role": "user", "content": "Hello"}]}'
```

---

### 3. Database Improvements

#### 3.1 OMP Database (`src/lib/db/omp.ts`)

**Changes**:
- Added try-catch for better-sqlite3 import
- Added null check for Database before opening connections
- Prevents crashes when better-sqlite3 is not available

**How to verify**:
```bash
# Server should start without errors
npm run dev
# Check logs for any database initialization errors
```

---

### 4. Claude Code Tool Remapping

**File**: `open-sse/services/claudeCodeToolRemapper.ts`

**Changes**:
- Exempted single-underscore MCP tool names from cloaking
- Pattern: `mcp_<server>_<tool>` (e.g., `mcp_filesystem_read_file`)
- Prevents "Tool reference not found" errors with certain MCP servers

**How to verify**:
- If using MCP tools with single-underscore naming, they should work without 400 errors

---

### 5. CC Discovery Aliases

**File**: `open-sse/utils/ccDiscoveryAliases.ts`

**Changes**:
- Fixed logic for determining if a model ID is mirrorable
- Now allows antigravity models with effort suffixes

**How to verify**:
```bash
# Check model catalog includes antigravity models
curl http://localhost:20128/v1/models | grep antigravity
```

---

### 6. Dashboard Fixes

#### 6.1 Cost Overview (`src/app/(dashboard)/dashboard/costs/CostOverviewTab.tsx`)

**Changes**:
- Fixed React key prop to include index (prevents duplicate key warnings)
- Changed from `key={String(row[columns[0].key])}` to `key={`${String(row[columns[0].key])}-${idx}`}`

**How to verify**:
- Open dashboard → Costs tab
- No React key warnings in console

---

### 7. i18n Updates

**Files**: `src/i18n/messages/*.json` (all language files)

**Changes**:
- Updated MCP-related strings to use proper HTML code tags
- Fixed display of MCP tool names in dashboard
- Added missing translations

**How to verify**:
- Switch language in dashboard settings
- MCP configuration page should display correctly

---

## 📜 Custom Scripts Added

These scripts were added for development and debugging purposes. They are **not required** for normal operation but may be useful.

### Python Scripts

| Script | Purpose |
|--------|---------|
| `scripts/add_claude_aliases.py` | Add Claude model aliases to database (maps Claude models to Antigravity Gemini) |
| `scripts/check_db.py` | Check database status and contents |
| `scripts/extract_qwen.py` | Extract Qwen session cookies |
| `scripts/get_chrome_qwen_cookies.py` | Get Qwen cookies from Chrome browser |
| `scripts/inspect_kv.py` | Inspect key-value store contents |
| `scripts/map_all_anthropic_models.py` | Map all Anthropic models |
| `scripts/map_all_dbs.py` | Map all database tables |
| `scripts/test_models.py` | Test model availability |

### JavaScript Scripts

| Script | Purpose |
|--------|---------|
| `scripts/extract_all_cookies.mjs` | Extract cookies from all providers |
| `scripts/extract_qwen_cookie.mjs` | Extract Qwen cookies (JS version) |
| `add-proxies-to-pool.mjs` | Add proxies to the pool (helper script) |
| `sync-arena.js` | Sync arena session data |

**Usage**:
```bash
# Example: Add Claude aliases
python scripts/add_claude_aliases.py

# Example: Check database
python scripts/check_db.py
```

---

## 📦 Dependency Changes

### package.json

```diff
- "playwright": "1.62.0",
+ "playwright": "^1.62.1",

- "better-sqlite3": "^13.0.1",
+ "better-sqlite3": "^13.0.3",
```

### pnpm-workspace.yaml

```diff
+  '@playwright/browser-chromium': set this to true or false
+  bun: set this to true or false
```

**How to apply**:
```bash
# If using npm
npm install

# If using pnpm
pnpm install
```

---

## 🗄️ Database & Configuration Backup

### Critical Files to Backup

| File | Location | Purpose |
|------|----------|---------|
| `storage.sqlite` | `%APPDATA%\omniroute\` | Main database (providers, proxies, settings) |
| `.env` | `%APPDATA%\omniroute\` | Environment variables (secrets, API keys) |
| `server.env` | `%APPDATA%\omniroute\` | Server secrets (JWT, encryption keys) |
| Project `.env` | `C:\Users\manve\OmniRoute\.env` | Project-specific config |

### Backup Script

```powershell
# Create backup directory
mkdir C:\Users\manve\omniroute-backup

# Backup database and config
copy "$env:APPDATA\omniroute\storage.sqlite" C:\Users\manve\omniroute-backup\
copy "$env:APPDATA\omniroute\.env" C:\Users\manve\omniroute-backup\
copy "$env:APPDATA\omniroute\server.env" C:\Users\manve\omniroute-backup\
copy C:\Users\manve\OmniRoute\.env C:\Users\manve\omniroute-backup\project-env.txt

# Create ZIP archive
Compress-Archive -Path C:\Users\manve\omniroute-backup -DestinationPath C:\Users\manve\omniroute-backup.zip
```

### Restore Script

```powershell
# Stop OmniRoute first!

# Restore files
copy C:\Users\manve\omniroute-backup\storage.sqlite "$env:APPDATA\omniroute\"
copy C:\Users\manve\omniroute-backup\.env "$env:APPDATA\omniroute\"
copy C:\Users\manve\omniroute-backup\server.env "$env:APPDATA\omniroute\"
copy C:\Users\manve\omniroute-backup\project-env.txt C:\Users\manve\OmniRoute\.env
```

---

## 🔄 Step-by-Step Setup on New Machine

### Phase 1: Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/diegosouzapw/OmniRoute.git
cd OmniRoute

# 2. Checkout the customized branch
git checkout release/v3.8.50

# 3. Install dependencies
npm install

# 4. Copy environment files
cp .env.example .env
```

### Phase 2: Apply Custom Changes

**Option A: Apply from Backup (Recommended)**

If you have a backup from the old machine:
```bash
# Restore database and config
copy <backup-path>\storage.sqlite %APPDATA%\omniroute\
copy <backup-path>\.env %APPDATA%\omniroute\
copy <backup-path>\server.env %APPDATA%\omniroute\
```

**Option B: Manual Configuration**

If starting fresh:
```bash
# Start OmniRoute
npm run dev

# Configure via dashboard at http://localhost:20128
# 1. Add providers (Kiro AI, OpenCode Free, etc.)
# 2. Configure proxy settings if needed
# 3. Set up API keys
```

### Phase 3: Verify Installation

```bash
# 1. Start the server
npm run dev

# 2. Open dashboard
# http://localhost:20128

# 3. Test a provider
curl -X POST http://localhost:20128/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "auto", "messages": [{"role": "user", "content": "Hello"}]}'

# 4. Test MCP server (optional)
node bin/omniroute.mjs --mcp
```

### Phase 4: Configure Coding Tools

```bash
# For Claude Code
# Set environment variable:
export ANTHROPIC_BASE_URL=http://localhost:20128/v1

# For OpenCode
# Add to settings:
# Base URL: http://localhost:20128/v1
# API Key: [from dashboard → Endpoints]
```

---

## ⚠️ Important Notes

### Security

- **Never commit** `.env`, `server.env`, or `storage.sqlite` to git
- These files contain sensitive secrets (API keys, encryption keys)
- Use `.gitignore` to exclude them

### Database Migration

- OmniRoute runs migrations automatically on startup
- Old database files will be upgraded to new versions
- Backup before upgrading!

### Network Changes

If moving to a different network:
- Reconfigure proxy settings
- Check API keys that are IP-restricted
- Re-authenticate OAuth providers

### Provider Re-authentication

Some providers may need re-authentication on the new machine:
- OAuth-based providers (GitHub, Google, etc.)
- Providers with IP-locked API keys

---

## 🐛 Troubleshooting

### Common Issues

**1. Database locked error**
```bash
# Stop OmniRoute, then delete lock file
del "%APPDATA%\omniroute\storage.sqlite-shm"
del "%APPDATA%\omniroute\storage.sqlite-wal"
```

**2. Port already in use**
```bash
# Find process using port 20128
netstat -ano | findstr :20128

# Kill the process
taskkill /PID <PID> /F
```

**3. MCP stdio issues**
```bash
# Verify stdout is clean
node bin/omniroute.mjs --mcp 2>nul | head -5
# Should output only JSON-RPC messages
```

**4. Provider connection failed**
- Check API keys in dashboard
- Verify network connectivity
- Check proxy settings if using proxies

---

## 📚 Additional Resources

- **OmniRoute Documentation**: `docs/` directory
- **API Reference**: `docs/reference/API_REFERENCE.md`
- **Proxy Guide**: `docs/ops/PROXY_GUIDE.md`
- **Environment Variables**: `docs/reference/ENVIRONMENT.md`
- **Troubleshooting**: `docs/getting-started/TROUBLESHOOTING.md`

---

## 🤖 AI Agent Instructions

When setting up on a new machine, follow these steps in order:

1. **Clone and checkout the repository**
2. **Install dependencies** (`npm install`)
3. **Restore database and config from backup** (if available)
4. **Start the server** (`npm run dev`)
5. **Verify dashboard loads** at `http://localhost:20128`
6. **Test provider connections** (especially theoldllm if using residential proxy)
7. **Configure coding tools** to point to OmniRoute
8. **Run any custom scripts** if needed (see Custom Scripts section)

**Critical**: The MCP stdio fix is already applied in the repository. Do NOT revert these changes.

---

*Last updated: 2026-08-11*
*Repository: OmniRoute v3.8.50 (release branch)*
