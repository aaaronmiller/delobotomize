import { PromptLoader, type Prompt } from './prompt-loader';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export interface ScanResult {
  status: 'stable' | 'at-risk' | 'collapse';
  confidence: number;
  summary: string;
  indicators: {
    critical: Array<{
      type: 'broken_contract' | 'orphaned_code' | 'contradiction';
      file: string;
      line: number;
      description: string;
      impact: string;
    }>;
    at_risk: Array<{
      type: string;
      file: string;
      line: number;
      description: string;
    }>;
    observations: Array<{
      type: string;
      file: string;
      description: string;
    }>;
  };
  recommendations: Array<{
    priority: 'immediate' | 'soon' | 'later';
    action: string;
    rationale: string;
  }>;
  contextHealthScore: {
    overall: number;
    architecture: number;
    consistency: number;
    completeness: number;
  };
}

export interface ScanOptions {
  includePatterns?: string[];
  excludePatterns?: string[];
  severity?: 'all' | 'high' | 'critical';
  promptVersion?: string;
}

/**
 * Scans codebases for context collapse patterns using externalized prompts
 */
export class CodeScanner {
  private promptLoader: PromptLoader;

  constructor(promptsPath?: string) {
    this.promptLoader = new PromptLoader(promptsPath);
  }

  async scan(projectPath: string, options: ScanOptions = {}): Promise<ScanResult> {
    console.log('🔍 Starting code scan for context collapse...');

    // Load scanner prompt
    const scannerPrompt = await this.promptLoader.load(
      'core-scanner',
      { version: options.promptVersion }
    );

    // Find all relevant files
    const files = await this.findFiles(projectPath, options);

    // Collect context for each file
    const fileContexts: string[] = [];
    const issues = [];

    for (const filePath of files.slice(0, 50)) { // Limit for demo
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const fileIssues = await this.analyzeFile(filePath, content, scannerPrompt);
        issues.push(...fileIssues);
      } catch (error) {
        console.error(`Failed to scan ${filePath}:`, error);
      }
    }

