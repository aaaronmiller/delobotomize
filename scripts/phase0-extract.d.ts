#!/usr/bin/env tsx
/**
 * Phase 0 Extraction Pipeline
 *
 * Programmatically extracts structured content from source materials:
 * - ARTIFACTS.md → structured artifacts JSON
 * - CONVERSATION_TRANSCRIPT.md → structured insights JSON
 * - Cross-references and knowledge base generation
 */
interface Artifact {
    id: string;
    title: string;
    description: string;
    codeBlocks: Array<{
        language: string;
        content: string;
        filename?: string;
        lineStart: number;
        lineEnd: number;
    }>;
    lessons: string[];
    contextLines: string[];
    sourceLocation: {
        file: string;
        startLine: number;
        endLine: number;
    };
    tags: string[];
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
}
interface Insight {
    id: string;
    type: 'problem' | 'solution' | 'pattern' | 'metaphor' | 'terminology' | 'process';
    content: string;
    context: string;
    speaker?: string;
    timestamp?: string;
    sourceLocation: {
        file: string;
        startLine: number;
        endLine: number;
    };
    relatedArtifacts: string[];
    actionable: boolean;
    verified: boolean;
}
interface ExtractionResult {
    artifacts: Artifact[];
    insights: Insight[];
    crossReferences: Array<{
        insightId: string;
        artifactId: string;
        relationship: 'explains' | 'exemplifies' | 'solves' | 'relates_to';
        confidence: number;
    }>;
    knowledgeGraph: {
        concepts: string[];
        relationships: Array<{
            from: string;
            to: string;
            type: string;
            weight: number;
        }>;
    };
}
declare class Phase0Extractor {
    private artifactsPath;
    private transcriptPath;
    private outputPath;
    extractAll(): Promise<ExtractionResult>;
    private extractArtifacts;
    private extractInsights;
    private generateCrossReferences;
    private buildKnowledgeGraph;
    private finalizeArtifact;
    private extractFileName;
    private isActionable;
    private calculateRelationship;
    private determineRelationship;
    private extractKeywords;
    private saveExtractionResults;
    private generateSummaryReport;
}
export { Phase0Extractor, type ExtractionResult, type Artifact, type Insight };
//# sourceMappingURL=phase0-extract.d.ts.map