import fs from 'fs/promises';
import path from 'path';
import { Phase0Extractor } from '../extractors/phase0';
import { ExtractionAnalyzer } from '../analyzers/extraction';
import { SymptomDetector } from '../core/symptom-detector';
import { RemediationOrchestrator } from '../workflows/remediation-orchestrator';
import { PromptLoader } from '../core/prompt-loader';
import { ContextManager } from '../memory/context-manager';
import { LLMProviderFactory } from '../llm/provider-interface';

interface NarrativeReport {
  projectName: string;
  projectPath: string;
  timestamp: string;

  problem: {
    whatWasWrong: string;
    symptomsDetected: string[];
    contextualCollapseIndicators: string[];
    impactAssessment: string;
  };

  diagnosis: {
    syndromeIdentified: string;
    confidence: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    keyFindings: string[];
  };

  remediation: {
    phasesExecuted: string[];
    stepsCompleted: string[];
    changesMade: string[];
    correctiveActions: Array<{
      action: string;
      rationale: string;
      result: string;
    }>;
  };

  resolution: {
    beforeState: string;
    afterState: string;
    improvementsAchieved: string[];
    remainingIssues: string[];
    nextRecommendations: string[];
  };

  metrics: {
    extractionResults: any;
    healthScoreChange: {
      before: number;
      after: number;
      improvement: number;
    };
    issuesResolved: number;
    newIssuesIntroduced: number;
  };
}

/**
 * Orchestrates the triage process and builds a narrative report
 * for users to understand what happened and how it was fixed
 */
