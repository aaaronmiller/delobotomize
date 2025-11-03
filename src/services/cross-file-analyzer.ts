import { EventEmitter } from 'events';
import { LLMProvider } from '../llm/provider-interface';

export interface FileAnalysis {
  file: string;
  issues: Array<{
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    line?: number;
    crossFileRefs?: string[];
    suggestedFix?: string;
  }>;
  exports: string[];
  imports: string[];
  dependencies: {
    functions: string[];
    types: string[];
    constants: string[];
  };
  health: number;
}

export interface CrossFileDependency {
  source: string;
  target: string;
  type: 'import' | 'function_call' | 'type_reference' | 'constant_usage';
  status: 'valid' | 'missing' | 'moved' | 'duplicate';
  impact: 'critical' | 'high' | 'medium' | 'low';
}

export interface RootCause {
  id: string;
  type: 'ai_hallucination' | 'incomplete_refactor' | 'circular_import' | 'missing_export' | 'broken_dependency';
  description: string;
  evidence: string[];
  affectedFiles: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  resolutionStrategy: string;
}

export interface FixPlan {
  id: string;
  description: string;
  steps: Array<{
    order: number;
    type: 'create' | 'modify' | 'delete' | 'move';
    target: string;
    action: string;
    dependencies?: string[]; // Must complete these first
  }>;
  estimatedTokens: number;
  estimatedCost: number;
}

/**
 * Analyzes cross-file dependencies and root causes
 */
export class CrossFileAnalyzer extends EventEmitter {
  constructor(private llmProvider: LLMProvider) {
    super();
  }

  /**
   * Perform comprehensive cross-file analysis
   */
  async analyze(
    fileAnalyses: FileAnalysis[],
    projectStructure: { [file: string]: string } // file content map
  ): Promise<{
    dependencies: CrossFileDependency[];
    rootCauses: RootCause[];
    fixPlan: FixPlan;
  }> {
    this.emit('analysis_start', { filesCount: fileAnalyses.length });

    // Step 1: Build dependency graph
    this.emit('step', { step: 'building_dependency_graph' });
    const dependencies = await this.buildDependencyMap(fileAnalyses, projectStructure);

    // Step 2: Detect root causes
    this.emit('step', { step: 'detecting_root_causes' });
    const rootCauses = await this.detectRootCauses(dependencies, fileAnalyses);

    // Step 3: Generate fix plan
    this.emit('step', { step: 'generating_fix_plan' });
    const fixPlan = await this.generateFixPlan(rootCauses, dependencies);

    const result = {
      dependencies,
      rootCauses,
      fixPlan
    };

    this.emit('analysis_complete', result);
    return result;
  }

  /**
   * Build dependency map from file analyses
   */
  private async buildDependencyMap(
    fileAnalyses: FileAnalysis[],
    projectStructure: { [file: string]: string }
  ): Promise<CrossFileDependency[]> {
    const dependencies: CrossFileDependency[] = [];
    const allFiles = new Set(fileAnalyses.map(f => f.file));
    const allExports = new Map<string, string[]>();

    // Build export map
    for (const analysis of fileAnalyses) {
      allExports.set(analysis.file, analysis.exports);
    }

    // Check each file's imports/dependencies
    for (const analysis of fileAnalyses) {
      // Check imports
      for (const imp of analysis.imports) {
        const dep = await this.checkDependency(
          analysis.file,
          imp,
          'import',
          allExports,
          allFiles,
          projectStructure
        );
        if (dep) dependencies.push(dep);
      }

      // Check function calls
      for (const func of analysis.dependencies.functions) {
        const dep = await this.checkDependency(
          analysis.file,
          func,
          'function_call',
          allExports,
          allFiles,
          projectStructure
        );
        if (dep) dependencies.push(dep);
      }

      // Check type references
      for (const type of analysis.dependencies.types) {
        const dep = await this.checkDependency(
          analysis.file,
          type,
          'type_reference',
          allExports,
          allFiles,
          projectStructure
        );
        if (dep) dependencies.push(dep);
      }
    }

    return dependencies;
  }

