/**
 * Context Manager
 *
 * Manages persistent context across sessions using:
 * - Knowledge graph for structured relationships
 * - Vector store for semantic search
 * - RAG chunking for optimal retrieval
 * - MCP server for IDE integration
 *
 * Prevents context loss by maintaining a persistent memory bank
 * that survives across AI sessions.
 */

import fs from 'fs/promises';
import path from 'path';
import { KnowledgeGraphBuilder, KnowledgeNode } from './knowledge-graph';
import { VectorStore, VectorDocument } from './vector-store';
import { TextChunker, TextChunk } from './chunking';
import { MCPServer } from './mcp-server';
import { ILLMProvider } from '../llm/provider-interface';

export interface ContextManagerOptions {
  projectPath: string;
  memoryPath?: string;
  enableMCP?: boolean;
  llmProvider?: ILLMProvider;
  vectorStorePath?: string;
  knowledgeGraphPath?: string;
}

export interface MemorySnapshot {
  timestamp: string;
  knowledgeGraph: string;
  vectorStore: string;
  metadata: {
    projectPath: string;
    version: string;
    totalNodes: number;
    totalDocuments: number;
  };
}

/**
 * Central context management system
 *
 * Coordinates all memory components to provide persistent,
 * searchable project context that prevents information loss.
 */
export class ContextManager {
  private projectPath: string;
  private memoryPath: string;
  private knowledgeGraph: KnowledgeGraphBuilder;
  private vectorStore: VectorStore;
  private textChunker: TextChunker;
  private mcpServer?: MCPServer;
  private llmProvider?: ILLMProvider;

  constructor(options: ContextManagerOptions) {
    this.projectPath = options.projectPath;
    this.memoryPath = options.memoryPath || path.join(options.projectPath, '.delobotomize', 'memory');
    this.knowledgeGraph = new KnowledgeGraphBuilder();
    this.vectorStore = new VectorStore();
    this.textChunker = new TextChunker();
    this.llmProvider = options.llmProvider;

    if (options.enableMCP) {
      this.mcpServer = new MCPServer(
        this.projectPath,
        this.knowledgeGraph,
        this.vectorStore
      );
    }
  }

  /**
   * Initialize the context manager
   * Loads existing memory if available
   */
  async initialize(): Promise<void> {
    console.log('🧠 Initializing context manager...');

    // Create memory directory if it doesn't exist
    await fs.mkdir(this.memoryPath, { recursive: true });

    // Try to load existing memory
    const loaded = await this.loadMemory();

    if (loaded) {
      console.log('   ✓ Loaded existing memory');
    } else {
      console.log('   ✓ Created new memory');
    }

    // Start MCP server if enabled
    if (this.mcpServer) {
      await this.mcpServer.start();
    }
  }

  /**
   * Add content to memory
   *
   * This processes text through the RAG pipeline and stores it
   * in both the knowledge graph and vector store.
   */
  async addToMemory(content: {
    id: string;
    type: 'artifact' | 'insight' | 'symptom' | 'pattern' | 'solution';
    text: string;
    metadata: {
      source: string;
      section?: string;
      severity?: 'critical' | 'high' | 'medium' | 'low';
      confidence?: number;
    };
  }): Promise<void> {
    // Add to knowledge graph
    const node: KnowledgeNode = {
      id: content.id,
      type: content.type,
      content: content.text,
      metadata: {
        ...content.metadata,
        date: new Date().toISOString()
      }
    };

    this.knowledgeGraph.addNode(node);

    // Process through RAG pipeline and add to vector store
    const chunks = await this.textChunker.processForRAG(
      content.text,
      content.id,
      {
        strategy: 'sentence', // Use sentence-based chunking for coherence
        preserveContext: true
      }
    );

    // Convert chunks to vector documents
    for (const chunk of chunks) {
      const embedding = await this.generateEmbedding(chunk.content);

      const vectorDoc: VectorDocument = {
        id: chunk.chunk_id,
        content: chunk.content,
        embedding,
        metadata: {
          ...chunk.metadata,
          originalNodeId: content.id,
          nodeType: content.type
        }
      };

      await this.vectorStore.addDocument(vectorDoc);
    }
  }

  /**
   * Search memory semantically
   */
  async search(query: string, options?: {
    topK?: number;
    filterByType?: string;
    filterBySeverity?: string;
  }): Promise<Array<{
    content: string;
    similarity: number;
    metadata: any;
  }>> {
    const queryEmbedding = await this.generateEmbedding(query);

    const results = await this.vectorStore.search(queryEmbedding, {
      topK: options?.topK || 5,
      filter: options?.filterByType
        ? (doc) => doc.metadata.nodeType === options.filterByType
        : undefined
    });

    return results.map(r => ({
      content: r.document.content,
      similarity: r.similarity,
      metadata: r.document.metadata
    }));
  }

  /**
   * Get related information from knowledge graph
   */
  getRelated(nodeId: string) {
    return this.knowledgeGraph.findRelated(nodeId);
  }

  /**
   * Find nodes by type
   */
  findByType(type: string): KnowledgeNode[] {
    return this.knowledgeGraph.findByType(type);
  }

  /**
   * Find nodes by severity
   */
  findBySeverity(severity: string): KnowledgeNode[] {
    return this.knowledgeGraph.findBySeverity(severity);
  }

