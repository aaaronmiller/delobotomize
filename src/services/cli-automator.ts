import { LLMProvider } from '../llm/provider-interface';
import path from 'path';

export interface CLIInputs {
  projectPath: string;
  flags?: { [key: string]: string | boolean };
  context?: {
    files: Array<{ path: string; type: string; size: number }>;
    previousRuns: Array<{ date: string; issues: number; result: string }>;
    projectType?: string;
  };
}

export interface AutomationResult {
  command: string;
  reasoning: string;
  confidence: number;
  alternatives?: Array<{ command: string; reasoning: string }>;
  warnings?: string[];
  metadata?: {
    detectedModel?: string;
    estimatedDuration?: number;
    estimatedCost?: number;
  };
}

/**
 * LLM-driven automation for CLI parameter inference
 */
export class CLIAutomator {
  constructor(private llmProvider: LLMProvider) {}

  /**
   * Automate triage command decisions
   */
  async automateTriage(inputs: CLIInputs): Promise<AutomationResult> {
    const projectAnalysis = await this.analyzeProject(inputs.projectPath);

    const prompt = this.buildPrompt(projectAnalysis, inputs);

    try {
      const response = await this.llmProvider.complete(prompt, {
        model: this.selectBestModel(projectAnalysis),
        maxTokens: 2000,
        temperature: 0.3 // Low temp for consistent results
      });

      const result = this.extractJSON(response.content);
      return {
        ...result,
        command: this.sanitizeCommand(result.command)
      };
    } catch (error) {
      // Fallback to safe defaults
      return this.getDefaultTriageCommand(projectAnalysis);
    }
  }

  private buildPrompt(analysis: any, inputs: CLIInputs): string {
    const history = inputs.context?.previousRuns
      ? inputs.context.previousRuns.slice(-3).map(r =>
          ` - ${r.date}: Found ${r.issues} issues, result: ${r.result}`
        ).join('\n')
      : 'No history';

    return 'You are an expert at debugging AI-damaged codebases. Given the following information, determine the OPTIMAL triage command.\n\n' +
      'PROJECT ANALYSIS:\n' +
      this.formatProjectAnalysis(analysis) + '\n\n' +
      'USER FLAGS: ' + JSON.stringify(inputs.flags || {}, null, 2) + '\n\n' +
      'PROJECT HISTORY:\n' +
      history + '\n\n' +
      'TASK: Generate the best triage command with minimal user friction.\n\n' +
      'Consider:\n' +
      '1. Recent history - if similar issues occurred, same approach might work\n' +
      '2. Project scale - large projects need batch limits, small can be aggressive\n' +
      '3. Resources - if LLM keys are available, can do full analysis\n' +
      '4. urgency - critical projects need fast, non-destructive approach\n' +
      '5. previous failures - avoid repeating failed approaches\n\n' +
      'Return JSON with command, reasoning, confidence, alternatives, warnings, and metadata.';
  }

  /**
   * Automate audit choices (interactive mode)
   */
  async suggestAuditOptions(
    issues: Array<{ type: string; severity: string; file: string }>
  ): Promise<{
    recommendedAction: string;
    autoApplyable: boolean;
    reasoning: string;
    riskLevel: 'minimal' | 'low' | 'medium' | 'high';
  }> {
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const typesDistribution = this.analyzeIssueTypes(issues);

    const prompt = 'Analyze these audit issues and suggest optimal remediation strategy:\n\n' +
      'ISSUES TO FIX (' + issues.length + ' total):\n' +
      issues.map(i => '  - ' + i.file + ': ' + i.type + ' (' + i.severity + ')').join('\n') + '\n\n' +
      'ISSUE TYPES BY SEVERITY:\n' +
      '  - Critical: ' + criticalIssues.length + '\n' +
      '  - High: ' + issues.filter(i => i.severity === 'high').length + '\n' +
      '  - Medium: ' + issues.filter(i => i.severity === 'medium').length + '\n' +
      '  - Low: ' + issues.filter(i => i.severity === 'low').length + '\n\n' +
      'ISSUE PATTERNS DETECTED:\n' +
      Object.entries(typesDistribution).map(([type, count]) => '  - ' + type + ': ' + count).join('\n') + '\n\n' +
      'Return: BEST strategy in JSON with recommendedAction, autoApplyable, reasoning, and riskLevel.';

    try {
      const response = await this.llmProvider.complete(prompt, {
        model: 'anthropic/claude-3.5-sonnet',
        maxTokens: 1500,
        temperature: 0.2
      });

      return this.extractJSON(response.content);
    } catch (error) {
      // Conservative fallback
      return {
        recommendedAction: criticalIssues.length > 0 ? 'manual-review' : 'interactive',
        autoApplyable: false,
        reasoning: 'LLM unavailable, using conservative approach',
        riskLevel: 'low'
      };
    }
  }