  /**
   * Check a specific dependency
   */
  private async checkDependency(
    sourceFile: string,
    dependency: string,
    type: CrossFileDependency['type'],
    allExports: Map<string, string[]>,
    allFiles: Set<string>,
    projectStructure: { [file: string]: string }
  ): Promise<CrossFileDependency | null> {
    // Find which file contains this export
    let targetFile: string | null = null;
    let isExported = false;

    for (const [file, exports] of allExports.entries()) {
      if (exports.includes(dependency)) {
        targetFile = file;
        isExported = true;
        break;
      }
    }

    // Not found in any exports
    if (!targetFile) {
      // Maybe the file exists but doesn't export it
      for (const file of allFiles) {
        if (projectStructure[file]?.includes(dependency)) {
          targetFile = file;
          isExported = false;
          break;
        }
      }
    }

    // No file contains this dependency
    if (!targetFile) {
      return {
        source: sourceFile,
        target: dependency,
        type,
        status: 'missing',
        impact: 'critical',
        description: `Dependency '${dependency}' not found in any file`
      };
    }

    // File exists but not exported
    if (!isExported) {
      return {
        source: sourceFile,
        target: targetFile,
        type,
        status: 'missing',
        impact: 'high',
        description: `'${dependency}' exists in ${targetFile} but is not exported`
      };
    }

    // Valid dependency
    return {
      source: sourceFile,
      target: targetFile,
      type,
      status: 'valid',
      impact: 'low'
    };
  }

  /**
   * Detect root causes from dependencies
   */
  private async detectRootCauses(
    dependencies: CrossFileDependency[],
    fileAnalyses: FileAnalysis[]
  ): Promise<RootCause[]> {
    const rootCauses: RootCause[] = [];

    // Group invalid dependencies
    const invalidDeps = dependencies.filter(d => d.status !== 'valid');

    // Pattern 1: AI Hallucinations (non-existent functions/types)
    const hallucinations = invalidDeps.filter(d => d.status === 'missing' && !allFiles.has(d.target));
    if (hallucinations.length > 0) {
      rootCauses.push({
        id: 'ai-hallucination-001',
        type: 'ai_hallucination',
        description: `LLM generated ${hallucinations.length} references to non-existent functions/types`,
        evidence: hallucinations.map(d => `${d.source} → ${d.target}`),
        affectedFiles: [...new Set(hallucinations.map(d => d.source))],
        severity: 'critical',
        resolutionStrategy: 'Create missing functions/types based on usage context'
      });
    }

    // Pattern 2: Incomplete Refactors (functions moved, exports missing)
    const movedRefs = invalidDeps.filter(d => d.status === 'missing' && allFiles.has(d.target));
    if (movedRefs.length > 0) {
      rootCauses.push({
        id: 'incomplete-refactor-001',
        type: 'incomplete_refactor',
        description: `Functions/types moved but exports not updated`,
        evidence: movedRefs.map(d => `${d.source} → ${d.target}`),
        affectedFiles: [...new Set(movedRefs.map(d => d.target))],
        severity: 'high',
        resolutionStrategy: 'Update export statements or fix import paths'
      });
    }

    // Pattern 3: Circular Imports
    const importGraph = this.buildImportGraph(dependencies);
    const cycles = this.detectCycles(importGraph);
    if (cycles.length > 0) {
      rootCauses.push({
        id: 'circular-import-001',
        type: 'circular_import',
        description: `Circular dependencies detected between files`,
        evidence: cycles.map(cycle => cycle.join(' → ')),
        affectedFiles: cycles.flat(),
        severity: 'high',
        resolutionStrategy: 'Reorganize code to eliminate circular dependencies'
      });
    }

    // Pattern 4: Missing Exports
    const missingExports = invalidDeps.filter(d => d.status === 'missing' && d.description.includes('not exported'));
    if (missingExports.length > 0) {
      rootCauses.push({
        id: 'missing-export-001',
        type: 'missing_export',
        description: `Required functions/types not exported from modules`,
        evidence: missingExports.map(d => `${d.target} needs: ${d.source}'s request`),
        affectedFiles: [...new Set(missingExports.map(d => d.target))],
        severity: 'medium',
        resolutionStrategy: 'Add missing export statements'
      });
    }

    // Pattern 5: Duplicate Definitions
    const duplicates = await this.detectDuplicates(fileAnalyses);
    if (duplicates.length > 0) {
      rootCauses.push({
        id: 'duplicate-def-001',
        type: 'duplicate',
        description: `Same function/type defined in multiple files`,
        evidence: duplicates.map(d => `${d.name} in ${d.files.join(', ')}`),
        affectedFiles: duplicates.flatMap(d => d.files),
        severity: 'medium',
        resolutionStrategy: 'Consolidate or rename duplicates'
      });
    }

    return rootCauses;
  }

