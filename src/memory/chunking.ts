/**
 * RAG Chunking Strategies
 *
 * Implements the four core chunking methods from RAG.md:
 * 1. Fixed-Size Chunking
 * 2. Sentence-Based Chunking
 * 3. Semantic Chunking
 * 4. Recursive Hierarchical Chunking
 *
 * Based on the 10-step processing pipeline:
 * - Convert to text with appropriate parser
 * - Split into sections
 * - Remove boilerplate
 * - Normalize whitespace
 * - Extract section titles
 * - Add metadata
 * - Chunk with overlap
 * - Embed the chunks
 * - Verify samples
 * - Iterate
 */

export interface TextChunk {
  chunk_id: string;
  content: string;
  metadata: {
    source_doc_id: string;
    chunk_type: 'fixed_size' | 'sentence_based' | 'semantic' | 'hierarchical';
    section?: string;
    date_processed: string;
    sequence_number?: number;
    start_char?: number;
    end_char?: number;
  };
  embedding?: number[];
}

export interface ChunkingOptions {
  strategy: 'fixed' | 'sentence' | 'semantic' | 'hierarchical';
  maxTokens?: number;
  overlapTokens?: number;
  preserveContext?: boolean;
}

/**
 * Text chunking strategies for RAG optimization
 */
export class TextChunker {
  /**
   * Method 1: Fixed-Size Chunking
   *
   * Divides text into chunks of predetermined size with overlap.
   * Fast but may break context mid-sentence.
   */
  fixedSizeChunk(
    text: string,
    sourceDocId: string,
    options: {
      sizeTokens?: number;
      overlapTokens?: number;
    } = {}
  ): TextChunk[] {
    const sizeTokens = options.sizeTokens || 512;
    const overlapTokens = options.overlapTokens || 50;

    // Simple token estimation (words as proxy)
    const words = text.split(/\s+/);
    const chunks: TextChunk[] = [];

    let sequenceNumber = 0;
    let startIdx = 0;

    while (startIdx < words.length) {
      const endIdx = Math.min(startIdx + sizeTokens, words.length);
      const chunkWords = words.slice(startIdx, endIdx);
      const content = chunkWords.join(' ');

      chunks.push({
        chunk_id: `fixed_${sourceDocId}_${sequenceNumber}`,
        content,
        metadata: {
          source_doc_id: sourceDocId,
          chunk_type: 'fixed_size',
          sequence_number: sequenceNumber,
          start_char: startIdx,
          end_char: endIdx,
          date_processed: new Date().toISOString()
        }
      });

      sequenceNumber++;
      startIdx = endIdx - overlapTokens;
    }

    return chunks;
  }

  /**
   * Method 2: Sentence-Based Chunking
   *
   * Respects linguistic boundaries by keeping sentences intact.
   * Improves readability and semantic coherence.
   */
  sentenceBasedChunk(
    text: string,
    sourceDocId: string,
    options: {
      sentencesPerChunk?: number;
    } = {}
  ): TextChunk[] {
    const sentencesPerChunk = options.sentencesPerChunk || 5;

    // Split into sentences (simple regex, can be enhanced with NLP library)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: TextChunk[] = [];

    let sequenceNumber = 0;
    let startIdx = 0;

    while (startIdx < sentences.length) {
      const endIdx = Math.min(startIdx + sentencesPerChunk, sentences.length);
      const chunkSentences = sentences.slice(startIdx, endIdx);
      const content = chunkSentences.join(' ').trim();

      chunks.push({
        chunk_id: `sentence_${sourceDocId}_${sequenceNumber}`,
        content,
        metadata: {
          source_doc_id: sourceDocId,
          chunk_type: 'sentence_based',
          section: `Sentences ${startIdx}-${endIdx}`,
          date_processed: new Date().toISOString(),
          sequence_number: sequenceNumber,
          start_char: startIdx,
          end_char: endIdx
        }
      });

      sequenceNumber++;
      startIdx = endIdx;
    }

    return chunks;
  }

  /**
   * Method 3: Semantic Chunking
   *
   * Groups text based on topical coherence.
   * Ensures each chunk represents a cohesive idea.
   *
   * Note: This is a simplified version. Full implementation would use
   * embeddings and cosine similarity to detect topic shifts.
   */
  semanticChunk(
    text: string,
    sourceDocId: string,
    options: {
      minSimilarity?: number;
    } = {}
  ): TextChunk[] {
    // Simplified semantic chunking based on paragraph breaks and headings
    const sections = this.splitIntoSemanticSections(text);
    const chunks: TextChunk[] = [];

    let sequenceNumber = 0;

    for (const section of sections) {
      if (section.content.trim().length === 0) continue;

      chunks.push({
        chunk_id: `semantic_${sourceDocId}_${sequenceNumber}`,
        content: section.content,
        metadata: {
          source_doc_id: sourceDocId,
          chunk_type: 'semantic',
          section: section.title || 'Untitled Section',
          date_processed: new Date().toISOString(),
          sequence_number: sequenceNumber
        }
      });

      sequenceNumber++;
    }

    return chunks;
  }

