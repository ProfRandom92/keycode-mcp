import { CohereClient } from 'cohere-ai';

export class EmbeddingsService {
  private client: CohereClient | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new CohereClient({ token: apiKey });
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!this.client) {
      throw new Error('COHERE_API_KEY not configured');
    }

    try {
      const response = await this.client.v2.embed({
        texts,
        model: 'embed-english-v3.0',
        inputType: 'search_document',
        embeddingTypes: ['float'],
      });

      return response.embeddings?.float || [];
    } catch (error) {
      throw new Error(`Embedding failed: ${error}`);
    }
  }

  async embedQuery(query: string): Promise<number[]> {
    if (!this.client) {
      throw new Error('COHERE_API_KEY not configured');
    }

    try {
      const response = await this.client.v2.embed({
        texts: [query],
        model: 'embed-english-v3.0',
        inputType: 'search_query',
        embeddingTypes: ['float'],
      });

      const embeddings = response.embeddings?.float || [];
      return embeddings[0] || [];
    } catch (error) {
      throw new Error(`Query embedding failed: ${error}`);
    }
  }
}