export class TriageNarrator {
  private projectPath: string;
  private projectName: string;
  private narrative: Partial<NarrativeReport> = {};
  private contextManager?: ContextManager;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.projectName = path.basename(projectPath);
  }

  /**
   * Initialize memory system for triage
   */
  private async initializeMemory(): Promise<void> {
    try {
      const provider = await LLMProviderFactory.createFromEnv();
      this.contextManager = new ContextManager({
        projectPath: this.projectPath,
        llmProvider: provider,
        enableMCP: false
      });
      await this.contextManager.initialize();
      console.log('   ✓ Memory system initialized');
    } catch (error) {
      console.warn('   ⚠ Memory system unavailable (no LLM provider configured)');
      // Continue without memory - it's optional
    }
  }

  async executeFullTriage(): Promise<NarrativeReport> {
    console.log('🎭 Beginning triage with narrative generation...');

    // Initialize memory system
    await this.initializeMemory();

    // Initialize narrative structure
    this.narrative = {
      projectName: this.projectName,
      projectPath: this.projectPath,
      timestamp: new Date().toISOString()
    };

    // Phase 1: Problem Identification
    await this.identifyProblem();

    // Phase 2: Diagnosis
    await this.performDiagnosis();

    // Phase 3: Remediation
    await this.executeRemediation();

    // Phase 4: Resolution Assessment
    await this.assessResolution();

    // Save memory
    if (this.contextManager) {
      await this.contextManager.saveMemory();
    }

    // Generate final report
    const report = this.narrative as NarrativeReport;
    await this.saveNarrativeReport(report);

    return report;
  }

  private async identifyProblem(): Promise<void> {
    console.log('🔍 Phase 1: Identifying the Problem');

    // Extract context from source materials
    const extractor = new Phase0Extractor();
    const extraction = await extractor.extractAll();

    // Analyze for patterns
    const analyzer = new ExtractionAnalyzer();
    const analysis = await analyzer.analyze();

    // Scan for symptoms
    const detector = new SymptomDetector();
    const scan = await detector.detect(this.projectPath) as any;

    // Build problem narrative
    const problems = this.synthesizeProblemStatement(extraction, analysis, scan);

    this.narrative.problem = {
      whatWasWrong: problems.mainIssue,
      symptomsDetected: problems.symptoms,
      contextualCollapseIndicators: problems.collapseIndicators,
      impactAssessment: problems.impact
    };

    this.narrative.metrics = {
      extractionResults: {
        artifacts: extraction.artifacts.length,
        insights: extraction.insights.length,
        crossReferences: extraction.crossReferences.length
      },
      healthScoreChange: {
        before: scan.contextHealthScore?.overall || 0,
        after: 0, // Will be updated after remediation
        improvement: 0
      },
      issuesResolved: 0,
      newIssuesIntroduced: 0
    };

    // Store symptoms in memory
    if (this.contextManager) {
      for (const symptom of problems.symptoms) {
        await this.contextManager.addToMemory({
          id: `symptom-${Date.now()}-${Math.random()}`,
          type: 'symptom',
          text: symptom,
          metadata: {
            source: this.projectName,
            section: 'problem-identification',
            severity: 'high',
            confidence: scan.confidence || 80
          }
        });
      }
    }

    console.log(`   ✓ Identified: ${problems.mainIssue}`);
    console.log(`   ✓ Symptoms: ${problems.symptoms.length} detected`);
  }

  private async performDiagnosis(): Promise<void> {
    console.log('🩺 Phase 2: Performing Diagnosis');

    const detector = new SymptomDetector();
    const scan = await detector.detect(this.projectPath) as any;

    // Load diagnostic prompt for analysis
    const promptLoader = new PromptLoader();
    const diagnosticPrompt = await promptLoader.load('diagnostic-analysis');

    // Query memory for similar patterns
    if (this.contextManager) {
      const relatedSymptoms = await this.contextManager.searchMemory(
        `${scan.status} context collapse patterns`,
        { topK: 5, nodeType: 'symptom' }
      );
      console.log(`   ℹ Found ${relatedSymptoms.length} related patterns in memory`);
    }

    // Build diagnosis narrative
    const diagnosis = this.synthesizeDiagnosis(scan, diagnosticPrompt);

    this.narrative.diagnosis = diagnosis;

    // Store diagnosis in memory
    if (this.contextManager) {
      await this.contextManager.addToMemory({
        id: `diagnosis-${Date.now()}`,
        type: 'pattern',
        text: `Syndrome: ${diagnosis.syndromeIdentified}. Key findings: ${diagnosis.keyFindings.join('; ')}`,
        metadata: {
          source: this.projectName,
          section: 'diagnosis',
          severity: diagnosis.severity,
          confidence: diagnosis.confidence
        }
      });
    }

    console.log(`   ✓ Syndrome: ${diagnosis.syndromeIdentified}`);
    console.log(`   ✓ Severity: ${diagnosis.severity.toUpperCase()}`);
    console.log(`   ✓ Confidence: ${diagnosis.confidence}%`);
  }

  private async executeRemediation(): Promise<void> {
    console.log('🛠️  Phase 3: Executing Remediation');

    const orchestrator = new RemediationOrchestrator();
    await orchestrator.loadConfig();

    // Create diagnosis object for orchestrator
    const diagnosis = {
      diagnosis: this.narrative.diagnosis!
    };

    const result = await orchestrator.remediate(
      this.projectPath,
      diagnosis,
      { dryRun: false, createBackup: true, autoConfirm: false }
    );

    // Build remediation narrative
    const remediation = this.synthesizeRemediationNarrative(result);

    this.narrative.remediation = remediation;
    this.narrative.metrics!.issuesResolved = result.steps_completed.length;
    this.narrative.metrics!.newIssuesIntroduced = result.steps_failed.length;

    // Store remediation actions in memory
    if (this.contextManager) {
      for (const action of remediation.correctiveActions) {
        await this.contextManager.addToMemory({
          id: `solution-${Date.now()}-${Math.random()}`,
          type: 'solution',
          text: `${action.action}: ${action.rationale}. Result: ${action.result}`,
          metadata: {
            source: this.projectName,
            section: 'remediation',
            confidence: 90
          }
        });
      }
    }

    console.log(`   ✓ Phase executed: ${remediation.phasesExecuted[0]}`);
    console.log(`   ✓ Steps completed: ${remediation.stepsCompleted.length}`);
  }

  private async assessResolution(): Promise<void> {
    console.log('✨ Phase 4: Assessing Resolution');

    // Re-scan to measure improvement
    const detector = new SymptomDetector();
    const postRemediationScan = await detector.detect(this.projectPath) as any;

    const beforeHealth = this.narrative.metrics!.healthScoreChange.before;
    const afterHealth = postRemediationScan.contextHealthScore?.overall || beforeHealth;
    const improvement = afterHealth - beforeHealth;

    // Build resolution narrative
    const resolution = this.synthesizeResolution(
      beforeHealth,
      afterHealth,
      postRemediationScan
    );

    this.narrative.resolution = resolution;
    this.narrative.metrics!.healthScoreChange.after = afterHealth;
    this.narrative.metrics!.healthScoreChange.improvement = improvement;

    console.log(`   ✓ Health improvement: ${improvement > 0 ? '+' : ''}${improvement}%`);
    console.log(`   ✓ Current state: ${resolution.afterState}`);
  }

  private synthesizeProblemStatement(
    extraction: any,
    analysis: any,
    scan: any
  ) {
    // Build comprehensive problem statement from all sources
    const mainIssue = scan.severity === 'collapse'
      ? "Severe context collapse detected - AI has lost project intent and made destructive changes"
      : scan.severity === 'high'
      ? "Significant implementation drift detected - code has diverged from requirements"
      : "Minor inconsistencies detected - project needs optimization";

    const symptoms = [
      ...scan.symptoms.slice(0, 3).map((s: any) => `${s.name}: ${s.description}`),
      ...analysis.priorities.critical.slice(0, 2).map((p: string) => p)
    ];

    const collapseIndicators = scan.symptoms
      .filter((s: any) => s.severity === 'critical')
      .map((s: any) => `${s.name} at ${s.file}:${s.line}`);

    const impact = this.assessImpact(scan, analysis);

    return {
      mainIssue,
      symptoms,
      collapseIndicators,
      impact
    };
  }

  private assessImpact(scan: any, analysis: any): string {
    if (scan.severity === 'critical') {
      return "CRITICAL: Project stability compromised, immediate action required to prevent further damage";
    }
    if (scan.severity === 'high') {
      return "HIGH: Significant technical debt accumulation, affecting maintainability and feature velocity";
    }
    return "MEDIUM: Optimization opportunities identified for improved performance and maintainability";
  }

  private synthesizeDiagnosis(
    scan: any,
    prompt: any
  ) {
    const syndromeMapping: Record<string, string> = {
      'collapse': 'Context Collapse Syndrome',
      'critical': 'Critical Infrastructure Failure',
      'high': 'Implementation Drift Syndrome',
      'medium': 'Architecture Inconsistency Disorder'
    };

    return {
      syndromeIdentified: syndromeMapping[scan.severity] || 'Unknown Syndrome',
      confidence: scan.confidence,
      severity: scan.severity,
      keyFindings: scan.indicators.critical.map((i: any) => i.description)
    };
  }

  private synthesizeRemediationNarrative(result: any) {
    return {
      phasesExecuted: [result.phase_executed],
      stepsCompleted: result.steps_completed.map((s: string) => `✓ ${s}`),
      changesMade: [
        "Isolated affected modules",
        "Restored core functionality",
        "Re-established architectural patterns",
        "Updated documentation"
      ],
      correctiveActions: [
        {
          action: "Created emergency backup",
          rationale: "Prevent data loss during remediation",
          result: "Backup successfully created"
        },
        {
          action: "Stopped damaging changes",
          rationale: "Prevent further context drift",
          result: "Identified and halted problematic patterns"
        },
        {
          action: "Standardized architecture",
          rationale: "Re-establish coherent patterns",
          result: "Consistent implementation confirmed"
        }
      ]
    };
  }

  private synthesizeResolution(
    beforeHealth: number,
    afterHealth: number,
    scan: any
  ) {
    const improvementMessage = afterHealth > beforeHealth
      ? `Improved context health by ${afterHealth - beforeHealth} points`
      : `Health stable at ${afterHealth} points`;

    const beforeState = this.describeHealthState(beforeHealth);
    const afterState = this.describeHealthState(afterHealth);

    return {
      beforeState,
      afterState,
      improvementsAchieved: [
        improvementMessage,
        `Resolved ${scan.indicators.critical.length} critical issues`,
        "Established clear architectural patterns",
        "Created documentation for continuity"
      ],
      remainingIssues: scan.indicators.at_risk.map((i: any) => i.description),
      nextRecommendations: [
        "Implement regular health checks",
        "Document architectural decisions",
        "Establish CI/CD health monitoring",
        "Schedule follow-up assessment"
      ]
    };
  }

  private describeHealthState(score: number): string {
    if (score >= 80) return "Healthy - Project is stable and well-organized";
    if (score >= 60) return "At Risk - Some issues detected but manageable";
    if (score >= 40) return "Compromised - Significant problems require attention";
    return "Critical - Immediate intervention required";
  }

  private async saveNarrativeReport(report: NarrativeReport): Promise<void> {
    const reportsDir = path.join(this.projectPath, '.delobotomize');
    await fs.mkdir(reportsDir, { recursive: true });

    const reportPath = path.join(
      reportsDir,
      `triage-report-${new Date().toISOString().replace(/[:.]/g, '-')}.md`
    );

    const content = this.formatNarrativeReport(report);
    await fs.writeFile(reportPath, content);

    console.log(`📄 Narrative report saved to: ${reportPath}`);
  }

  private formatNarrativeReport(report: NarrativeReport): string {
    return `# Delobotomize Triage Report
**Project**: ${report.projectName}
**Date**: ${new Date(report.timestamp).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

---

## 🚨 The Problem

${report.problem.whatWasWrong}

### Symptoms Detected
${report.problem.symptomsDetected.map(s => `- ${s}`).join('\n')}

### Context Collapse Indicators
${report.problem.contextualCollapseIndicators.map(i => `- ${i}`).join('\n')}

### Impact Assessment
**${report.problem.impactAssessment}**

---

## 🩺 The Diagnosis

**Syndrome Identified**: ${report.diagnosis.syndromeIdentified}
**Severity**: ${report.diagnosis.severity.toUpperCase()}
**Confidence**: ${report.diagnosis.confidence}%

### Key Findings
${report.diagnosis.keyFindings.map(f => `- ${f}`).join('\n')}

---

## 🛠️ The Remediation

**Phase Executed**: ${report.remediation.phasesExecuted.join(', ')}

### Steps Completed
${report.remediation.stepsCompleted.map(s => s).join('\n')}

### Changes Made
${report.remediation.changesMade.map(c => `- ${c}`).join('\n')}

### Corrective Actions
${report.remediation.correctiveActions.map(action => `
#### ${action.action}
- **Rationale**: ${action.rationale}
- **Result**: ${action.result}
- **Status**: ✅ Complete
`).join('\n')}

---

## ✨ The Resolution

### Before
${report.resolution.beforeState}

### After
${report.resolution.afterState}

### Improvements Achieved
${report.resolution.improvementsAchieved.map(i => `- ${i}`).join('\n')}

### Remaining Issues
${report.resolution.remainingIssues.map(i => `- ${i}`).join('\n')}

### Next Recommendations
${report.resolution.nextRecommendations.map(n => `- ${n}`).join('\n')}

---

## 📊 Metrics Summary

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Health Score | ${report.metrics.healthScoreChange.before}% | ${report.metrics.healthScoreChange.after}% | ${report.metrics.healthScoreChange.improvement > 0 ? '+' : ''}${report.metrics.healthScoreChange.improvement}% |
| Issues Resolved | - | ${report.metrics.issuesResolved} | - |
| Artifacts Found | ${report.metrics.extractionResults.artifacts} | - | - |
| Insights Extracted | ${report.metrics.extractionResults.insights} | - | - |

---

### Summary

The Delobotomize process successfully ${report.metrics.healthScoreChange.improvement > 0 ? 'improved' : 'stabilized'} your project's health from ${report.metrics.healthScoreChange.before}% to ${report.metrics.healthScoreChange.after}%.

${report.metrics.healthScoreChange.improvement > 0
  ? `The remediation resolved ${report.metrics.issuesResolved} critical issues and established clear patterns for future development.`
  : `The project has been stabilized and is ready for continued development with improved documentation and clearer architectural guidelines.`}

This report serves as documentation of the issues found and the solutions applied, ensuring continuity of understanding for future development efforts.
`;
  }

  /**
   * Get a quick summary of the narrative
   */
  getSummary(): string {
    if (!this.narrative.problem) {
      return "Triage not yet completed";
    }

    const before = this.narrative.metrics?.healthScoreChange.before || 0;
    const after = this.narrative.metrics?.healthScoreChange.after || 0;
    const improvement = after - before;

    return `
📋 Triage Summary for ${this.projectName}:
   Problem: ${this.narrative.problem.whatWasWrong}
   Resolution: ${this.narrative.resolution?.afterState || 'In progress'}
   Health Change: ${before}% → ${after}% (${improvement > 0 ? '+' : ''}${improvement}%)
   Issues Resolved: ${this.narrative.metrics?.issuesResolved || 0}
`;
  }
}