import { PromptLoader } from './prompt-loader';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { glob } from 'glob';

interface Symptom {
  id: string;
  name: string;
  description: string;
  weight: number;
  patterns: any[];
  detection_rules: any;
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file?: string;
  line?: number;
  evidence?: string;
}

interface DetectionResult {
  total_score: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  symptoms: Symptom[];
  summary: {
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
  };
  metrics: {
    files_analyzed: number;
    detection_time_ms: number;
    rule_matches: number;
  };
}

/**
 * Tier 1 Critical Component for detecting project health symptoms
 * Designed for iterative optimization with externalized rules
 */
export class SymptomDetector {
  private rulesPath = './rules/symptoms.yaml';
  private rules: any = null;
  private promptLoader: PromptLoader;
  private metrics = {
    ruleHits: new Map<string, number>(),
    confidenceScores: [] as number[],
    detectionLatency: [] as number[]
  };

  constructor(rulesPath?: string) {
    if (rulesPath) {
      this.rulesPath = rulesPath;
    }
    this.promptLoader = new PromptLoader();
  }

  async loadRules(): Promise<void> {
    const content = await fs.readFile(this.rulesPath, 'utf-8');
    this.rules = yaml.parse(content);
  }

  async detect(projectPath: string): Promise<DetectionResult> {
    const startTime = Date.now();

    if (!this.rules) {
      await this.loadRules();
    }

    // Find relevant files
    const files = await this.findProjectFiles(projectPath);

    // Analyze each file for symptoms
    const symptoms: Symptom[] = [];

    for (const filePath of files) {
      const fileSymptoms = await this.analyzeFile(filePath);
      symptoms.push(...fileSymptoms);
    }

    // Calculate overall score and severity
    const totalScore = symptoms.reduce((sum, s) => sum + (s.weight * s.confidence), 0);
    const severity = this.calculateOverallSeverity(totalScore, symptoms.length);

    const detectionTime = Date.now() - startTime;

    // Record metrics for optimization
    this.recordMetrics(symptoms, detectionTime);

    return {
      total_score: totalScore,
      severity,
      symptoms: this.prioritizeSymptoms(symptoms),
      summary: {
        critical_count: symptoms.filter(s => s.severity === 'critical').length,
        high_count: symptoms.filter(s => s.severity === 'high').length,
        medium_count: symptoms.filter(s => s.severity === 'medium').length,
        low_count: symptoms.filter(s => s.severity === 'low').length
      },
      metrics: {
        files_analyzed: files.length,
        detection_time_ms: detectionTime,
        rule_matches: symptoms.length
      }
    };
  }

