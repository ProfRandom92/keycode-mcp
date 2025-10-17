# keycode-mcp v2.0 - Security-Hardened Edition

A Model Context Protocol (MCP) server for code snippet management, git operations, Supabase/Cloudflare integration, and Android IME builds with **comprehensive security hardening**.

## 🔒 Security Features

### Dry-Run Mode (Default: ON)
All mutating operations require explicit `confirm:true` parameter when dry-run mode is enabled.

### Capability Flags (Least-Privilege Defaults)
Tools are disabled by default and must be explicitly enabled via environment variables:
- `snippets`: ✅ Enabled by default (read-only operations)
- `git`: ❌ Disabled by default
- `supabase`: ❌ Disabled by default  
- `cloudflare`: ❌ Disabled by default
- `android`: ❌ Disabled by default

### Whitelist Configuration
- Repository whitelist (org/repo patterns)
- Organization whitelist
- Branch name whitelist (supports glob patterns like `sandbox-*`)

### Audit Trail
All tool operations are logged with:
- Timestamp
- Tool name
- Caller identification
- Input hash (for verification)
- Outcome (success/error/dry-run/rejected)

### Secure Logging
- Automatic masking of API keys, tokens, secrets, passwords
- Structured JSON logs
- Sensitive key detection in nested objects

### Input Validation
- Zod schema validation for all tool inputs
- Length constraints (commit messages: 10-200 chars, PR titles: 10-100 chars)
- Pattern validation (branch names, project names)
- Reject/clamp policies

---

## 📦 Installation

```bash
git clone https://github.com/ProfRandom92/keycode-mcp.git
cd keycode-mcp
pnpm install
pnpm build
```

---

## ⚙️ Configuration

### Environment Variables

See [`.env.example`](./.env.example) for complete configuration template.

#### Required

```bash
# Cohere API for semantic search
COHERE_API_KEY=your_key_here

# GitHub token for git operations
# Scopes: repo, workflow (optional)
GITHUB_TOKEN=your_token_here
```

#### Optional

```bash
# Supabase (prefer RLS-secured roles over service key)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here

# Cloudflare (Pages + Workers permissions)
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

#### Security Configuration

```bash
# Dry-run mode (default: true)
MCP_DRY_RUN=true

# Require confirmation (default: true)
MCP_REQUIRE_CONFIRM=true

# Human-in-the-loop (default: true)
MCP_HUMAN_IN_LOOP=true

# Capability flags (default: only snippets enabled)
MCP_CAP_SNIPPETS=true
MCP_CAP_GIT=false
MCP_CAP_SUPABASE=false
MCP_CAP_CLOUDFLARE=false
MCP_CAP_ANDROID=false

