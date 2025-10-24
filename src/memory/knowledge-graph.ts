/**
 * Knowledge Graph Builder
 *
 * Creates a structured knowledge graph from extraction results
 * to enable semantic search and context retrieval.
 *
 * Based on RAG.md principles:
 * - Metadata enhancement for improved retrieval
 * - Semantic relationships between concepts
 * - Hierarchical structure preservation
 */

export interface KnowledgeNode {
  id: string;
  type: 'artifact' | 'insight' | 'symptom' | 'pattern' | 'solution';
  content: string;
  metadata: {
    source: string;
    section?: string;
    date: string;
    severity?: 'critical' | 'high' | 'medium' | 'low';
    confidence?: number;
  };
  embedding?: number[]; // Vector representation for semantic search
}

export interface KnowledgeEdge {
  from: string;
  to: string;
  relationship: 'solves' | 'causes' | 'relates_to' | 'exemplifies' | 'contradicts';
  weight: number;
  metadata?: {
    discovered_at: string;
    confidence: number;
  };
}

export interface KnowledgeGraph {
  nodes: Map<string, KnowledgeNode>;
  edges: KnowledgeEdge[];
  index: {
    byType: Map<string, string[]>;
    bySeverity: Map<string, string[]>;
    bySource: Map<string, string[]>;
  };
}

/**
 * Builds and manages the knowledge graph from extraction results
 */
export class KnowledgeGraphBuilder {
  private graph: KnowledgeGraph;

  constructor() {
    this.graph = {
      nodes: new Map(),
      edges: [],
      index: {
        byType: new Map(),
        bySeverity: new Map(),
        bySource: new Map()
      }
    };
  }

  /**
   * Add a node to the knowledge graph
   */
  addNode(node: KnowledgeNode): void {
    this.graph.nodes.set(node.id, node);

    // Update indices
    this.updateIndex('byType', node.type, node.id);

    if (node.metadata.severity) {
      this.updateIndex('bySeverity', node.metadata.severity, node.id);
    }

    this.updateIndex('bySource', node.metadata.source, node.id);
  }

  /**
   * Add an edge (relationship) between nodes
   */
  addEdge(edge: KnowledgeEdge): void {
    // Verify both nodes exist
    if (!this.graph.nodes.has(edge.from) || !this.graph.nodes.has(edge.to)) {
      throw new Error(`Cannot create edge: Node ${edge.from} or ${edge.to} not found`);
    }

    this.graph.edges.push(edge);
  }

  /**
   * Find nodes by type
   */
  findByType(type: string): KnowledgeNode[] {
    const nodeIds = this.graph.index.byType.get(type) || [];
    return nodeIds.map(id => this.graph.nodes.get(id)!).filter(Boolean);
  }

  /**
   * Find nodes by severity
   */
  findBySeverity(severity: string): KnowledgeNode[] {
    const nodeIds = this.graph.index.bySeverity.get(severity) || [];
    return nodeIds.map(id => this.graph.nodes.get(id)!).filter(Boolean);
  }

  /**
   * Find related nodes (neighbors in the graph)
   */
  findRelated(nodeId: string): Array<{ node: KnowledgeNode; relationship: string; weight: number }> {
    const related: Array<{ node: KnowledgeNode; relationship: string; weight: number }> = [];

    for (const edge of this.graph.edges) {
      if (edge.from === nodeId) {
        const node = this.graph.nodes.get(edge.to);
        if (node) {
          related.push({
            node,
            relationship: edge.relationship,
            weight: edge.weight
          });
        }
      } else if (edge.to === nodeId) {
        const node = this.graph.nodes.get(edge.from);
        if (node) {
          related.push({
            node,
            relationship: edge.relationship,
            weight: edge.weight
          });
        }
      }
    }

    // Sort by weight (highest first)
    return related.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Get the full knowledge graph
   */
  getGraph(): KnowledgeGraph {
    return this.graph;
  }

  /**
   * Export graph to JSON for persistence
   */
  toJSON(): string {
    return JSON.stringify({
      nodes: Array.from(this.graph.nodes.entries()),
      edges: this.graph.edges,
      index: {
        byType: Array.from(this.graph.index.byType.entries()),
        bySeverity: Array.from(this.graph.index.bySeverity.entries()),
        bySource: Array.from(this.graph.index.bySource.entries())
      }
    }, null, 2);
  }

  /**
   * Import graph from JSON
   */
  static fromJSON(json: string): KnowledgeGraphBuilder {
    const data = JSON.parse(json);
    const builder = new KnowledgeGraphBuilder();

    // Restore nodes
    for (const [id, node] of data.nodes) {
      builder.graph.nodes.set(id, node as KnowledgeNode);
    }

    // Restore edges
    builder.graph.edges = data.edges;

    // Restore indices
    builder.graph.index.byType = new Map(data.index.byType);
    builder.graph.index.bySeverity = new Map(data.index.bySeverity);
    builder.graph.index.bySource = new Map(data.index.bySource);

    return builder;
  }

  // Private helper methods

  private updateIndex(indexName: keyof KnowledgeGraph['index'], key: string, nodeId: string): void {
    const index = this.graph.index[indexName];
    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key)!.push(nodeId);
  }

  /**
   * Calculate graph statistics
   */
  getStatistics() {
    return {
      totalNodes: this.graph.nodes.size,
      totalEdges: this.graph.edges.length,
      nodesByType: Object.fromEntries(this.graph.index.byType),
      nodesBySeverity: Object.fromEntries(this.graph.index.bySeverity),
      averageConnections: this.graph.edges.length / Math.max(this.graph.nodes.size, 1)
    };
  }
}