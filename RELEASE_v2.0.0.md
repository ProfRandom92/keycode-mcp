# keycode-mcp v2.0.0 - Security-Hardened Release

## 🎉 Release Summary

Major security hardening release with comprehensive protection mechanisms, audit trails, and least-privilege defaults.

## 🔒 Security Features

### 1. Dry-Run Mode (Default: ON)
- All mutating operations blocked unless `confirm:true` is explicitly provided
- Prevents accidental destructive operations
- Can be disabled via `MCP_DRY_RUN=false`

### 2. Capability Flags (Least-Privilege)
- **Default State**: Only `snippets` enabled
- **Disabled by Default**: git, supabase, cloudflare, android
- Must explicitly enable via environment variables:
  - `MCP_CAP_GIT=true`
  - `MCP_CAP_SUPABASE=true`
  - `MCP_CAP_CLOUDFLARE=true`
  - `MCP_CAP_ANDROID=true`

### 3. Whitelist Validation
- Repository whitelist (supports glob patterns)
- Organization whitelist
- Branch name whitelist (default: `sandbox-*`, `test/*`, `dev/*`)
- Configurable via `MCP_WHITELIST_*` environment variables

### 4. Audit Trail
- All tool operations logged with:
  - Timestamp
  - Tool name
  - Caller identification
  - Input hash (SHA-256, first 16 chars)
  - Outcome (success/error/dry-run/rejected)
- Accessible via `logs://audit` resource
- Keeps last 1000 entries

### 5. Secure Logging
- Automatic masking of sensitive data:
  - API keys
  - Tokens (GitHub, Bearer, etc.)
  - Secrets
  - Passwords
- Pattern-based detection in strings
- Key-based detection in objects
- Structured JSON logs

### 6. Enhanced Input Validation
- Zod schema validation for all tools
- Length constraints:
  - Commit messages: 10-200 characters
  - PR titles: 10-100 characters
- Pattern validation:
  - Branch names: alphanumeric, `_`, `/`, `-`
  - Project names: lowercase, alphanumeric, hyphens
- Reject/clamp policies

## 📊 Statistics

- **Version**: 2.0.0 (from 1.0.0)
- **Tests**: 72 (from 38) - +89% coverage
- **New Files**: 8
- **Modified Files**: 10
- **Lines Added**: ~2000
- **Security Tests**: 34 new tests

## 🧪 Test Coverage

| Category | Tests | Status |
|----------|-------|--------|
| Snippet Tools | 7 | ✅ |
| Git Tools | 9 | ✅ |
| Supabase Tools | 9 | ✅ |
| Cloudflare Tools | 6 | ✅ |
| Android Tools | 7 | ✅ |
| Security Gates | 20 | ✅ |
| Secure Logger | 14 | ✅ |
| **Total** | **72** | ✅ |

## 🔐 CI/CD Security

### New Workflows

1. **CodeQL** (`.github/workflows/codeql.yml`)
   - Static analysis for security vulnerabilities
   - Runs weekly and on push/PR
   - Security-extended queries

2. **Secret Scanning** (`.github/workflows/secret-scan.yml`)
   - TruffleHog OSS integration
   - Detects leaked secrets in commits
   - Runs on push/PR

3. **CI** (updated)
   - Tests on Node.js 18.x, 20.x, 22.x
   - Type checking
   - Build verification

## 📚 Documentation

### New Files
- `README.md` - Comprehensive security documentation
- `.env.example` - Detailed configuration template with scope documentation
- `WORKFLOWS.md` - Workflow upload instructions
- `RELEASE_v2.0.0.md` - This file

### Documentation Sections
- Threat model
- Permission model
- Error codes reference
- Example tool calls
- Security best practices
- Least-privilege recommendations

## 🚨 Breaking Changes

### 1. Confirmation Required
All mutating tools now require `confirm:true`:
- `git.createRepo`
- `git.commit`
- `git.branch`
- `git.pr`
- `cloudflare.deploy`
- `android.buildIme`

**Before (v1.0.0):**
```json
{ "tool": "git.commit", "arguments": { "message": "fix: bug" } }
```

**After (v2.0.0):**
```json
{ "tool": "git.commit", "arguments": { "message": "fix: bug", "confirm": true } }
```

### 2. Capability Flags
Must explicitly enable tool categories:

**Before (v1.0.0):**
All tools available by default

**After (v2.0.0):**
```bash
MCP_CAP_GIT=true
MCP_CAP_SUPABASE=true
MCP_CAP_CLOUDFLARE=true
MCP_CAP_ANDROID=true
```

### 3. Branch Whitelist
Branch operations checked against whitelist:

**Default whitelist:**
- `sandbox-*`
- `test/*`
- `dev/*`

**To allow other branches:**
```bash
MCP_WHITELIST_BRANCHES=sandbox-*,test/*,dev/*,feature/*
```

## 🔄 Migration Guide

### Step 1: Update Environment Variables

Add to your `.env` or Claude Desktop config:

```bash
# Security configuration
MCP_DRY_RUN=true
MCP_REQUIRE_CONFIRM=true

# Enable required capabilities
MCP_CAP_GIT=true
MCP_CAP_SUPABASE=true
MCP_CAP_CLOUDFLARE=true
MCP_CAP_ANDROID=true

# Configure whitelists
MCP_WHITELIST_BRANCHES=sandbox-*,test/*,dev/*
```

### Step 2: Update Tool Calls

Add `confirm:true` to all mutating operations:

```json
{
  "tool": "git.branch",
  "arguments": {
    "name": "sandbox-feature",
    "checkout": true,
    "confirm": true
  }
}
```

### Step 3: Verify Branch Names

Ensure branch names match whitelist patterns:
- ✅ `sandbox-feature-123`
- ✅ `test/integration`
- ✅ `dev/experiment`
- ❌ `main` (not in default whitelist)
- ❌ `feature/new` (not in default whitelist)

## 📈 Performance Impact

- Minimal overhead from security checks (<1ms per operation)
- Audit log kept in memory (last 1000 entries)
- No impact on read-only operations (snippets)

## 🔮 Future Enhancements

- [ ] Human-in-the-loop prompts with diff/plan display
- [ ] Rate limiting per tool
- [ ] IP-based access control
- [ ] Multi-factor authentication for sensitive operations
- [ ] Encrypted audit log export

## 🙏 Acknowledgments

Built with security-first principles following industry best practices:
- OWASP Top 10
- Principle of Least Privilege
- Defense in Depth
- Secure by Default

## 📞 Support

- **Repository**: https://github.com/ProfRandom92/keycode-mcp
- **Issues**: https://github.com/ProfRandom92/keycode-mcp/issues
- **Security**: Report via GitHub Security Advisories

---

**Released**: October 17, 2025  
**License**: MIT
