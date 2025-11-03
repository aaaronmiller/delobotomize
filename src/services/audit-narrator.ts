import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export interface NarrativeChunk {
  id: string;
  timestamp: string;
  type: 'issue_found' | 'analysis_start' | 'fix_planned' | 'fix_applied' | 'validation' | 'summary';
  content: string;
  data?: any;
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

export interface AuditNarrative {
  sessionId: string;
  projectPath: string;
  projectName: string;
  startTime: string;
  lastUpdate: string;
  status: 'scanning' | 'analyzing' | 'fixing' | 'validating' | 'complete' | 'failed';

  // Living document sections
  sections: {
    overview: string;
    issuesFound: Array<{
      id: string;
      file: string;
      description: string;
      severity: string;
      status: 'identified' | 'analyzing' | 'planned' | 'fixing' | 'fixed' | 'failed';
    }>;
    crossFileAnalysis: Array<{
      description: string;
      files: string[];
      impact: string;
      resolution: string;
    }>;
    remediationSteps: Array<{
      step: number;
      action: string;
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      result?: string;
    }>;
    currentStatus: string;
  };

  // Operation log for undo/restore
  operations: Array<{
    id: string;
    timestamp: string;
    operation: string;
    target: string;
    before?: string;
    after?: string;
    backupPath?: string;
    metadata?: any;
  }>;

  // Metrics
  metrics: {
    filesScanned: number;
    issuesFound: number;
    issuesFixed: number;
    issuesRemaining: number;
    tokensUsed: number;
    cost: number;
    duration: number;
  };
}

/**
 * Enhanced audit narrator that creates living documents
 * updating throughout the audit process, surviving context wipes
 */
export class AuditNarrator extends EventEmitter {
  private narrative: AuditNarrative;
  private savePath: string;
  private saveInterval: number = 30000; // Save every 30 seconds
  private saveTimer?: NodeJS.Timeout;

  constructor(projectPath: string, sessionId?: string) {
    super();

    this.projectPath = projectPath;
    this.projectName = path.basename(projectPath);
    this.sessionId = sessionId || this.generateSessionId();

    this.narrative = {
      sessionId: this.sessionId,
      projectPath,
      projectName: this.projectName,
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      status: 'scanning',
      sections: {
        overview: 'Initializing audit...',
        issuesFound: [],
        crossFileAnalysis: [],
        remediationSteps: [],
        currentStatus: 'Starting scan'
      },
      operations: [],
      metrics: {
        filesScanned: 0,
        issuesFound: 0,
        issuesFixed: 0,
        issuesRemaining: 0,
        tokensUsed: 0,
        cost: 0,
        duration: 0
      }
    };

    this.savePath = path.join(projectPath, '.delobotomize', 'narratives');
    this.startAutoSave();
  }

  private generateSessionId(): string {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '-')
      .substring(0, 19);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  /**
   * Add a chunk to the living narrative
   */
  async addChunk(chunk: NarrativeChunk): Promise<void> {
    this.narrative.lastUpdate = new Date().toISOString();

    // Update based on chunk type
    switch (chunk.type) {
      case 'issue_found':
        this.narrative.sections.issuesFound.push({
          id: chunk.id,
          file: chunk.data?.file || 'unknown',
          description: chunk.content,
          severity: chunk.severity || 'medium',
          status: 'identified'
        });
        this.narrative.metrics.issuesFound++;
        break;

      case 'analysis_start':
        this.narrative.status = 'analyzing';
        this.narrative.sections.currentStatus = chunk.content;
        break;

      case 'fix_planned':
        this.narrative.sections.remediationSteps.push({
          step: this.narrative.sections.remediationSteps.length + 1,
          action: chunk.content,
          status: 'pending'
        });
        break;

      case 'fix_applied':
        const step = this.narrative.sections.remediationSteps.find(
          s => s.action.includes(chunk.data?.issueId || '')
        );
        if (step) {
          step.status = 'completed';
          step.result = chunk.content;
        }
        this.narrative.metrics.issuesFixed++;
        break;

      case 'validation':
        this.narrative.status = 'validating';
        this.narrative.sections.currentStatus = chunk.content;
        break;

      case 'summary':
        this.narrative.status = 'complete';
        this.narrative.sections.overview = chunk.content;
        break;
    }

    // Emit for subscribers
    this.emit('chunk', chunk);

    // Auto-save
    await this.save();
  }

  /**
   * Log an operation for undo/restore capability
   */
  async logOperation(operation: {
    operation: string;
    target: string;
    before?: string;
    after?: string;
    backupPath?: string;
    metadata?: any;
  }): Promise<void> {
    const logEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...operation
    };

    this.narrative.operations.push(logEntry);
    this.emit('operation', logEntry);
    await this.save();
  }

  /**
   * Update cross-file analysis section
   */
  async addCrossFileAnalysis(analysis: {
    description: string;
    files: string[];
    impact: string;
    resolution: string;
  }): Promise<void> {
    this.narrative.sections.crossFileAnalysis.push(analysis);
    this.emit('crossFileAnalysis', analysis);
    await this.save();
  }

  /**
   * Update metrics
   */
  async updateMetrics(metrics: Partial<AuditNarrative['metrics']>): Promise<void> {
    Object.assign(this.narrative.metrics, metrics);

    // Calculate remaining issues
    this.narrative.metrics.issuesRemaining =
      this.narrative.metrics.issuesFound - this.narrative.metrics.issuesFixed;

    // Calculate duration
    const startTime = new Date(this.narrative.startTime);
    const now = new Date();
    this.narrative.metrics.duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    this.emit('metrics', this.narrative.metrics);
    await this.save();
  }

  /**
   * Get current narrative
   */
  getCurrentNarrative(): AuditNarrative {
    return { ...this.narrative };
  }

  /**
   * Generate markdown representation
   */
  toMarkdown(): string {
    const { sections, metrics, operations } = this.narrative;

    return `# Delobotomize Audit Narrative
**Session**: ${this.sessionId}
**Project**: ${this.projectName}
**Path**: ${this.projectPath}
**Started**: ${new Date(this.narrative.startTime).toLocaleString()}
**Last Updated**: ${new Date(this.narrative.lastUpdate).toLocaleString()}
**Status**: ${this.narrative.status.toUpperCase()}

---

## 📊 Overview

${sections.overview}

**Current Status**: ${sections.currentStatus}

---

## 🎯 Metrics

- **Files Scanned**: ${metrics.filesScanned}
- **Issues Found**: ${metrics.issuesFound}
- **Issues Fixed**: ${metrics.issuesFixed}
- **Issues Remaining**: ${metrics.issuesRemaining}
- **Tokens Used**: ${metrics.tokensUsed.toLocaleString()}
- **Cost**: $${metrics.cost.toFixed(4)}
- **Duration**: ${Math.floor(metrics.duration / 60)}m ${metrics.duration % 60}s

---

## 🚨 Issues Found

${sections.issuesFound.length === 0
  ? 'No issues detected yet...'
  : sections.issuesFound.map(issue => `
### ${issue.id} - ${issue.severity.toUpperCase()}
**File**: \`${issue.file}\`
**Description**: ${issue.description}
**Status**: ${issue.status}
`).join('\n')
}