  /**
   * Auto-select optimal model based on project
   */
  private async selectBestModel(projectAnalysis: any): string {
    const totalFiles = projectAnalysis.filesCount || 0;
    const avgFileSize = projectAnalysis.avgFileSize || 1000;
    const hasComplexStructure = projectAnalysis.hasComplexStructure || false;

    // Model selection heuristics
    if (totalFiles > 1000) {
      return 'google/gemini-pro-1.5'; // Large context for massive projects
    }

    if (avgFileSize > 50000) {
      // ~200KB average file size
      return 'google/gemini-pro-1.5'; // 2M context for giant files
    }

    if (hasComplexStructure) {
      return 'anthropic/claude-3.5-sonnet'; // Better at complex reasoning
    }

    if (totalFiles < 50) {
      return 'openai/gpt-4o-mini'; // Fast and cheap for small projects
    }

    return 'anthropic/claude-3.5-sonnet'; // Default good balance
  }

  /**
   * Analyze project structure
   */
  private async analyzeProject(projectPath: string): Promise<any> {
    try {
      const fs = await import('fs/promises');

      // Quick scan
      const files = await this.scanDirectory(projectPath, 100); // Limit scan
      const totalFiles = files.length;
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      const avgFileSize = totalFiles > 0 ? totalSize / totalFiles : 0;

      // Detect complexity indicators
      const hasConfigFiles = files.some(f =>
        f.path.includes('package.json') ||
        f.path.includes('tsconfig.json') ||
        f.path.includes('webpack.config') ||
        f.path.includes('rollup.config')
      );
      const hasTests = files.some(f => f.path.includes('test') || f.path.includes('spec'));
      const hasMonorepo = files.some(f => f.path.includes('packages/') || f.path.includes('apps/'));
      const hasComplexStructure = hasConfigFiles && hasTests && hasMonorepo;

      // Detect language/type
      const hasTS = files.some(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'));
      const hasJS = !hasTS && files.some(f => f.path.endsWith('.js') || f.path.endsWith('.jsx'));
      const hasPython = files.some(f => f.path.endsWith('.py'));
      const hasGo = files.some(f => f.path.endsWith('.go'));
      const hasRust = files.some(f => f.path.includes('Cargo.toml') || f.path.endsWith('.rs'));

      let language = 'unknown';
      if (hasTS) language = 'typescript';
      else if (hasJS) language = 'javascript';
      else if (hasPython) language = 'python';
      else if (hasGo) language = 'go';
      else if (hasRust) language = 'rust';

      return {
        filesCount: totalFiles,
        avgFileSize,
        hasComplexStructure,
        language,
        framework: hasConfigFiles ? this.detectFramework(files) : 'none'
      };
    } catch {
      return { filesCount: 0, hasComplexStructure: false };
    }
  }

  /**
   * Quick directory scan with limit
   */
  private async scanDirectory(dir: string, maxFiles: number = 100): Promise<Array<{ path: string; size: number }>> {
    const fs = await import('fs/promises');
    const path = await import('path');

    async function scan(currentDir: string, depth: number = 0): Promise<Array<{ path: string; size: number }>> {
      if (depth > 2) return []; // Limit depth for speed

      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      const files = [];

      for (const entry of entries.slice(0, maxFiles)) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isFile()) {
          const stat = await fs.stat(fullPath);
          files.push({
            path: path.relative(dir, fullPath),
            size: stat.size
          });
        } else if (entry.isDirectory() && depth < 2) {
          const subFiles = await scan(fullPath, depth + 1);
          files.push(...subFiles);
        }
      }

      return files;
    }

