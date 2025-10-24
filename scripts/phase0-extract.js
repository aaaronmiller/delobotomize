#!/usr/bin/env tsx
"use strict";
/**
 * Phase 0 Extraction Pipeline
 *
 * Programmatically extracts structured content from source materials:
 * - ARTIFACTS.md → structured artifacts JSON
 * - CONVERSATION_TRANSCRIPT.md → structured insights JSON
 * - Cross-references and knowledge base generation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phase0Extractor = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class Phase0Extractor {
    artifactsPath = './ARTIFACTS.md';
    transcriptPath = './CONVERSATION_TRANSCRIPT.md';
    outputPath = './analysis/extracted';
    async extractAll() {
        console.log('🔧 Starting Phase 0 extraction...');
        await promises_1.default.mkdir(this.outputPath, { recursive: true });
        // Extract artifacts
        console.log('📦 Extracting artifacts...');
        const artifacts = await this.extractArtifacts();
        // Extract insights
        console.log('💡 Extracting insights...');
        const insights = await this.extractInsights();
        // Generate cross-references
        console.log('🔗 Generating cross-references...');
        const crossReferences = await this.generateCrossReferences(artifacts, insights);
        // Build knowledge graph
        console.log('🕸️  Building knowledge graph...');
        const knowledgeGraph = await this.buildKnowledgeGraph(artifacts, insights);
        const result = {
            artifacts,
            insights,
            crossReferences,
            knowledgeGraph
        };
        // Save results
        await this.saveExtractionResults(result);
        console.log('✅ Phase 0 extraction complete!');
        console.log(`   - ${artifacts.length} artifacts extracted`);
        console.log(`   - ${insights.length} insights extracted`);
        console.log(`   - ${crossReferences.length} cross-references generated`);
        return result;
    }
    async extractArtifacts() {
        const content = await promises_1.default.readFile(this.artifactsPath, 'utf-8');
        const lines = content.split('\n');
        const artifacts = [];
        let currentArtifact = null;
        let artifactCount = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Detect artifact headers - Multiple patterns for flexibility
            const artifactMatch = line.match(/^(#{1,3})\s*Artifact\s+(\d+):\s*(.+)/i) ||
                line.match(/^#{1,3}\s*(.+?Artifact\s+\d+:?.*)/i) ||
                line.match(/^#{1,3}\s*(.+?)+$/i);
            if (artifactMatch && (artifactMatch[0].toLowerCase().includes('artifact') ||
                (line.match(/^#{1,3}\s+(.+)/) && artifactCount === 0 && lines[i - 1]?.includes('Artifacts')))) {
                // Save previous artifact
                if (currentArtifact) {
                    artifacts.push(this.finalizeArtifact(currentArtifact, i - 1));
                }
                // Start new artifact
                artifactCount++;
                const title = artifactMatch[2] ? artifactMatch[3]?.trim() : artifactMatch[1]?.trim() || `Artifact ${artifactCount}`;
                currentArtifact = {
                    id: `artifact-${artifactCount}`,
                    title: title || `Artifact ${artifactCount}`,
                    description: '',
                    codeBlocks: [],
                    lessons: [],
                    contextLines: [],
                    sourceLocation: {
                        file: this.artifactsPath,
                        startLine: i + 1,
                        endLine: i + 1
                    },
                    tags: [],
                    severity: 'medium',
                    category: 'general'
                };
                continue;
            }
            // Skip if no active artifact
            if (!currentArtifact)
                continue;
            // Extract description (multiple patterns)
            if (line.match(/(?: Description|Summary|Overview)[:\s]/i) ||
                line.match(/^\*\*Description\*\*:?\s*/)) {
                currentArtifact.description = line.replace(/(?:\*\*?|\*?)(?:Description|Summary|Overview)\*?\*?:?\s*/i, '').trim();
                // Continue collecting multi-line description
                i++;
                while (i < lines.length && !lines[i].startsWith('**') && !lines[i].startsWith('#') && lines[i].trim() &&
                    !lines[i].match(/^(Problem|Solution|Pattern|Lesson|Severity|Category):/i)) {
                    currentArtifact.description += ' ' + lines[i].trim();
                    i++;
                }
                i--; // Adjust for loop increment
                continue;
            }
            // Extract code blocks
            const codeBlockStart = line.match(/^```(\w+)?/);
            if (codeBlockStart) {
                const language = codeBlockStart[1] || 'text';
                const codeContent = [];
                const startLine = i + 1;
                i++; // Move past ```
                while (i < lines.length && !lines[i].startsWith('```')) {
                    codeContent.push(lines[i]);
                    i++;
                }
                currentArtifact.codeBlocks = currentArtifact.codeBlocks || [];
                currentArtifact.codeBlocks.push({
                    language,
                    content: codeContent.join('\n'),
                    filename: this.extractFileName(codeContent[0] || ''),
                    lineStart: startLine,
                    lineEnd: i
                });
                continue;
            }
            // Extract lessons
            if (line.match(/Lesson:|Insight:|Key takeaway:/i)) {
                const lesson = line.replace(/\*\*?(?:Lesson|Insight|Key takeaway)\*?\*?:/gi, '').trim();
                currentArtifact.lessons = currentArtifact.lessons || [];
                currentArtifact.lessons.push(lesson);
            }
            // Extract severity and category from context
            if (line.toLowerCase().includes('critical') || line.toLowerCase().includes('urgent')) {
                currentArtifact.severity = 'critical';
            }
            else if (line.toLowerCase().includes('high') || line.toLowerCase().includes('important')) {
                currentArtifact.severity = 'high';
            }
            else if (line.toLowerCase().includes('low')) {
                currentArtifact.severity = 'low';
            }
            // Extract category
            if (line.match(/Pattern:/i))
                currentArtifact.category = 'pattern';
            else if (line.match(/Solution:/i))
                currentArtifact.category = 'solution';
            else if (line.match(/Problem:/i))
                currentArtifact.category = 'problem';
            else if (line.match(/Metaphor:/i))
                currentArtifact.category = 'metaphor';
        }
        // Don't forget the last artifact
        if (currentArtifact) {
            artifacts.push(this.finalizeArtifact(currentArtifact, lines.length - 1));
        }
        return artifacts;
    }
    async extractInsights() {
        const content = await promises_1.default.readFile(this.transcriptPath, 'utf-8');
        const lines = content.split('\n');
        const insights = [];
        let insightCount = 0;
        // Define patterns to look for
        const patterns = {
            problem: [
                /problem is/i,
                /issue with/i,
                /challenge/i,
                /struggling with/i
            ],
            solution: [
                /solution/i,
                /fix is/i,
                /approach/i,
                /method:/i
            ],
            pattern: [
                /pattern/i,
                /approach:/i,
                /strategy/i
            ],
            metaphor: [
                /(?:like|as if|metaphor)/i,
                /gardener/i,
                /blind gardener/i,
                /context collapse/i
            ],
            terminology: [
                /context collapse/i,
                /delobotomization/i,
                /artifact extraction/i
            ],
            process: [
                /step\s+\d+/i,
                /phase/i,
                /process:/i,
                /workflow/i
            ]
        };
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const prevLine = i > 0 ? lines[i - 1] : '';
            const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
            // Check for insight patterns
            for (const [type, regexList] of Object.entries(patterns)) {
                for (const regex of regexList) {
                    if (regex.test(line)) {
                        // Extract full context
                        let context = prevLine + '\n' + line;
                        let j = i + 1;
                        while (j < lines.length && j < i + 3 && lines[j].trim()) {
                            context += '\n' + lines[j];
                            j++;
                        }
                        insightCount++;
                        const insight = {
                            id: `insight-${insightCount}`,
                            type: type,
                            content: line.trim(),
                            context: context.trim(),
                            sourceLocation: {
                                file: this.transcriptPath,
                                startLine: i,
                                endLine: j - 1
                            },
                            relatedArtifacts: [],
                            actionable: this.isActionable(line),
                            verified: false
                        };
                        // Try to identify speaker if available
                        const speakerMatch = prevLine.match(/\*\*(.+?):\*\*/);
                        if (speakerMatch) {
                            insight.speaker = speakerMatch[1];
                        }
                        insights.push(insight);
                        break; // Avoid duplicate insights from same line
                    }
                }
            }
        }
        return insights;
    }
    async generateCrossReferences(artifacts, insights) {
        const crossReferences = [];
        for (const insight of insights) {
            for (const artifact of artifacts) {
                const confidence = this.calculateRelationship(insight, artifact);
                if (confidence > 0.3) {
                    const relationship = this.determineRelationship(insight, artifact);
                    crossReferences.push({
                        insightId: insight.id,
                        artifactId: artifact.id,
                        relationship,
                        confidence
                    });
                }
            }
        }
        // Sort by confidence
        return crossReferences
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 100); // Keep top relationships
    }
    async buildKnowledgeGraph(artifacts, insights) {
        const concepts = new Set();
        const relationships = [];
        // Extract concepts
        for (const artifact of artifacts) {
            concepts.add(artifact.title);
            concepts.add(artifact.category);
            artifact.tags.forEach(tag => concepts.add(tag));
        }
        for (const insight of insights) {
            concepts.add(insight.type);
            // Extract keywords from insight
            const keywords = this.extractKeywords(insight.content);
            keywords.forEach(keyword => concepts.add(keyword));
        }
        // Build relationships
        for (const xref of await this.generateCrossReferences(artifacts, insights)) {
            relationships.push({
                from: xref.insightId,
                to: xref.artifactId,
                type: xref.relationship,
                weight: xref.confidence
            });
        }
        return {
            concepts: Array.from(concepts),
            relationships: relationships.slice(0, 50) // Keep top relationships
        };
    }
    finalizeArtifact(artifact, endLine) {
        return {
            id: artifact.id,
            title: artifact.title,
            description: artifact.description || '',
            codeBlocks: artifact.codeBlocks || [],
            lessons: artifact.lessons || [],
            contextLines: artifact.contextLines || [],
            sourceLocation: {
                ...artifact.sourceLocation,
                endLine
            },
            tags: artifact.tags || [],
            severity: artifact.severity || 'medium',
            category: artifact.category || 'general'
        };
    }
    extractFileName(firstCodeLine) {
        const patterns = [
            /\/\/\s*file:\s*(\S+)/,
            /#\s*file:\s*(\S+)/,
            /(?:class|function|interface)\s+(\w+)/
        ];
        for (const pattern of patterns) {
            const match = firstCodeLine.match(pattern);
            if (match)
                return match[1];
        }
        return undefined;
    }
    isActionable(line) {
        const actionableWords = [
            'should', 'must', 'need to', 'implement', 'create', 'build',
            'fix', 'solve', 'address', 'handle', 'ensure', 'verify'
        ];
        return actionableWords.some(word => line.toLowerCase().includes(word));
    }
    calculateRelationship(insight, artifact) {
        let score = 0;
        // Content similarity
        const insightWords = new Set(insight.content.toLowerCase().split(/\s+/));
        const artifactWords = new Set([
            artifact.title.toLowerCase(),
            artifact.description.toLowerCase(),
            ...artifact.lessons.map(l => l.toLowerCase())
        ].join(' ').split(/\s+/));
        const intersection = new Set([...insightWords].filter(w => artifactWords.has(w)));
        score += intersection.size / Math.max(insightWords.size, 10) * 0.4;
        // Category matching
        if (artifact.category.toLowerCase() === insight.type)
            score += 0.3;
        // Severity/actionability
        if (artifact.severity === 'critical' && insight.actionable)
            score += 0.2;
        return Math.min(score, 1);
    }
    determineRelationship(insight, artifact) {
        if (insight.type === 'solution' && artifact.category === 'problem')
            return 'solves';
        if (insight.type === 'problem' && artifact.category === 'solution')
            return 'explains';
        if (insight.type === 'pattern' && artifact.codeBlocks.length > 0)
            return 'exemplifies';
        return 'relates_to';
    }
    extractKeywords(text) {
        // Simple keyword extraction
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3)
            .slice(0, 5);
    }
    async saveExtractionResults(result) {
        // Save as JSON
        await promises_1.default.writeFile(path_1.default.join(this.outputPath, 'artifacts.json'), JSON.stringify(result.artifacts, null, 2));
        await promises_1.default.writeFile(path_1.default.join(this.outputPath, 'insights.json'), JSON.stringify(result.insights, null, 2));
        await promises_1.default.writeFile(path_1.default.join(this.outputPath, 'cross-references.json'), JSON.stringify(result.crossReferences, null, 2));
        await promises_1.default.writeFile(path_1.default.join(this.outputPath, 'knowledge-graph.json'), JSON.stringify(result.knowledgeGraph, null, 2));
        // Save summary report
        const report = this.generateSummaryReport(result);
        await promises_1.default.writeFile(path_1.default.join(this.outputPath, 'extraction-report.md'), report);
    }
    generateSummaryReport(result) {
        return `# Phase 0 Extraction Report
Generated: ${new Date().toISOString()}

## Summary
- **Artifacts**: ${result.artifacts.length} extracted
- **Insights**: ${result.insights.length} extracted
- **Cross-References**: ${result.crossReferences.length} generated
- **Knowledge Graph**: ${result.knowledgeGraph.concepts.length} concepts, ${result.knowledgeGraph.relationships.length} relationships

## Artifacts by Category
${Object.entries(result.artifacts.reduce((acc, a) => {
            acc[a.category] = (acc[a.category] || 0) + 1;
            return acc;
        }, {})).map(([cat, count]) => `- ${cat}: ${count}`).join('\n')}

## Insights by Type
${Object.entries(result.insights.reduce((acc, i) => {
            acc[i.type] = (acc[i.type] || 0) + 1;
            return acc;
        }, {})).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

## Top Cross-References
${result.crossReferences
            .slice(0, 10)
            .map(xref => `- ${xref.insightId} → ${xref.artifactId} (${xref.relationship}, ${(xref.confidence * 100).toFixed(1)}%)`)
            .join('\n')}

## Key Concepts
${result.knowledgeGraph.concepts.slice(0, 20).join(', ')}

This structured data provides the foundation for:
1. Prompt-Layered Architecture implementation
2. Iterative Design optimization
3. Context preservation across sessions
4. Self-documenting code generation
`;
    }
}
exports.Phase0Extractor = Phase0Extractor;
// Run extraction if called directly
if (require.main === module) {
    const extractor = new Phase0Extractor();
    extractor.extractAll().catch(console.error);
}
//# sourceMappingURL=phase0-extract.js.map