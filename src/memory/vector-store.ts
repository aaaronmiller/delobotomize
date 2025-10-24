/**
 * Vector Store for Semantic Search
 *
 * Provides vector embeddings and similarity search for RAG.
 * Uses cosine similarity to find semantically related content.
 *
 * From RAG.md: "it's actually looking for what's called cosine similarity
 * and finding the nearest neighbors in vector space"
 */

import { TextChunk } from './chunking';

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export interface SearchResult {
  document: VectorDocument;
  similarity: number;
  rank: number;
}

/**
 * Simple in-memory vector store with cosine similarity search
 *
 * Note: This is a basic implementation. Production systems would use:
 * - Pinecone, Weaviate, or Qdrant for scalable vector DB
 * - OpenAI, Cohere, or local models for embeddings
 */
export class VectorStore {
  private documents: Map<string, VectorDocument> = new Map();
  private embeddingDimension: number = 384; // Standard for many models

  /**
   * Add a document with its embedding to the store
   */
  async addDocument(doc: VectorDocument): Promise<void> {
    if (doc.embedding.length !== this.embeddingDimension) {
      throw new Error(
        `Embedding dimension mismatch: expected ${this.embeddingDimension}, got ${doc.embedding.length}`
      );
    }

    this.documents.set(doc.id, doc);
  }

  /**
   * Add multiple documents in batch
   */
  async addDocuments(docs: VectorDocument[]): Promise<void> {
    for (const doc of docs) {
      await this.addDocument(doc);
    }
  }

  /**
   * Search for similar documents using cosine similarity
   */
  async search(
    queryEmbedding: number[],
    options: {
      topK?: number;
      filter?: (doc: VectorDocument) => boolean;
      minSimilarity?: number;
    } = {}
  ): Promise<SearchResult[]> {
    const topK = options.topK || 5;
    const minSimilarity = options.minSimilarity || 0.0;

    const results: SearchResult[] = [];

    for (const doc of this.documents.values()) {
      // Apply filter if provided
      if (options.filter && !options.filter(doc)) {
        continue;
      }

      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);

      if (similarity >= minSimilarity) {
        results.push({
          document: doc,
          similarity,
          rank: 0 // Will be set after sorting
        });
      }
    }

    // Sort by similarity (highest first)
    results.sort((a, b) => b.similarity - a.similarity);

    // Limit to topK and set ranks
    const topResults = results.slice(0, topK);
    topResults.forEach((result, index) => {
      result.rank = index + 1;
    });

    return topResults;
  }

  /**
   * Search by text query (requires embedding generation)
   *
   * Note: In production, this would call an embedding API
   */
  async searchByText(
    query: string,
    options?: {
      topK?: number;
      filter?: (doc: VectorDocument) => boolean;
    }
  ): Promise<SearchResult[]> {
    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);

    return this.search(queryEmbedding, options);
  }

  /**
   * Get document by ID
   */
  getDocument(id: string): VectorDocument | undefined {
    return this.documents.get(id);
  }

  /**
   * Delete document by ID
   */
  deleteDocument(id: string): boolean {
    return this.documents.delete(id);
  }

  /**
   * Get all documents
   */
  getAllDocuments(): VectorDocument[] {
    return Array.from(this.documents.values());
  }

  /**
   * Get statistics about the vector store
   */
  getStatistics() {
    return {
      totalDocuments: this.documents.size,
      embeddingDimension: this.embeddingDimension,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Clear all documents
   */
  clear(): void {
    this.documents.clear();
  }

  /**
   * Export vector store to JSON
   */
  toJSON(): string {
    return JSON.stringify({
      documents: Array.from(this.documents.entries()),
      embeddingDimension: this.embeddingDimension
    });
  }

  /**
   * Import vector store from JSON
   */
  static fromJSON(json: string): VectorStore {
    const data = JSON.parse(json);
    const store = new VectorStore();

    store.embeddingDimension = data.embeddingDimension;
    store.documents = new Map(data.documents);

    return store;
  }

  // Private methods

  /**
   * Calculate cosine similarity between two vectors
   *
   * Formula: cos(θ) = (A · B) / (||A|| × ||B||)
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Generate embedding for text
   *
   * Note: This is a placeholder. In production, use:
   * - OpenAI embeddings API
   * - Cohere embeddings
   * - Local models (sentence-transformers, etc.)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Simple deterministic "embedding" for testing
    // In production, replace with actual embedding API call
    const embedding = new Array(this.embeddingDimension).fill(0);

    // Very basic character-based pseudo-embedding
    for (let i = 0; i < text.length && i < this.embeddingDimension; i++) {
      embedding[i % this.embeddingDimension] += text.charCodeAt(i) / 1000;
    }

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  }

  /**
   * Estimate memory usage in MB
   */
  private estimateMemoryUsage(): number {
    const docsCount = this.documents.size;
    const bytesPerNumber = 8; // Float64
    const embeddingBytes = this.embeddingDimension * bytesPerNumber;
    const avgMetadataBytes = 200; // Rough estimate
    const avgContentBytes = 500; // Rough estimate

    const totalBytes = docsCount * (embeddingBytes + avgMetadataBytes + avgContentBytes);
    return totalBytes / (1024 * 1024); // Convert to MB
  }
}

/**
 * Helper function to convert text chunks to vector documents
 */
export async function chunksToVectorDocs(
  chunks: TextChunk[],
  generateEmbedding: (text: string) => Promise<number[]>
): Promise<VectorDocument[]> {
  const docs: VectorDocument[] = [];

  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content);

    docs.push({
      id: chunk.chunk_id,
      content: chunk.content,
      embedding,
      metadata: chunk.metadata
    });
  }

  return docs;
}