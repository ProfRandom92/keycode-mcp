# GitHub Actions Workflow Note

The GitHub Actions workflow file (`.github/workflows/ci.yml`) is included in the repository but could not be pushed automatically due to GitHub App permission restrictions.

## To enable CI:

1. The workflow file is already committed locally
2. You can manually upload it via the GitHub web interface:
   - Go to https://github.com/ProfRandom92/keycode-mcp
   - Navigate to `.github/workflows/`
   - Click "Add file" > "Upload files"
   - Upload the `ci.yml` file from your local repository

OR

3. Push it using a personal access token with `workflow` scope instead of the GitHub App token

The workflow is configured and ready to run once uploaded. It will:
- Run tests on Node.js 18.x, 20.x, and 22.x
- Verify TypeScript compilation
- Execute on every push and pull request to main/develop branches