# Whitelists (comma-separated, supports glob patterns)
MCP_WHITELIST_REPOS=owner/repo1,org/*
MCP_WHITELIST_ORGS=myorg,trusted-org
MCP_WHITELIST_BRANCHES=sandbox-*,test/*,dev/*
```

---

## 🚀 Usage

### Claude Desktop Configuration

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "keycode": {
      "command": "node",
      "args": ["/absolute/path/to/keycode-mcp/dist/server.js"],
      "env": {
        "COHERE_API_KEY": "your_key",
        "GITHUB_TOKEN": "your_token",
        "MCP_DRY_RUN": "true",
        "MCP_CAP_GIT": "true",
        "MCP_WHITELIST_BRANCHES": "sandbox-*,test/*"
      }
    }
  }
}
```

---

## 🛠️ Tools

### Snippet Management (Read-Only by Default)
- `snippet.search` - Keyword or semantic search with Cohere embeddings
- `snippet.upsert` - Create/update snippets
- `snippet.export` - Export to JSON
- `snippet.import` - Import from JSON

### Git Operations (Mutating - Requires Confirmation)
- `git.createRepo` - Create GitHub repository
- `git.commit` - Commit changes (10-200 char message)
- `git.branch` - Create branch (whitelist-checked)
- `git.pr` - Create pull request (10-100 char title, whitelist-checked)

### Supabase Integration
- `supabase.query` - Execute database queries
- `supabase.kv.get` - Get KV value
- `supabase.kv.set` - Set KV value

### Cloudflare Deployment (Mutating - Requires Confirmation)
- `cloudflare.deploy` - Deploy Pages or Workers

### Android Build (Mutating - Requires Confirmation)
- `android.buildIme` - Build IME with Gradle

---

## 📚 Resources

- `snippets://all` - All code snippets
- `templates://list` - Code templates
- `workspace://info` - Workspace metadata + security config
- `logs://audit` - Security audit trail (last 100 entries)

---

## 🎯 Prompts

- `p:create-companion` - Generate companion app design
- `p:hardening-privacy` - Privacy analysis and hardening recommendations
- `p:ship-release` - Release checklist and automation plan

---

## 📋 Example Tool Calls

### Safe: Search Snippets (No Confirmation Required)

```json
{
  "tool": "snippet.search",
  "arguments": {
    "query": "react hooks",
    "semantic": true,
    "topK": 5
  }
}
```

### Mutating: Create Branch (Requires Confirmation + Whitelist)

```json
{
  "tool": "git.branch",
  "arguments": {
    "name": "sandbox-feature-123",
    "checkout": true,
    "confirm": true
  }
}
```

**Without `confirm:true`:**
```
Error: Dry-run mode enabled. Set confirm:true to execute.
```

**Branch not in whitelist:**
```
Error: Branch 'main' not in whitelist. Allowed patterns: sandbox-*, test/*, dev/*
```

### Mutating: Deploy Cloudflare Worker

```json
{
  "tool": "cloudflare.deploy",
  "arguments": {
    "type": "worker",
    "name": "my-worker",
    "path": "./worker.js",
    "confirm": true
  }
}
```

---

## 🔐 Security Model

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Accidental destructive operations | Dry-run mode + explicit confirmation |
| Unauthorized repository access | Whitelist validation for repos/orgs/branches |
| Credential leakage in logs | Automatic masking of secrets in all logs |
| Privilege escalation | Capability flags with least-privilege defaults |
| Audit trail tampering | Immutable audit log with input hashing |
| Malicious input | Zod schema validation + pattern constraints |

### Permission Model

| Tool Category | Default State | Required Env Var | Mutating? |
|--------------|---------------|------------------|-----------|
| Snippets | ✅ Enabled | `MCP_CAP_SNIPPETS` | No |
| Git | ❌ Disabled | `MCP_CAP_GIT=true` | Yes |
| Supabase | ❌ Disabled | `MCP_CAP_SUPABASE=true` | Depends |
| Cloudflare | ❌ Disabled | `MCP_CAP_CLOUDFLARE=true` | Yes |
| Android | ❌ Disabled | `MCP_CAP_ANDROID=true` | Yes |

### Least-Privilege Recommendations

1. **GitHub Token**: Use fine-grained tokens with minimal scopes
   - Contents: Read and write
   - Pull requests: Read and write
   - Workflows: Only if pushing workflows

2. **Supabase**: Prefer RLS-secured anon keys over service keys
   - Service keys should only be used server-side
   - Implement Row Level Security policies

3. **Cloudflare**: Create API tokens with specific permissions
   - Cloudflare Pages: Edit
   - Workers Scripts: Edit
   - Avoid account-wide tokens

---

## 🧪 Testing

```bash
# Run all tests (72 tests including security gates)
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Build
pnpm build
```

### Test Coverage

- ✅ Snippet tools (7 tests)
- ✅ Git tools (9 tests)
- ✅ Supabase tools (9 tests)
- ✅ Cloudflare tools (6 tests)
- ✅ Android tools (7 tests)
- ✅ Security gates (20 tests)
- ✅ Secure logger (14 tests)

---

## 🔍 Error Codes

| Code | Message | Cause | Resolution |
|------|---------|-------|-----------|
| `SEC001` | Dry-run mode enabled | `confirm:true` not provided | Add `confirm:true` to arguments |
| `SEC002` | Confirmation required | `requireConfirm=true` | Add `confirm:true` to arguments |
| `SEC003` | Capability disabled | Tool category not enabled | Set `MCP_CAP_<CATEGORY>=true` |
| `SEC004` | Not in whitelist | Repo/org/branch not whitelisted | Add to whitelist or use allowed pattern |
| `VAL001` | Invalid input | Schema validation failed | Check input format and constraints |
| `VAL002` | Length constraint | String too short/long | Adjust to meet length requirements |
| `VAL003` | Pattern mismatch | Invalid characters/format | Use allowed characters only |
| `AUTH001` | Missing credentials | API key/token not configured | Set required environment variables |

---

## 🏗️ Architecture

```
keycode-mcp/
├── src/
│   ├── server.ts              # Main MCP server with security integration
│   ├── security/
│   │   ├── gates.ts           # Security gate implementation
│   │   └── logger.ts          # Secure logger with masking
│   ├── types/
│   │   ├── security.ts        # Security config types
│   │   └── snippet.ts         # Snippet types
│   ├── resources/
│   │   └── snippets.ts        # Snippet storage
│   ├── tools/
│   │   ├── embeddings.ts      # Cohere embeddings
│   │   ├── snippet-tools.ts   # Snippet operations
│   │   ├── git-tools.ts       # Git operations (secured)
│   │   ├── supabase-tools.ts  # Supabase integration
│   │   ├── cloudflare-tools.ts # Cloudflare deployment (secured)
│   │   └── android-tools.ts   # Android builds (secured)
│   └── prompts/
│       └── index.ts           # Prompt templates
├── tests/                     # 72 integration tests
├── .github/workflows/
│   ├── ci.yml                 # CI pipeline
│   ├── codeql.yml             # CodeQL security scanning
│   └── secret-scan.yml        # TruffleHog secret scanning
└── .env.example               # Configuration template
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b sandbox-feature-name`
3. Commit changes: `git commit -m "feat: description"`
4. Push: `git push origin sandbox-feature-name`
5. Open Pull Request

**Security Note**: All PRs are scanned for secrets and security issues via CodeQL and TruffleHog.

---

## 📄 License

MIT

---

## 🆘 Support

For issues, questions, or security concerns, please open an issue on GitHub.

**Security Vulnerabilities**: Please report via GitHub Security Advisories.