    // Aggregate results
    return this.aggregateResults(issues, files.length);
  }

  private async findFiles(projectPath: string, options: ScanOptions): Promise<string[]> {
    const includePatterns = options.includePatterns || [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
      '**/*.vue',
      '**/*.py',
      '**/*.java'
    ];

    const excludePatterns = options.excludePatterns || [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/coverage/**'
    ];

    const files: string[] = [];

    for (const pattern of includePatterns) {
      const matches = await glob(pattern, {
        cwd: projectPath,
        absolute: true,
        ignore: excludePatterns
      });
      files.push(...matches);
    }

    return [...new Set(files)]; // Deduplicate
  }

  private async analyzeFile(
    filePath: string,
    content: string,
    scannerPrompt: Prompt
  ): Promise<any[]> {
    // Extract file-specific context
    const fileContext = this.extractFileContext(filePath, content);

    // Apply scanner patterns
    const issues = this.applyScannerPatterns(fileContext);

    return issues;
  }

  private extractFileContext(filePath: string, content: string): any {
    const lines = content.split('\n');
    const imports: string[] = [];
    const exports: string[] = [];
    const functions: string[] = [];
    const classes: string[] = [];
    const todos: string[] = [];
    const hacks: string[] = [];

    lines.forEach((line, index) => {
      // Extract imports
      const importMatch = line.match(/^(import|require)\s+.+/);
      if (importMatch) imports.push(line.trim());

      // Extract exports
      const exportMatch = line.match(/^export\s+/);
      if (exportMatch) exports.push(line.trim());

      // Extract functions
      const funcMatch = line.match(/^(?:async\s+)?(?:function|const)\s+(\w+)/);
      if (funcMatch) functions.push(funcMatch[1]);

      // Extract classes
      const classMatch = line.match(/^class\s+(\w+)/);
      if (classMatch) classes.push(classMatch[1]);

      // Find TODOs
      const todoMatch = line.match(/TODO|FIXME|XXX/i);
      if (todoMatch) todos.push(`${index + 1}: ${line.trim()}`);

      // Find potential hacks
      const hackMatch = line.match(/hack|temporary|quick.?fix|workaround/i);
      if (hackMatch) hacks.push(`${index + 1}: ${line.trim()}`);
    });

    return {
      file: path.relative(process.cwd(), filePath),
      lines: lines.length,
      imports,
      exports,
      functions,
      classes,
      todos,
      hacks,
      hasTests: content.includes('describe(') || content.includes('test(') || content.includes('it(')
    };
  }

  private applyScannerPatterns(context: any): any[] {
    const issues = [];

    // Check for broken contracts
    if (context.hacks.length > 0) {
      issues.push({
        type: 'contradiction',
        file: context.file,
        severity: 'high',
        description: 'Contains potential hacks or workarounds',
        details: context.hacks
      });
    }

    // Check for incomplete implementation
    if (context.todos.length > 3) {
      issues.push({
        type: 'incomplete',
        file: context.file,
        severity: 'medium',
        description: 'Multiple TODOs indicate incomplete implementation',
        details: context.todos
      });
    }

    // Check for orphaned code
    if (context.exports.length === 0 && context.functions.length > 0) {
      issues.push({
        type: 'orphaned_code',
        file: context.file,
        severity: 'medium',
        description: 'Functions defined but nothing exported',
        details: context.functions
      });
    }

    // Check for missing tests
    if (!context.hasTests && context.functions.length > 0) {
      issues.push({
        type: 'untested',
        file: context.file,
        severity: 'medium',
        description: 'Functions without tests',
        details: context.functions
      });
    }

    return issues;
  }

  private aggregateResults(issues: any[], totalFiles: number): ScanResult {
    const critical = issues.filter(i => i.severity === 'high' || i.type === 'contradiction');
    const atRisk = issues.filter(i => i.severity === 'medium');

    // Calculate health scores
    const overall = Math.max(0, 100 - (critical.length * 15) - (atRisk.length * 5));
    const architecture = Math.max(0, 100 - (critical.filter(i => i.type === 'contradiction').length * 20));
    const completeness = Math.max(0, 100 - (atRisk.filter(i => i.type === 'incomplete').length * 10));
    const consistency = Math.max(0, 100 - (atRisk.filter(i => i.type === 'untested').length * 7));

    // Determine status
    let status: 'stable' | 'at-risk' | 'collapse';
    if (critical.length > 0) {
      status = 'collapse';
    } else if (atRisk.length > totalFiles * 0.3) {
      status = 'at-risk';
    } else {
      status = 'stable';
    }

    // Generate recommendations
    const recommendations = [];
    if (critical.length > 0) {
      recommendations.push({
        priority: 'immediate' as const,
        action: 'Address critical contradictions and hacks',
        rationale: `Found ${critical.length} critical issues that must be resolved`
      });
    }
    if (atRisk.length > 5) {
      recommendations.push({
        priority: 'soon' as const,
        action: 'Complete incomplete implementations',
        rationale: `${atRisk.filter(i => i.type === 'incomplete').length} files have multiple TODOs`
      });
    }
    recommendations.push({
      priority: 'later' as const,
      action: 'Improve test coverage',
      rationale: 'Better tests prevent regressions and context loss'
    });

    return {
      status,
      confidence: Math.min(95, 50 + (issues.length * 2)),
      summary: `Scan complete: ${critical.length} critical, ${atRisk.length} at-risk issues found`,
      indicators: {
        critical: critical.map(i => ({
          type: i.type,
          file: i.file,
          line: 0,
          description: i.description,
          impact: 'high'
        })),
        at_risk: atRisk.map(i => ({
          type: i.type,
          file: i.file,
          line: 0,
          description: i.description
        })),
        observations: []
      },
      recommendations,
      contextHealthScore: {
        overall,
        architecture,
        completeness,
        consistency
      }
    };
  }
}