  /**
   * Save memory to disk
   */
  async saveMemory(): Promise<void> {
    const snapshot: MemorySnapshot = {
      timestamp: new Date().toISOString(),
      knowledgeGraph: this.knowledgeGraph.toJSON(),
      vectorStore: this.vectorStore.toJSON(),
      metadata: {
        projectPath: this.projectPath,
        version: '1.0',
        totalNodes: this.knowledgeGraph.getGraph().nodes.size,
        totalDocuments: this.vectorStore.getAllDocuments().length
      }
    };

    const snapshotPath = path.join(this.memoryPath, 'snapshot.json');
    await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));

    console.log(`💾 Memory saved to ${snapshotPath}`);
  }

  /**
   * Load memory from disk
   */
  async loadMemory(): Promise<boolean> {
    try {
      const snapshotPath = path.join(this.memoryPath, 'snapshot.json');
      const content = await fs.readFile(snapshotPath, 'utf-8');
      const snapshot: MemorySnapshot = JSON.parse(content);

      // Restore knowledge graph
      this.knowledgeGraph = KnowledgeGraphBuilder.fromJSON(snapshot.knowledgeGraph);

      // Restore vector store
      this.vectorStore = VectorStore.fromJSON(snapshot.vectorStore);

      console.log(`📂 Loaded memory from ${snapshot.timestamp}`);
      console.log(`   Nodes: ${snapshot.metadata.totalNodes}`);
      console.log(`   Documents: ${snapshot.metadata.totalDocuments}`);

      return true;
    } catch (error) {
      // No existing memory, which is fine
      return false;
    }
  }

  /**
   * Get memory statistics
   */
  getStatistics() {
    return {
      knowledgeGraph: this.knowledgeGraph.getStatistics(),
      vectorStore: this.vectorStore.getStatistics(),
      memoryPath: this.memoryPath
    };
  }

  /**
   * Clear all memory
   */
  async clearMemory(): Promise<void> {
    this.knowledgeGraph = new KnowledgeGraphBuilder();
    this.vectorStore.clear();

    console.log('🗑️  Memory cleared');
  }

  /**
   * Stop the context manager
   */
  async stop(): Promise<void> {
    // Save memory before stopping
    await this.saveMemory();

    // Stop MCP server if running
    if (this.mcpServer) {
      await this.mcpServer.stop();
    }

    console.log('🧠 Context manager stopped');
  }

  /**
   * Get MCP server instance
   */
  getMCPServer(): MCPServer | undefined {
    return this.mcpServer;
  }

  // Private helper methods

  /**
   * Generate embedding for text using the configured LLM provider
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Use LLM provider if available and supports embeddings
    if (this.llmProvider && this.llmProvider.supportsEmbeddings) {
      try {
        const response = await this.llmProvider.embed({ text });
        return response.embeddings[0];
      } catch (error) {
        console.warn('Failed to generate embedding via LLM provider, using fallback');
      }
    }

    // Fallback: Simple deterministic pseudo-embedding for testing
    const dimension = 384;
    const embedding = new Array(dimension).fill(0);

    for (let i = 0; i < text.length && i < dimension; i++) {
      embedding[i % dimension] += text.charCodeAt(i) / 1000;
    }

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (norm || 1));
  }

  /**
   * Search memory with better interface
   */
  async searchMemory(query: string, options?: {
    topK?: number;
    nodeType?: string;
    minSimilarity?: number;
  }): Promise<Array<{
    id: string;
    type: string;
    content: string;
    similarity: number;
    metadata: any;
  }>> {
    const queryEmbedding = await this.generateEmbedding(query);

    const results = await this.vectorStore.search(queryEmbedding, {
      topK: options?.topK || 10,
      minSimilarity: options?.minSimilarity || 0.5,
      filter: options?.nodeType
        ? (doc) => doc.metadata.nodeType === options.nodeType
        : undefined
    });

    return results.map(r => ({
      id: r.document.metadata.originalNodeId || r.document.id,
      type: r.document.metadata.nodeType || 'unknown',
      content: r.document.content,
      similarity: r.similarity,
      metadata: r.document.metadata
    }));
  }

  /**
   * Get memory statistics for CLI reporting
   */
  async getMemoryStats() {
    const graph = this.knowledgeGraph.getGraph();
    const allDocs = this.vectorStore.getAllDocuments();

    const nodesByType: Record<string, number> = {};
    const nodesBySeverity: Record<string, number> = {};

    graph.nodes.forEach(node => {
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
      if (node.metadata.severity) {
        nodesBySeverity[node.metadata.severity] = (nodesBySeverity[node.metadata.severity] || 0) + 1;
      }
    });

    return {
      totalNodes: graph.nodes.size,
      totalEdges: graph.edges.length,
      vectorDocuments: allDocs.length,
      nodesByType,
      nodesBySeverity
    };
  }

  /**
   * Export snapshot for CLI
   */
  async exportSnapshot() {
    return {
      timestamp: new Date().toISOString(),
      knowledgeGraph: this.knowledgeGraph.toJSON(),
      vectorStore: this.vectorStore.toJSON(),
      metadata: {
        projectPath: this.projectPath,
        version: '1.0',
        totalNodes: this.knowledgeGraph.getGraph().nodes.size,
        totalDocuments: this.vectorStore.getAllDocuments().length
      }
    };
  }
}

/**
 * Create and initialize a context manager
 */
export async function createContextManager(
  options: ContextManagerOptions
): Promise<ContextManager> {
  const manager = new ContextManager(options);
  await manager.initialize();
  return manager;
}