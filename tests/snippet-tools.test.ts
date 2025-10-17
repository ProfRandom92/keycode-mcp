import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SnippetStorage } from '../src/resources/snippets.js';
import { EmbeddingsService } from '../src/tools/embeddings.js';
import { SnippetTools } from '../src/tools/snippet-tools.js';

describe('SnippetTools Integration Tests', () => {
  let storage: SnippetStorage;
  let embeddings: EmbeddingsService;
  let tools: SnippetTools;

  beforeEach(() => {
    storage = new SnippetStorage();
    embeddings = new EmbeddingsService();
    
    // Mock the embed methods
    vi.spyOn(embeddings, 'embed').mockResolvedValue([
      [0.1, 0.2, 0.3, 0.4, 0.5],
    ]);
    vi.spyOn(embeddings, 'embedQuery').mockResolvedValue([0.1, 0.2, 0.3, 0.4, 0.5]);
    
    tools = new SnippetTools(storage, embeddings);
  });

  it('should upsert a snippet without embedding', async () => {
    const result = await tools.upsert({
      title: 'Test Snippet',
      content: 'console.log("hello");',
      language: 'javascript',
      tags: ['test', 'demo'],
      generateEmbedding: false,
    });

    expect(result.success).toBe(true);
    expect(result.snippet.title).toBe('Test Snippet');
    expect(result.snippet.content).toBe('console.log("hello");');
    expect(result.snippet.language).toBe('javascript');
    expect(result.snippet.tags).toEqual(['test', 'demo']);
    expect(result.snippet.id).toBeDefined();
  });

  it('should upsert a snippet with embedding', async () => {
    const result = await tools.upsert({
      title: 'React Component',
      content: 'const App = () => <div>Hello</div>;',
      language: 'typescript',
      generateEmbedding: true,
    });

    expect(result.success).toBe(true);
    expect(result.snippet.embedding).toBeDefined();
    expect(embeddings.embed).toHaveBeenCalledWith(['React Component\nconst App = () => <div>Hello</div>;']);
  });

  it('should search snippets by keyword', async () => {
    await tools.upsert({
      title: 'React Hook',
      content: 'useState hook example',
      language: 'typescript',
    });

    await tools.upsert({
      title: 'Vue Component',
      content: 'Vue 3 composition API',
      language: 'typescript',
    });

    const result = await tools.search({
      query: 'react',
      semantic: false,
    });

    expect(result.method).toBe('keyword');
    expect(result.count).toBe(1);
    expect(result.snippets[0].title).toBe('React Hook');
  });

  it('should search snippets semantically', async () => {
    await tools.upsert({
      title: 'React Hook',
      content: 'useState hook example',
      language: 'typescript',
      generateEmbedding: true,
    });

    const result = await tools.search({
      query: 'react hooks',
      semantic: true,
      topK: 5,
    });

    expect(result.method).toBe('semantic');
    expect(embeddings.embedQuery).toHaveBeenCalledWith('react hooks');
  });

  it('should export snippets', async () => {
    await tools.upsert({
      title: 'Test 1',
      content: 'content 1',
    });

    await tools.upsert({
      title: 'Test 2',
      content: 'content 2',
    });

    const result = await tools.exportSnippets({
      format: 'json',
    });

    expect(result.format).toBe('json');
    expect(result.data).toBeDefined();
    
    const parsed = JSON.parse(result.data);
    expect(parsed.snippets).toHaveLength(2);
  });

  it('should import snippets', async () => {
    const exportData = await tools.exportSnippets({ format: 'json' });
    
    // Clear storage
    storage = new SnippetStorage();
    tools = new SnippetTools(storage, embeddings);

    const result = await tools.importSnippets({
      data: exportData.data,
    });

    expect(result.success).toBe(true);
  });

  it('should update existing snippet', async () => {
    const first = await tools.upsert({
      title: 'Original',
      content: 'original content',
    });

    // Wait a bit to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const updated = await tools.upsert({
      id: first.snippet.id,
      title: 'Updated',
      content: 'updated content',
    });

    expect(updated.snippet.id).toBe(first.snippet.id);
    expect(updated.snippet.title).toBe('Updated');
    expect(updated.snippet.createdAt).toBe(first.snippet.createdAt);
    expect(new Date(updated.snippet.updatedAt).getTime()).toBeGreaterThan(
      new Date(first.snippet.updatedAt).getTime()
    );
  });
});

