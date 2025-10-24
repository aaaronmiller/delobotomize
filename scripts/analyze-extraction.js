#!/usr/bin/env tsx
"use strict";
/**
 * Extraction Analysis Tool
 *
 * Analyzes the extracted artifacts and insights to identify:
 * - High-priority items for implementation
 * - Optimization candidates
 * - Prompt externalization opportunities
 * - Iterative design patterns
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtractionAnalyzer = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class ExtractionAnalyzer {
    extractionPath = './analysis/extracted';
    async analyze() {
        console.log('🔍 Analyzing extracted content...');
        // Load extraction results
        const result = await this.loadExtractionResults();
        // Analyze priorities
        const priorities = await this.analyzePriorities(result);
        // Identify prompt externalization opportunities
        const promptExternalization = await this.identifyPromptOpportunities(result);
        // Find optimization candidates
        const optimizationCandidates = await this.findOptimizationCandidates(result);
        // Generate implementation plan
        const implementationPlan = await this.generateImplementationPlan(result);
        const analysis = {
            priorities,
            promptExternalization,
            optimizationCandidates,
            implementationPlan
        };
        // Save analysis
        await this.saveAnalysis(analysis);
        console.log('✅ Analysis complete!');
        return analysis;
    }
    async loadExtractionResults() {
        const artifactsPath = path_1.default.join(this.extractionPath, 'artifacts.json');
        const insightsPath = path_1.default.join(this.extractionPath, 'insights.json');
        const artifacts = JSON.parse(await promises_1.default.readFile(artifactsPath, 'utf-8'));
        const insights = JSON.parse(await promises_1.default.readFile(insightsPath, 'utf-8'));
        return { artifacts, insights };
    }
    async analyzePriorities(result) {
        const priorities = {
            critical: [],
            high: [],
            medium: []
        };
        // Analyze artifacts by severity
        for (const artifact of result.artifacts) {
            const description = `${artifact.title}: ${artifact.description}`;
            switch (artifact.severity) {
                case 'critical':
                    priorities.critical.push(`[Artifact] ${description}`);
                    break;
                case 'high':
                    priorities.high.push(`[Artifact] ${description}`);
                    break;
                case 'medium':
                    priorities.medium.push(`[Artifact] ${description}`);
                    break;
            }
        }
        // Analyze actionable insights
        for (const insight of result.insights) {
            if (insight.actionable) {
                const description = `[${insight.type.toUpperCase()}] ${insight.content}`;
                if (insight.content.toLowerCase().includes('critical') ||
                    insight.content.toLowerCase().includes('urgent')) {
                    priorities.critical.push(description);
                }
                else if (insight.content.toLowerCase().includes('important')) {
                    priorities.high.push(description);
                }
                else {
                    priorities.medium.push(description);
                }
            }
        }
        // Remove duplicates
        return {
            critical: [...new Set(priorities.critical)],
            high: [...new Set(priorities.high)],
            medium: [...new Set(priorities.medium)]
        };
    }
    async identifyPromptOpportunities(result) {
        const prompts = [];
        // Look for process-oriented insights
        for (const insight of result.insights) {
            if (insight.type === 'process' ||
                insight.type === 'solution' ||
                insight.content.includes('approach') ||
                insight.content.includes('method')) {
                prompts.push({
                    name: `${insight.type}-${insight.id}`,
                    purpose: this.extractPromptPurpose(insight.content),
                    sourceId: insight.id,
                    meta: {
                        baseline_version: 'v1.0',
                        test_variations: [{
                                id: 'v1.1',
                                hypothesis: 'Adding examples improves accuracy',
                                changes: 'Include 3 classification examples',
                                expected_improvement: '+5% accuracy'
                            }]
                    }
                });
            }
        }
        // Look for artifact patterns
        for (const artifact of result.artifacts) {
            if (artifact.category === 'pattern' ||
                artifact.category === 'solution' ||
                artifact.codeBlocks.length > 0) {
                prompts.push({
                    name: `pattern-${artifact.id}`,
                    purpose: artifact.title,
                    sourceId: artifact.id,
                    meta: {
                        baseline_version: 'v1.0',
                        test_variations: [{
                                id: 'v1.1',
                                hypothesis: 'Refining examples reduces errors',
                                changes: 'Add error handling examples',
                                expected_improvement: '-10% errors'
                            }]
                    }
                });
            }
        }
        return { prompts: prompts.slice(0, 10) }; // Keep top 10
    }
    async findOptimizationCandidates(result) {
        const optimizationCandidates = {
            artifacts: [],
            insights: []
        };
        // Find artifacts with optimization potential
        for (const artifact of result.artifacts) {
            if (artifact.codeBlocks.length > 0 ||
                artifact.lessons.length > 2 ||
                artifact.severity === 'critical') {
                optimizationCandidates.artifacts.push(`${artifact.title} (${artifact.codeBlocks.length} code blocks, ${artifact.lessons.length} lessons)`);
            }
        }
        // Find insights with optimization potential
        for (const insight of result.insights) {
            if (insight.actionable &&
                (insight.type === 'solution' || insight.type === 'pattern')) {
                optimizationCandidates.insights.push(`${insight.content.substring(0, 100)}...`);
            }
        }
        return optimizationCandidates;
    }
    async generateImplementationPlan(result) {
        // Group artifacts and insights by theme
        const themes = this.groupByTheme(result);
        return [
            {
                phase: 0,
                tasks: [
                    'Set up prompt externalization infrastructure',
                    'Implement prompt loader with versioning',
                    'Create optimization metadata schema',
                    'Build initial knowledge graph'
                ],
                dependencies: ['Phase 0 extraction complete']
            },
            {
                phase: 1,
                tasks: [
                    'Implement core scanner/parser from Artifact #3',
                    'Build classifier from categorized insights',
                    'Create context preservation system',
                    'Set up iterative testing framework'
                ],
                dependencies: ['Phase 0 tasks complete']
            },
            {
                phase: 2,
                tasks: [
                    'Build analysis dashboard',
                    'Implement auto-optimization for prompts',
                    'Create meta-learning system',
                    'Develop context health metrics'
                ],
                dependencies: ['Phase 1 tasks complete']
            }
        ];
    }
    groupByTheme(result) {
        const themes = new Map();
        // Group by category/type
        for (const artifact of result.artifacts) {
            if (!themes.has(artifact.category)) {
                themes.set(artifact.category, []);
            }
            themes.get(artifact.category).push(artifact.title);
        }
        return Object.fromEntries(themes);
    }
    extractPromptPurpose(content) {
        // Extract the core purpose/pattern from the content
        if (content.includes('context collapse')) {
            return 'Prevent context collapse during AI sessions';
        }
        if (content.includes('pattern') || content.includes('approach')) {
            return 'Implement reusable solution pattern';
        }
        if (content.includes('step') || content.includes('process')) {
            return 'Guide through implementation process';
        }
        return content.substring(0, 100).trim();
    }
    async saveAnalysis(analysis) {
        await promises_1.default.writeFile(path_1.default.join(this.extractionPath, 'analysis.json'), JSON.stringify(analysis, null, 2));
        // Generate human-readable report
        const report = this.generateAnalysisReport(analysis);
        await promises_1.default.mkdir('.analysis', { recursive: true });
        await promises_1.default.writeFile(path_1.default.join('.analysis', 'PHASE0_ANALYSIS.md'), report);
    }
    generateAnalysisReport(analysis) {
        return `# Phase 0 Analysis Report
Generated: ${new Date().toISOString()}

## Priorities

### Critical (IMMEDIATE ATTENTION)
${analysis.priorities.critical.length > 0
            ? analysis.priorities.critical.map(p => `- ${p}`).join('\n')
            : '_None identified_'}

### High
${analysis.priorities.high.slice(0, 5).map(p => `- ${p}`).join('\n')}

### Medium
${analysis.priorities.medium.slice(0, 5).map(p => `- ${p}`).join('\n')}

## Prompt Externalization Opportunities

### Identified Prompts (${analysis.promptExternalization.prompts.length})
${analysis.promptExternalization.prompts.map(p => `#### ${p.name}
- **Purpose**: ${p.purpose}
- **Source**: ${p.sourceId}
- **Baseline**: ${p.meta.baseline_version}`).join('\n\n')}

## Optimization Candidates

### Artifacts (${analysis.optimizationCandidates.artifacts.length})
${analysis.optimizationCandidates.artifacts.map(a => `- ${a}`).join('\n')}

### Insights (${analysis.optimizationCandidates.insights.length})
${analysis.optimizationCandidates.insights.map(i => `- ${i}`).join('\n')}

## Implementation Plan

${analysis.implementationPlan.map(phase => `### Phase ${phase.phase}
Dependencies: ${phase.dependencies.join(', ')}

${phase.tasks.map(t => `- ${t}`).join('\n')}`).join('\n\n')}

## Next Steps

1. **Set up prompt externalization infrastructure**
   - Create \`prompts/\` directory structure
   - Implement \`src/core/prompt-loader.ts\`
   - Add versioning and metadata schemas

2. **Begin Phase 1 implementation**
   - Core scanner from Artifact #3
   - Classifier from insights
   - Context preservation system

3. **Establish optimization loop**
   - Run Phase 0 extraction regularly
   - Track prompt performance
   - Iteratively improve based on metrics

This analysis provides the foundation for implementing the Prompt-Layered Architecture discovered during the extraction process.
`;
    }
}
exports.ExtractionAnalyzer = ExtractionAnalyzer;
// Run analysis if called directly
if (require.main === module) {
    const analyzer = new ExtractionAnalyzer();
    analyzer.analyze().catch(console.error);
}
//# sourceMappingURL=analyze-extraction.js.map