---

## 🔗 Cross-File Analysis

${sections.crossFileAnalysis.length === 0
  ? 'No cross-file dependencies identified yet...'
  : sections.crossFileAnalysis.map(analysis => `
### ${analysis.description}
**Files**: ${analysis.files.map(f => `\`${f}\``).join(', ')}
**Impact**: ${analysis.impact}
**Resolution**: ${analysis.resolution}
`).join('\n')
}

---

## 🛠️ Remediation Steps

${sections.remediationSteps.length === 0
  ? 'No remediation steps planned yet...'
  : sections.remediationSteps.map(step => `
### Step ${step.step}: ${step.action}
**Status**: ${step.status}
${step.result ? `**Result**: ${step.result}` : ''}
`).join('\n')
}

---

## 📝 Operation Log

${operations.slice(-10).map(op => `
### ${op.operation} - ${new Date(op.timestamp).toLocaleTimeString()}
**Target**: \`${op.target}\`
${op.backupPath ? `**Backup**: \`${op.backupPath}\`` : ''}
${op.metadata ? `**Metadata**: \`${JSON.stringify(op.metadata, null, 2)}\`` : ''}
`).join('\n')
}

---

## 💾 Session Data

This narrative is a living document that updates throughout the audit process. It survives context wipes and restarts.

**Session ID**: `${this.sessionId}`
**Save Location**: \`${path.join(this.projectPath, '.delobotomize', 'narratives', `${this.sessionId}.json`}\`

To restore operations, use the operation log entries above with: \`delobotomize restore <path> <timestamp>\`

---

*Last updated: ${new Date().toLocaleString()}*
`;
  }

  /**
   * Save narrative to disk
   */
  async save(): Promise<void> {
    try {
      await fs.mkdir(this.savePath, { recursive: true });

      const narrativeFile = path.join(this.savePath, `${this.sessionId}.json`);
      const markdownFile = path.join(this.savePath, `${this.sessionId}.md`);

      // Save structured JSON for programmatic access
      await fs.writeFile(narrativeFile, JSON.stringify(this.narrative, null, 2));

      // Save markdown for human reading
      await fs.writeFile(markdownFile, this.toMarkdown());

    } catch (error) {
      console.error('Failed to save narrative:', error);
    }
  }

  /**
   * Load existing narrative
   */
  static async load(projectPath: string, sessionId: string): Promise<AuditNarrative | null> {
    try {
      const narrativeFile = path.join(projectPath, '.delobotomize', 'narratives', `${sessionId}.json`);
      const content = await fs.readFile(narrativeFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * List all narrative sessions
   */
  static async listSessions(projectPath: string): Promise<Array<{ sessionId: string; startTime: string; status: string }>> {
    try {
      const narrativesPath = path.join(projectPath, '.delobotomize', 'narratives');
      const files = await fs.readdir(narrativesPath);
      const sessions = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const sessionId = file.slice(0, -5);
          const narrative = await AuditNarrator.load(projectPath, sessionId);
          if (narrative) {
            sessions.push({
              sessionId,
              startTime: narrative.startTime,
              status: narrative.status
            });
          }
        }
      }

      return sessions.sort((a, b) => b.startTime.localeCompare(a.startTime));
    } catch {
      return [];
    }
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    this.saveTimer = setInterval(() => {
      this.save().catch(console.error);
    }, this.saveInterval);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = undefined;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stopAutoSave();
    await this.save();
    this.removeAllListeners();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}