  private async findProjectFiles(projectPath: string): Promise<string[]> {
    const patterns = [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
      '**/*.vue',
      '**/*.py',
      '**/*.java',
      '**/*.php',
      '**/*.rb',
      '**/*.go'
    ];

    const excludes = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/coverage/**',
      '**/test/**',
      '**/spec/**'
    ];

    const files: string[] = [];

    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: projectPath,
        absolute: true,
        ignore: excludes
      });
      files.push(...matches);
    }

    return [...new Set(files)];
  }

  private async analyzeFile(filePath: string): Promise<Symptom[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const symptoms: Symptom[] = [];

    // Apply critical symptom rules
    for (const symptomDef of this.rules.critical_symptoms) {
      const detected = await this.applySymptomRule(filePath, content, lines, symptomDef, 'critical');
      symptoms.push(...detected);
    }

    // Apply high symptom rules
    for (const symptomDef of this.rules.high_symptoms) {
      const detected = await this.applySymptomRule(filePath, content, lines, symptomDef, 'high');
      symptoms.push(...detected);
    }

    // Apply medium symptom rules
    for (const symptomDef of this.rules.medium_symptoms) {
      const detected = await this.applySymptomRule(filePath, content, lines, symptomDef, 'medium');
      symptoms.push(...detected);
    }

    return symptoms.filter(s => this.filtersFalsePositive(s, filePath));
  }

  private async applySymptomRule(
    filePath: string,
    content: string,
    lines: string[],
    symptomDef: any,
    defaultSeverity: string
  ): Promise<Symptom[]> {
    const symptoms: Symptom[] = [];

    // Apply regex patterns
    if (symptomDef.patterns) {
      for (const pattern of symptomDef.patterns) {
        if (pattern.regex) {
          const regex = new RegExp(pattern.regex, 'gmi');
          let regexMatch: RegExpExecArray | null;

          while ((regexMatch = regex.exec(content)) !== null) {
            const lineNum = lines.findIndex(l => l.includes(regexMatch![0])) + 1;

            // Apply detection rules
            const confidence = this.calculateConfidence(regexMatch, symptomDef, content);

            if (confidence >= (this.rules.detection_config?.confidence_threshold || 0.70)) {
              symptoms.push({
                id: symptomDef.id,
                name: symptomDef.name,
                description: symptomDef.description,
                weight: symptomDef.weight,
                patterns: [pattern],
                detection_rules: symptomDef.detection_rules,
                confidence,
                severity: this.mapSeverity(defaultSeverity),
                file: path.relative(process.cwd(), filePath),
                line: lineNum,
                evidence: regexMatch![0].substring(0, 100)
              });

              // Track rule hit for optimization
              this.metrics.ruleHits.set(symptomDef.id,
                (this.metrics.ruleHits.get(symptomDef.id) || 0) + 1
              );
            }
          }
        }
      }
    }

    return symptoms;
  }

  private calculateConfidence(match: RegExpMatchArray | null, symptomDef: any, content: string): number {
    let confidence = symptomDef.detection_rules?.if?.condition ? 0.80 : 0.70;

    // Adjust based on context
    if (symptomDef.id === 'stale_todos') {
      // Check for date in TODO
      if (match && match[0]) {
        const todoLine = match[0];
        const dateMatch = todoLine.match(/(\d{4}-\d{2}-\d{2}|\d+\/\d+\/\d{4})/);
        if (dateMatch) {
          const todoDate = new Date(dateMatch[1]);
          const daysOld = (Date.now() - todoDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysOld > (symptomDef.settings?.max_age_days || 7)) {
            confidence = Math.min(0.95, 0.70 + (daysOld - 7) * 0.05);
          }
        }
      }
    }

    // Adjust for false positive indicators
    if (match && match.input && match.index !== undefined) {
      const hasNegation = /\b(no|not|disable|skip)\b/i.test(match.input.substring(
        Math.max(0, match.index - 50),
        match.index
      ));

      if (hasNegation) {
        confidence *= 0.5;
      }
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private filtersFalsePositive(symptom: Symptom, filePath: string): boolean {
    // Check against false positive filters
    for (const category of this.rules.false_positive_filters?.development_tools || []) {
      if (filePath.includes(category.replace('**', '').replace('/', path.sep))) {
        return false; // Skip files in development tools
      }
    }

    // Additional context-based filters
    if (symptom.id === 'stale_todos' && symptom.file && symptom.file.includes('node_modules')) {
      return false;
    }

    return true;
  }

  private prioritizeSymptoms(symptoms: Symptom[]): Symptom[] {
    // Sort by severity and weight
    return symptoms.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];

      if (severityDiff !== 0) return severityDiff;

      // Within same severity, sort by weight * confidence
      return (b.weight * b.confidence) - (a.weight * a.confidence);
    });
  }

  private calculateOverallSeverity(totalScore: number, symptomCount: number): 'critical' | 'high' | 'medium' | 'low' {
    if (!symptomCount) return 'low';

    const avgScore = totalScore / symptomCount;

    if (avgScore >= 8 || totalScore >= 50) return 'critical';
    if (avgScore >= 6 || totalScore >= 25) return 'high';
    if (avgScore >= 3 || totalScore >= 10) return 'medium';
    return 'low';
  }

  private mapSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
    const mapping: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low'
    };
    return mapping[severity] || 'medium';
  }

  private recordMetrics(symptoms: Symptom[], detectionTime: number): void {
    // Track confidence scores
    symptoms.forEach(s => {
      this.metrics.confidenceScores.push(s.confidence);
    });

    // Track detection latency
    this.metrics.detectionLatency.push(detectionTime);

    // Limit history size
    if (this.metrics.confidenceScores.length > 1000) {
      this.metrics.confidenceScores = this.metrics.confidenceScores.slice(-500);
      this.metrics.detectionLatency = this.metrics.detectionLatency.slice(-500);
    }
  }

  /**
   * Get optimization metrics for iterative improvement
   */
  getOptimizationMetrics() {
    return {
      ruleHitFrequency: Object.fromEntries(this.metrics.ruleHits),
      averageConfidence: this.metrics.confidenceScores.length > 0
        ? this.metrics.confidenceScores.reduce((a, b) => a + b) / this.metrics.confidenceScores.length
        : 0,
      averageDetectionTime: this.metrics.detectionLatency.length > 0
        ? this.metrics.detectionLatency.reduce((a, b) => a + b) / this.metrics.detectionLatency.length
        : 0
    };
  }

  /**
   * Update rules based on feedback
   */
  async updateRules(feedback: { symptomId: string; isFalsePositive: boolean;调整: number }[]): Promise<void> {
    // This would update the YAML file with optimized thresholds
    // Implementation depends on specific iteration strategy
    console.log('Processing feedback for rule optimization...', feedback.length, 'items');
  }
}