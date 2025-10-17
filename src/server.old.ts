#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { SnippetStorage } from './resources/snippets.js';
import { EmbeddingsService } from './tools/embeddings.js';
import { SnippetTools, SnippetSearchSchema, SnippetUpsertSchema, SnippetExportSchema, SnippetImportSchema } from './tools/snippet-tools.js';
import { GitTools, GitCreateRepoSchema, GitCommitSchema, GitBranchSchema, GitPRSchema } from './tools/git-tools.js';
import { SupabaseTools, SupabaseQuerySchema, SupabaseKVGetSchema, SupabaseKVSetSchema } from './tools/supabase-tools.js';
import { CloudflareTools, CloudflareDeploySchema } from './tools/cloudflare-tools.js';
import { AndroidTools, AndroidBuildImeSchema } from './tools/android-tools.js';
import { prompts, PromptName } from './prompts/index.js';

// Initialize services
const snippetStorage = new SnippetStorage();
const embeddingsService = new EmbeddingsService(process.env.COHERE_API_KEY);
const snippetTools = new SnippetTools(snippetStorage, embeddingsService);
const gitTools = new GitTools(process.env.GITHUB_TOKEN);
const supabaseTools = new SupabaseTools(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const cloudflareTools = new CloudflareTools(process.env.CLOUDFLARE_API_TOKEN);
const androidTools = new AndroidTools();

// Create MCP server
const server = new Server(
  {
    name: 'keycode-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

// Register resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const snippets = snippetStorage.getAll();
  
  return {
    resources: [
      {
        uri: 'snippets://all',
        name: 'All Code Snippets',
        description: 'Complete collection of stored code snippets',
        mimeType: 'application/json',
      },
      {
        uri: 'templates://list',
        name: 'Code Templates',
        description: 'Reusable code templates and boilerplates',
        mimeType: 'application/json',
      },
      {
        uri: 'workspace://info',
        name: 'Workspace Information',
        description: 'Current workspace configuration and metadata',
        mimeType: 'application/json',
      },
      {
        uri: 'logs://recent',
        name: 'Recent Logs',
        description: 'Recent operation logs and activity',
        mimeType: 'text/plain',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === 'snippets://all') {
    const snippets = snippetStorage.getAll();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(snippets, null, 2),
        },
      ],
    };
  }

  if (uri === 'templates://list') {
    // Mock templates for now
    const templates = [
      { id: 'react-component', name: 'React Component', language: 'typescript' },
      { id: 'express-route', name: 'Express Route', language: 'javascript' },
      { id: 'python-class', name: 'Python Class', language: 'python' },
    ];
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(templates, null, 2),
        },
      ],
    };
  }

  if (uri === 'workspace://info') {
    const info = {
      name: 'keycode-mcp',
      snippetCount: snippetStorage.getAll().length,
      timestamp: new Date().toISOString(),
    };
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  }

  if (uri === 'logs://recent') {
    const logs = 'No recent logs available';
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: logs,
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'snippet.search',
        description: 'Search code snippets using keyword or semantic search with Cohere embeddings',
        inputSchema: SnippetSearchSchema,
      },
      {
        name: 'snippet.upsert',
        description: 'Create or update a code snippet with optional embedding generation',
        inputSchema: SnippetUpsertSchema,
      },
      {
        name: 'snippet.export',
        description: 'Export all snippets to JSON format',
        inputSchema: SnippetExportSchema,
      },
      {
        name: 'snippet.import',
        description: 'Import snippets from JSON data',
        inputSchema: SnippetImportSchema,
      },
      {
        name: 'git.createRepo',
        description: 'Create a new GitHub repository',
        inputSchema: GitCreateRepoSchema,
      },
      {
        name: 'git.commit',
        description: 'Commit changes to the current repository',
        inputSchema: GitCommitSchema,
      },
      {
        name: 'git.branch',
        description: 'Create a new git branch',
        inputSchema: GitBranchSchema,
      },
      {
        name: 'git.pr',
        description: 'Create a pull request on GitHub',
        inputSchema: GitPRSchema,
      },
      {
        name: 'supabase.query',
        description: 'Execute a query on Supabase database',
        inputSchema: SupabaseQuerySchema,
      },
      {
        name: 'supabase.kv.get',
        description: 'Get a value from Supabase KV store',
        inputSchema: SupabaseKVGetSchema,
      },
      {
        name: 'supabase.kv.set',
        description: 'Set a value in Supabase KV store',
        inputSchema: SupabaseKVSetSchema,
      },
      {
        name: 'cloudflare.deploy',
        description: 'Deploy a Cloudflare Pages site or Worker',
        inputSchema: CloudflareDeploySchema,
      },
      {
        name: 'android.buildIme',
        description: 'Build an Android IME (Input Method Editor) project using Gradle',
        inputSchema: AndroidBuildImeSchema,
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'snippet.search':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await snippetTools.search(args as any), null, 2),
            },
          ],
        };

      case 'snippet.upsert':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await snippetTools.upsert(args as any), null, 2),
            },
          ],
        };

      case 'snippet.export':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await snippetTools.exportSnippets(args as any), null, 2),
            },
          ],
        };

      case 'snippet.import':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await snippetTools.importSnippets(args as any), null, 2),
            },
          ],
        };

      case 'git.createRepo':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await gitTools.createRepo(args as any), null, 2),
            },
          ],
        };

      case 'git.commit':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await gitTools.commit(args as any), null, 2),
            },
          ],
        };

      case 'git.branch':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await gitTools.createBranch(args as any), null, 2),
            },
          ],
        };

      case 'git.pr':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await gitTools.createPR(args as any), null, 2),
            },
          ],
        };

      case 'supabase.query':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await supabaseTools.query(args as any), null, 2),
            },
          ],
        };

      case 'supabase.kv.get':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await supabaseTools.kvGet(args as any), null, 2),
            },
          ],
        };

      case 'supabase.kv.set':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await supabaseTools.kvSet(args as any), null, 2),
            },
          ],
        };

      case 'cloudflare.deploy':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await cloudflareTools.deploy(args as any), null, 2),
            },
          ],
        };

      case 'android.buildIme':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await androidTools.buildIme(args as any), null, 2),
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Register prompt handlers
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: Object.values(prompts).map(p => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments,
    })),
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const promptName = request.params.name as PromptName;
  const prompt = prompts[promptName];

  if (!prompt) {
    throw new Error(`Unknown prompt: ${promptName}`);
  }

  // Simple template rendering
  let rendered = prompt.template;
  const args = request.params.arguments || {};

  for (const [key, value] of Object.entries(args)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }

  // Handle conditional blocks (simplified)
  rendered = rendered.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, key, content) => {
    return args[key] ? content : '';
  });

  return {
    description: prompt.description,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: rendered,
        },
      },
    ],
  };
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('keycode-mcp server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