  /**
   * Method 4: Recursive Hierarchical Chunking
   *
   * Preserves document structure with parent-child relationships.
   * Maintains headings, subheadings, and hierarchical context.
   */
  hierarchicalChunk(
    text: string,
    sourceDocId: string,
    options: {
      maxDepth?: number;
    } = {}
  ): TextChunk[] {
    const maxDepth = options.maxDepth || 3;
    const hierarchy = this.parseHierarchy(text, maxDepth);
    const chunks: TextChunk[] = [];

    let sequenceNumber = 0;

    const traverse = (node: HierarchyNode, parentPath: string = '') => {
      const currentPath = parentPath ? `${parentPath} > ${node.title}` : node.title;

      // Create chunk for this node
      chunks.push({
        chunk_id: `hierarchical_${sourceDocId}_${sequenceNumber}`,
        content: node.content,
        metadata: {
          source_doc_id: sourceDocId,
          chunk_type: 'hierarchical',
          section: currentPath,
          date_processed: new Date().toISOString(),
          sequence_number: sequenceNumber
        }
      });

      sequenceNumber++;

      // Recursively process children
      for (const child of node.children) {
        traverse(child, currentPath);
      }
    };

    for (const rootNode of hierarchy) {
      traverse(rootNode);
    }

    return chunks;
  }

  /**
   * Apply the 10-step RAG processing pipeline
   */
  async processForRAG(
    text: string,
    sourceDocId: string,
    options: ChunkingOptions
  ): Promise<TextChunk[]> {
    // Step 1: Text already provided
    let processedText = text;

    // Step 2-4: Clean text
    processedText = this.removeBoilerplate(processedText);
    processedText = this.normalizeWhitespace(processedText);

    // Step 5-7: Chunk with selected strategy
    let chunks: TextChunk[];

    switch (options.strategy) {
      case 'fixed':
        chunks = this.fixedSizeChunk(processedText, sourceDocId, {
          sizeTokens: options.maxTokens,
          overlapTokens: options.overlapTokens
        });
        break;

      case 'sentence':
        chunks = this.sentenceBasedChunk(processedText, sourceDocId);
        break;

      case 'semantic':
        chunks = this.semanticChunk(processedText, sourceDocId);
        break;

      case 'hierarchical':
        chunks = this.hierarchicalChunk(processedText, sourceDocId);
        break;

      default:
        chunks = this.sentenceBasedChunk(processedText, sourceDocId);
    }

    // Step 8: Embeddings would be added by vector store
    // Step 9-10: Verification and iteration handled by caller

    return chunks;
  }

  // Private helper methods

  private removeBoilerplate(text: string): string {
    // Remove common boilerplate patterns
    let cleaned = text;

    // Remove page numbers
    cleaned = cleaned.replace(/Page \d+ of \d+/gi, '');

    // Remove common footer/header patterns
    cleaned = cleaned.replace(/\n\s*\d+\s*\n/g, '\n');

    return cleaned;
  }

  private normalizeWhitespace(text: string): string {
    return text
      .replace(/\r\n/g, '\n')           // Normalize line endings
      .replace(/[ \t]+/g, ' ')          // Normalize spaces
      .replace(/\n{3,}/g, '\n\n')       // Normalize multiple newlines
      .trim();
  }

  private splitIntoSemanticSections(text: string): Array<{ title?: string; content: string }> {
    const sections: Array<{ title?: string; content: string }> = [];

    // Split by markdown headings or double newlines
    const parts = text.split(/(?=^#{1,6}\s)/m);

    for (const part of parts) {
      const titleMatch = part.match(/^(#{1,6})\s+(.+)/);

      if (titleMatch) {
        const title = titleMatch[2];
        const content = part.substring(titleMatch[0].length).trim();
        sections.push({ title, content });
      } else {
        sections.push({ content: part.trim() });
      }
    }

    return sections.filter(s => s.content.length > 0);
  }

  private parseHierarchy(text: string, maxDepth: number): HierarchyNode[] {
    const lines = text.split('\n');
    const root: HierarchyNode[] = [];
    const stack: Array<{ node: HierarchyNode; level: number }> = [];

    let currentContent: string[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)/);

      if (headingMatch) {
        const level = headingMatch[1].length;
        const title = headingMatch[2];

        // Save accumulated content to previous node
        if (stack.length > 0 && currentContent.length > 0) {
          stack[stack.length - 1].node.content = currentContent.join('\n').trim();
          currentContent = [];
        }

        const node: HierarchyNode = {
          title,
          level,
          content: '',
          children: []
        };

        // Find parent node
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        if (stack.length === 0) {
          root.push(node);
        } else {
          stack[stack.length - 1].node.children.push(node);
        }

        stack.push({ node, level });
      } else {
        currentContent.push(line);
      }
    }

    // Save final accumulated content
    if (stack.length > 0 && currentContent.length > 0) {
      stack[stack.length - 1].node.content = currentContent.join('\n').trim();
    }

    return root;
  }
}

interface HierarchyNode {
  title: string;
  level: number;
  content: string;
  children: HierarchyNode[];
}