    return await scan(dir);
  }

  /**
   * Detect framework from files
   */
  private detectFramework(files: Array<{ path: string; size: number }>): string {
    const packageJson = files.find(f => f.path === 'package.json');
    if (!packageJson) return 'none';

    // In real implementation, would read and parse package.json
    // For now, simplified detection based on common files
    const hasReact = files.some(f => f.path.includes('react') || f.path.includes('jsx'));
    const hasVue = files.some(f => f.path.includes('vue') || f.path.includes('.vue'));
    const hasAngular = files.some(f => f.path.includes('angular') || f.path.includes('.angular'));
    const hasExpress = files.some(f => f.path.includes('express'));
    const hasFastify = files.some(f => f.path.includes('fastify'));
    const hasNext = files.some(f => f.path.includes('next'));
    const hasNuxt = files.some(f => f.path.includes('nuxt'));

    if (hasReact) return 'react';
    if (hasVue) return 'vue';
    if (hasAngular) return 'angular';
    if (hasNext) return 'next';
    if (hasNuxt) return 'nuxt';
    if (hasExpress || hasFastify) return 'node-server';

    return 'vanilla';
  }

  /**
   * Analyze issue types
   */
  private analyzeIssueTypes(issues: Array<{ type: string; severity: string }>): { [type: string]: number } {
    const types = {};
    for (const issue of issues) {
      types[issue.type] = (types[issue.type] || 0) + 1;
    }
    return types;
  }

  /**
   * Format project analysis for prompt
   */
  private formatProjectAnalysis(analysis: any): string {
    const lines = [
      'Files: ' + (analysis.filesCount || 0) + ' total, ~' + (analysis.avgFileSize || 0) + ' bytes avg',
      'Language: ' + analysis.language,
      'Framework: ' + analysis.framework,
      'Complexity: ' + (analysis.hasComplexStructure ? 'Complex (configs + tests + multi-repo)' : 'Simple'),
      'Structure: ' + (analysis.hasComplexStructure ? 'Likely needs careful approach' : 'Straightforward')
    ];
    return '\n' + lines.join('\n');
  }

  /**
   * Get default safe triage command
   */
  private getDefaultTriageCommand(projectAnalysis: any): AutomationResult {
    const commands = [];
    const reasoning = [];

    // Always safe defaults
    commands.push('delobotomize');

    // Based on project size
    if (projectAnalysis.filesCount > 500) {
      commands.push('--batch-size=50'); // Prevent overwhelming
      reasoning.push('Large project detected, using batch processing');
    } else {
      reasoning.push('Standard project size, using default settings');
    }

    // Based on language
    if (projectAnalysis.language === 'typescript') {
      commands.push('--fix-method=diff'); // TS works well with diffs
      reasoning.push('TypeScript project optimized for diff-based fixes');
    }

    // Always include project path
    commands.push(projectAnalysis.projectPath || '.');

    return {
      command: commands.join(' '),
      reasoning: reasoning.join('. '),
      confidence: 70, // Moderate confidence for defaults
      metadata: {
        detectedModel: 'default-heuristics',
        estimatedDuration: projectAnalysis.filesCount * 0.5, // 0.5s per file estimate
        estimatedCost: 0 // No LLM cost for defaults
      }
    };
  }

  /**
   * Extract and clean JSON from LLM response
   */
  private extractJSON(content: string): any {
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }

      return {};
    } catch {
      console.warn('Failed to extract JSON from LLM response');
      return {};
    }
  }

  /**
   * Sanitize command for safety
   */
  private sanitizeCommand(command: string): string {
    // Remove dangerous characters and patterns
    return command
      .replace(/[;&|`]/g, '') // No command chaining
      .replace(/\.\.\//g, '') // No relative path abuse
      .replace(/--\s*user/gi, '') // No user flag injection
      .trim();
  }

  /**
   * Generate auto-complete suggestions
   */
  async suggestCompletion(partial: string, projectPath: string): Promise<{
    suggestions: Array<{ command: string; description: string }>;
    reasoning: string;
  }> {
    const projectAnalysis = await this.analyzeProject(projectPath);

    const commonCommands = [
      { cmd: 'triage', desc: 'Full audit and fix process' },
      { cmd: 'scan', desc: 'Quick scan for symptoms' },
      { cmd: 'restore', desc: 'Restore from backup' },
      { cmd: 'history', desc: 'Show backup history' },
      { cmd: 'stats', desc: 'View project statistics' },
      { cmd: 'init', desc: 'Initialize memory system' }
    ];

    const suggestions = commonCommands
      .filter(cc => cc.cmd.toLowerCase().startsWith(partial.toLowerCase()))
      .map(cc => ({
        command: cc.cmd,
        description: cc.desc
      }));

    // Add project-specific suggestions
    if (projectAnalysis.framework === 'react') {
      suggestions.push({
        command: 'ui',
        description: 'Start Web UI for monitoring'
      });
    }

    return {
      suggestions,
      reasoning: 'Matched ' + suggestions.length + ' commands for ' + (projectAnalysis.framework || projectAnalysis.language) + ' project'
    };
  }
}