# keycode-mcp

A Model Context Protocol (MCP) server for code snippet management, git operations, Supabase/Cloudflare integration, and Android IME builds.

## Features

### Resources

- **`snippets://all`** - Complete collection of stored code snippets
- **`templates://list`** - Reusable code templates and boilerplates
- **`workspace://info`** - Current workspace configuration and metadata
- **`logs://recent`** - Recent operation logs and activity

### Tools

#### Snippet Management
- **`snippet.search`** - Search code snippets using keyword or semantic search with Cohere embeddings
- **`snippet.upsert`** - Create or update a code snippet with optional embedding generation
- **`snippet.export`** - Export all snippets to JSON format
- **`snippet.import`** - Import snippets from JSON data

#### Git Operations
- **`git.createRepo`** - Create a new GitHub repository
- **`git.commit`** - Commit changes to the current repository
- **`git.branch`** - Create a new git branch
- **`git.pr`** - Create a pull request on GitHub

#### Supabase Integration
- **`supabase.query`** - Execute a query on Supabase database
- **`supabase.kv.get`** - Get a value from Supabase KV store
- **`supabase.kv.set`** - Set a value in Supabase KV store

#### Cloudflare Deployment
- **`cloudflare.deploy`** - Deploy a Cloudflare Pages site or Worker

#### Android Build
- **`android.buildIme`** - Build an Android IME (Input Method Editor) project using Gradle

### Prompts

- **`p:create-companion`** - Generate a companion app or service for an existing codebase
- **`p:hardening-privacy`** - Analyze code for privacy issues and suggest hardening measures
- **`p:ship-release`** - Generate a comprehensive release checklist and automation plan

## Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/keycode-mcp.git
cd keycode-mcp

# Install dependencies
pnpm install

# Build the project
pnpm build
```

## Configuration

### Environment Variables

The following environment variables are required for various features:

#### Required for Snippet Semantic Search
- **`COHERE_API_KEY`** - Your Cohere API key for generating embeddings
  - Get your API key from [Cohere Dashboard](https://dashboard.cohere.com/)

#### Required for Git Operations
- **`GITHUB_TOKEN`** - GitHub personal access token with repo permissions
  - Generate at [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)

#### Optional: Supabase Integration
- **`SUPABASE_URL`** - Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- **`SUPABASE_SERVICE_KEY`** - Your Supabase service role key
  - Find these in your [Supabase Project Settings > API](https://app.supabase.com/)

#### Optional: Cloudflare Deployment
- **`CLOUDFLARE_API_TOKEN`** - Cloudflare API token with Workers and Pages permissions
  - Create at [Cloudflare Dashboard > My Profile > API Tokens](https://dash.cloudflare.com/profile/api-tokens)

### Example `.env` file

```bash
# Required for semantic search
COHERE_API_KEY=your_cohere_api_key_here

# Required for git operations
GITHUB_TOKEN=your_github_token_here

# Optional: Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Optional: Cloudflare
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
```

## Usage with Claude Desktop

Add this server to your Claude Desktop configuration:

### macOS
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "keycode": {
      "command": "node",
      "args": [
        "/absolute/path/to/keycode-mcp/dist/server.js"
      ],
      "env": {
        "COHERE_API_KEY": "your_cohere_api_key",
        "GITHUB_TOKEN": "your_github_token",
        "SUPABASE_URL": "https://xxxxx.supabase.co",
        "SUPABASE_SERVICE_KEY": "your_supabase_key",
        "CLOUDFLARE_API_TOKEN": "your_cloudflare_token"
      }
    }
  }
}
```

### Windows
Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "keycode": {
      "command": "node",
      "args": [
        "C:\\absolute\\path\\to\\keycode-mcp\\dist\\server.js"
      ],
      "env": {
        "COHERE_API_KEY": "your_cohere_api_key",
        "GITHUB_TOKEN": "your_github_token",
        "SUPABASE_URL": "https://xxxxx.supabase.co",
        "SUPABASE_SERVICE_KEY": "your_supabase_key",
        "CLOUDFLARE_API_TOKEN": "your_cloudflare_token"
      }
    }
  }
}
```

### Linux
Edit `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "keycode": {
      "command": "node",
      "args": [
        "/absolute/path/to/keycode-mcp/dist/server.js"
      ],
      "env": {
        "COHERE_API_KEY": "your_cohere_api_key",
        "GITHUB_TOKEN": "your_github_token",
        "SUPABASE_URL": "https://xxxxx.supabase.co",
        "SUPABASE_SERVICE_KEY": "your_supabase_key",
        "CLOUDFLARE_API_TOKEN": "your_cloudflare_token"
      }
    }
  }
}
```

## Development

```bash
# Run in development mode with auto-reload
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Build the project
pnpm build

# Start the built server
pnpm start
```

## Testing

The project includes comprehensive integration tests for all tools with mocked external APIs:

- **Snippet Tools** - Tests for search, upsert, export, import with mocked Cohere API
- **Git Tools** - Tests for repo creation, commits, branches, PRs with mocked GitHub CLI
- **Supabase Tools** - Tests for queries and KV operations with mocked fetch API
- **Cloudflare Tools** - Tests for Pages and Workers deployment with mocked Wrangler CLI
- **Android Tools** - Tests for IME builds with mocked Gradle execution

Run tests with:

```bash
pnpm test
```

## Architecture

```
keycode-mcp/
├── src/
│   ├── server.ts           # Main MCP server implementation
│   ├── resources/          # Resource handlers
│   │   └── snippets.ts     # Snippet storage and management
│   ├── tools/              # Tool implementations
│   │   ├── embeddings.ts   # Cohere embeddings service
│   │   ├── snippet-tools.ts
│   │   ├── git-tools.ts
│   │   ├── supabase-tools.ts
│   │   ├── cloudflare-tools.ts
│   │   └── android-tools.ts
│   ├── prompts/            # Prompt templates
│   │   └── index.ts
│   └── types/              # TypeScript type definitions
│       └── snippet.ts
├── tests/                  # Integration tests
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI pipeline
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## CI/CD

The project uses GitHub Actions for continuous integration:

- **Test Matrix**: Tests run on Node.js 18.x, 20.x, and 22.x
- **Type Checking**: TypeScript compilation is verified
- **Automated Testing**: All integration tests run on every push and PR

View the CI status in the [Actions tab](../../actions) of the repository.

## Security Notes

- **Never commit secrets** - All API keys and tokens should be provided via environment variables
- **Use service accounts** - For production deployments, use dedicated service accounts with minimal permissions
- **Rotate tokens regularly** - Periodically rotate your API keys and tokens
- **Review permissions** - Ensure GitHub tokens and Cloudflare tokens have only the necessary scopes

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues, questions, or contributions, please open an issue on GitHub.

