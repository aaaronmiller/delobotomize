#!/usr/bin/env tsx
/**
 * Extraction Analysis Tool
 *
 * Analyzes the extracted artifacts and insights to identify:
 * - High-priority items for implementation
 * - Optimization candidates
 * - Prompt externalization opportunities
 * - Iterative design patterns
 */
interface AnalysisResult {
    priorities: {
        critical: string[];
        high: string[];
        medium: string[];
    };
    promptExternalization: {
        prompts: Array<{
            name: string;
            purpose: string;
            sourceId: string;
            meta: {
                baseline_version: string;
                test_variations: Array<{
                    id: string;
                    hypothesis: string;
                    changes: string;
                    expected_improvement: string;
                }>;
            };
        }>;
    };
    optimizationCandidates: {
        artifacts: string[];
        insights: string[];
    };
    implementationPlan: Array<{
        phase: number;
        tasks: string[];
        dependencies: string[];
    }>;
}
declare class ExtractionAnalyzer {
    private extractionPath;
    analyze(): Promise<AnalysisResult>;
    private loadExtractionResults;
    private analyzePriorities;
    private identifyPromptOpportunities;
    private findOptimizationCandidates;
    private generateImplementationPlan;
    private groupByTheme;
    private extractPromptPurpose;
    private saveAnalysis;
    private generateAnalysisReport;
}
export { ExtractionAnalyzer, type AnalysisResult };
//# sourceMappingURL=analyze-extraction.d.ts.map