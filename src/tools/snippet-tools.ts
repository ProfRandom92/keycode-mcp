import { z } from 'zod';
import { SnippetStorage } from '../resources/snippets.js';
import { EmbeddingsService } from './embeddings.js';

export const SnippetSearchSchema = z.object({
  query: z.string().describe('Search query for finding snippets'),
  semantic: z.boolean().optional().describe('Use semantic search with embeddings'),
  topK: z.number().optional().default(5).describe('Number of results to return for semantic search'),
});

export const SnippetUpsertSchema = z.object({
  id: z.string().optional().describe('Snippet ID (auto-generated if not provided)'),
  title: z.string().describe('Snippet title'),
  content: z.string().describe('Snippet code content'),
  language: z.string().optional().describe('Programming language'),
  tags: z.array(z.string()).optional().describe('Tags for categorization'),
  generateEmbedding: z.boolean().optional().default(false).describe('Generate embedding for semantic search'),
});

export const SnippetExportSchema = z.object({
  format: z.enum(['json']).default('json').describe('Export format'),
});

export const SnippetImportSchema = z.object({
  data: z.string().describe('JSON data to import'),
});

export class SnippetTools {
  constructor(
    private storage: SnippetStorage,
    private embeddings: EmbeddingsService
  ) {}

  async search(args: z.infer<typeof SnippetSearchSchema>) {
    if (args.semantic) {
      const queryEmbedding = await this.embeddings.embedQuery(args.query);
      const results = this.storage.semanticSearch(queryEmbedding, args.topK);
      return {
        method: 'semantic',
        count: results.length,
        snippets: results,
      };
    } else {
      const results = this.storage.search(args.query);
      return {
        method: 'keyword',
        count: results.length,
        snippets: results,
      };
    }
  }

  async upsert(args: z.infer<typeof SnippetUpsertSchema>) {
    let embedding: number[] | undefined;

    if (args.generateEmbedding) {
      const text = `${args.title}\n${args.content}`;
      const embeddings = await this.embeddings.embed([text]);
      embedding = embeddings[0];
    }

    const snippet = this.storage.upsert({
      ...args,
      embedding,
    });

    return {
      success: true,
      snippet,
    };
  }

  async exportSnippets(args: z.infer<typeof SnippetExportSchema>) {
    const data = this.storage.exportData();
    return {
      format: args.format,
      data,
    };
  }

  async importSnippets(args: z.infer<typeof SnippetImportSchema>) {
    this.storage.importData(args.data);
    const count = this.storage.getAll().length;
    return {
      success: true,
      count,
    };
  }
}

