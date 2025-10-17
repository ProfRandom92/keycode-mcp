import { Snippet, SnippetStore } from '../types/snippet.js';

export class SnippetStorage {
  private store: SnippetStore = {
    snippets: new Map(),
    embeddings: new Map(),
  };

  getAll(): Snippet[] {
    return Array.from(this.store.snippets.values());
  }

  getById(id: string): Snippet | undefined {
    return this.store.snippets.get(id);
  }

  upsert(snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Snippet {
    const now = new Date().toISOString();
    const id = snippet.id || this.generateId();
    const existing = this.store.snippets.get(id);

    const newSnippet: Snippet = {
      ...snippet,
      id,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    this.store.snippets.set(id, newSnippet);
    
    if (snippet.embedding) {
      this.store.embeddings.set(id, snippet.embedding);
    }

    return newSnippet;
  }

  delete(id: string): boolean {
    this.store.embeddings.delete(id);
    return this.store.snippets.delete(id);
  }

  search(query: string): Snippet[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(snippet => 
      snippet.title.toLowerCase().includes(lowerQuery) ||
      snippet.content.toLowerCase().includes(lowerQuery) ||
      snippet.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  semanticSearch(queryEmbedding: number[], topK: number = 5): Snippet[] {
    const scores: Array<{ id: string; score: number }> = [];

    for (const [id, embedding] of this.store.embeddings.entries()) {
      const score = this.cosineSimilarity(queryEmbedding, embedding);
      scores.push({ id, score });
    }

    scores.sort((a, b) => b.score - a.score);

    return scores
      .slice(0, topK)
      .map(({ id }) => this.store.snippets.get(id))
      .filter((s): s is Snippet => s !== undefined);
  }

  exportData(): string {
    const data = {
      snippets: Array.from(this.store.snippets.entries()),
      embeddings: Array.from(this.store.embeddings.entries()),
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      this.store.snippets = new Map(data.snippets || []);
      this.store.embeddings = new Map(data.embeddings || []);
    } catch (error) {
      throw new Error(`Failed to import data: ${error}`);
    }
  }

  private generateId(): string {
    return `snippet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }
}