  /**
   * Generate fix plan with correct ordering
   */
  private async generateFixPlan(
    rootCauses: RootCause[],
    dependencies: CrossFileDependency[]
  ): Promise<FixPlan> {
    const steps = [];
    let order = 1;

    // Order fixes based on dependencies
    for (const cause of rootCauses.sort((a, b) => {
      const severity = { critical: 4, high: 3, medium: 2, low: 1 };
      return severity[b.severity] - severity[a.severity];
    })) {
      switch (cause.type) {
        case 'ai_hallucination':
          // Create missing functions first
          const affectedFiles = [...new Set(cause.evidence.map(e => e.split(' → ')[0]))];
          steps.push({
            order: order++,
            type: 'create',
            target: affectedFiles[0],
            action: `Create missing functions/types: ${cause.evidence.join(', ')}`,
            dependencies: []
          });
          break;

        case 'incomplete_refactor':
          // Update exports
          for (const file of cause.affectedFiles) {
            steps.push({
              order: order++,
              type: 'modify',
              target: file,
              action: 'Add missing export statements',
              dependencies: []
            });
          }
          break;

        case 'circular_import':
          // Break cycles (highest order first)
          steps.push({
            order: order++,
            type: 'modify',
            target: cause.affectedFiles[0],
            action: 'Extract shared dependencies to reduce circular coupling',
            dependencies: []
          });
          break;

        case 'missing_export':
          // Add exports
          for (const file of cause.affectedFiles) {
            steps.push({
              order: order++,
              type: 'modify',
              target: file,
              action: 'Export missing functions/types',
              dependencies: []
            });
          }
          break;

        case 'duplicate':
          // Remove duplicates, keep one
          steps.push({
            order: order++,
            type: 'modify',
            target: cause.affectedFiles[0],
            action: `Rename or consolidate duplicates: ${cause.evidence.join(', ')}`,
            dependencies: []
          });
          break;
      }
    }

    // Estimate tokens and cost
    const estimatedTokens = this.estimateTokens(steps);
    const estimatedCost = this.estimateCost(estimatedTokens);

    return {
      id: `fix-plan-${Date.now()}`,
      description: `Fix ${rootCauses.length} root causes with ${steps.length} steps`,
      steps,
      estimatedTokens,
      estimatedCost
    };
  }

  /**
   * Build import graph for cycle detection
   */
  private buildImportGraph(dependencies: CrossFileDependency[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const dep of dependencies) {
      if (dep.type === 'import' && dep.status === 'valid') {
        const existing = graph.get(dep.source) || [];
        existing.push(dep.target);
        graph.set(dep.source, existing);
      }
    }

    return graph;
  }

  /**
   * Detect cycles in import graph
   */
  private detectCycles(graph: Map<string, string[]>): string[][] {
    const cycles = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node);
        cycles.push([...path.slice(cycleStart), node]);
        return;
      }

      if (visited.has(node)) return;

      visited.add(node);
      recursionStack.add(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        dfs(neighbor, [...path, node]);
      }

      recursionStack.delete(node);
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  /**
   * Detect duplicate definitions
   */
  private async detectDuplicates(fileAnalyses: FileAnalysis[]): Promise<Array<{
    name: string;
    files: string[];
    type: 'function' | 'type' | 'class' | 'constant';
  }>> {
    const duplicates = [];
    const definitions = new Map<string, { file: string; type: string }[]>();

    // Collect all definitions
    for (const analysis of fileAnalyses) {
      // This would typically use AST parsing for proper detection
      // For now, simplified based on dependencies
      for (const func of analysis.dependencies.functions) {
        const existing = definitions.get(func) || [];
        existing.push({ file: analysis.file, type: 'function' });
        definitions.set(func, existing);
      }
      for (const type of analysis.dependencies.types) {
        const existing = definitions.get(type) || [];
        existing.push({ file: analysis.file, type: 'type' });
        definitions.set(type, existing);
      }
    }

    // Find duplicates
    for (const [name, defs] of definitions.entries()) {
      if (defs.length > 1) {
        duplicates.push({
          name,
          files: defs.map(d => d.file),
          type: defs[0].type as 'function' | 'type' | 'class' | 'constant'
        });
      }
    }

    return duplicates;
  }

  /**
   * Estimate tokens for fix plan
   */
  private estimateTokens(steps: FixPlan['steps']): number {
    // Rough estimate: 100 tokens per step + file content
    return steps.length * 100 + 500; // Base overhead
  }

  /**
   * Estimate cost for fix plan
   */
  private estimateCost(tokens: number): number {
    // Assume Claude 3.5 Sonnet pricing: $0.003/1K tokens
    return (tokens / 1000) * 0.003;
  }

  private get allFiles(): Set<string> {
    return new Set(); // Should be passed in
  }
}