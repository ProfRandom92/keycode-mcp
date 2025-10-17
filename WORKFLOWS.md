# GitHub Actions Workflows

The following workflow files are included in the repository but require manual upload due to GitHub App permission restrictions:

## Workflows

1. **`.github/workflows/ci.yml`** - Continuous Integration
   - Runs tests on Node.js 18.x, 20.x, 22.x
   - Type checking with TypeScript
   - Triggers on push/PR to main/develop

2. **`.github/workflows/codeql.yml`** - CodeQL Security Scanning
   - Static analysis for security vulnerabilities
   - Runs weekly and on push/PR
   - Requires GitHub Advanced Security (free for public repos)

3. **`.github/workflows/secret-scan.yml`** - Secret Scanning
   - TruffleHog OSS for detecting leaked secrets
   - Runs on push/PR to main/develop

## Manual Upload Instructions

### Option 1: Via GitHub Web Interface

1. Go to https://github.com/ProfRandom92/keycode-mcp
2. Navigate to `.github/workflows/`
3. Click "Add file" > "Upload files"
4. Upload all three `.yml` files from your local `.github/workflows/` directory
5. Commit the changes

### Option 2: Via Personal Access Token

If you have a personal access token with `workflow` scope:

```bash
# Set your PAT
export GITHUB_TOKEN=your_personal_access_token_with_workflow_scope

# Push with PAT
git push https://$GITHUB_TOKEN@github.com/ProfRandom92/keycode-mcp.git main
```

### Option 3: Enable via Repository Settings

1. Go to repository Settings > Actions > General
2. Enable "Allow GitHub Actions to create and approve pull requests"
3. This may allow workflow updates in future pushes

## Verification

Once uploaded, verify workflows are active:
- Go to https://github.com/ProfRandom92/keycode-mcp/actions
- You should see the workflows listed and running

## Security Benefits

- **CI**: Ensures all tests pass before merging
- **CodeQL**: Detects security vulnerabilities in code
- **Secret Scanning**: Prevents accidental secret commits

These workflows are essential for maintaining security standards in production.

