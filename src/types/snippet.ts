export interface Snippet {
  id: string;
  title: string;
  content: string;
  language?: string;
  tags?: string[];
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface SnippetStore {
  snippets: Map<string, Snippet>;
  embeddings: Map<string, number[]>;
}

