import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export interface OperationLog {
  id: string;
  timestamp: string;
  sessionId: string;
  category: 'file' | 'llm' | 'backup' | 'validation' | 'user' | 'system';
  operation: string;
  target?: string;
  details?: any;
  before?: any;
  after?: any;
  result?: 'success' | 'failure' | 'partial' | 'skipped';
  reason?: string;
  duration?: number;
  metadata?: {
    tokens?: number;
    cost?: number;
    model?: string;
    method?: string;
    backupId?: string;
  };
}

export interface OperationLogFilter {
  sessionId?: string;
  category?: OperationLog['category'];
  operation?: string;
  target?: string;
  result?: OperationLog['result'];
  since?: string;
  until?: string;
}

/**
 * Granular operation logger for audit tracking and undo/restore
 */
export class OperationLogger extends EventEmitter {
  private logPath: string;
  private buffer: OperationLog[] = [];
  private bufferSize: number = 1000;
  private flushTimer?: NodeJS.Timeout;
  private flushInterval: number = 5000; // Flush every 5 seconds

  constructor(private projectPath: string, private sessionId: string) {
    this.logPath = path.join(projectPath, '.delobotomize', 'logs');
    this.startFlushTimer();
  }

  /**
   * Log an operation
   */
  async log(operation: Omit<OperationLog, 'id' | 'timestamp' | 'sessionId'>): Promise<void> {
    const entry: OperationLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      ...operation
    };

    this.buffer.push(entry);
    this.emit('log', entry);

    // Immediately flush for critical operations
    if (entry.category === 'llm' || entry.result === 'failure') {
      await this.flush();
    }
  }

  /**
   * Log file operation
   */
  async logFile(operation: {
    operation: 'read' | 'write' | 'delete' | 'move' | 'copy';
    target: string;
    before?: string;
    after?: string;
    result?: OperationLog['result'];
    reason?: string;
    duration?: number;
  }): Promise<void> {
    await this.log({
      category: 'file',
      operation: `file.${operation.operation}`,
      target: operation.target,
      before: operation.before,
      after: operation.after,
      result: operation.result,
      reason: operation.reason,
      duration: operation.duration
    });
  }

  /**
   * Log LLM operation
   */
  async logLLM(operation: {
    operation: 'analyze' | 'generate_fix' | 'validate';
    target?: string;
    prompt?: string;
    response?: string;
    tokens?: number;
    cost?: number;
    model?: string;
    method?: string;
    result?: OperationLog['result'];
    reason?: string;
    duration?: number;
  }): Promise<void> {
    await this.log({
      category: 'llm',
      operation: `llm.${operation.operation}`,
      target: operation.target,
      details: {
        prompt: operation.prompt,
        response: operation.response
      },
      result: operation.result,
      reason: operation.reason,
      duration: operation.duration,
      metadata: {
        tokens: operation.tokens,
        cost: operation.cost,
        model: operation.model,
        method: operation.method
      }
    });
  }

  /**
   * Log backup operation
   */
  async logBackup(operation: {
    operation: 'create' | 'restore' | 'delete';
    backupId?: string;
    files?: string[];
    result?: OperationLog['result'];
    reason?: string;
    duration?: number;
  }): Promise<void> {
    await this.log({
      category: 'backup',
      operation: `backup.${operation.operation}`,
      target: operation.backupId,
      details: { files: operation.files },
      result: operation.result,
      reason: operation.reason,
      duration: operation.duration,
      metadata: {
        backupId: operation.backupId
      }
    });
  }

  /**
   * Log validation operation
   */
  async logValidation(operation: {
    operation: 'syntax' | 'semantic' | 'integration';
    target?: string;
    expected?: any;
    actual?: any;
    result?: OperationLog['result'];
    reason?: string;
    duration?: number;
  }): Promise<void> {
    await this.log({
      category: 'validation',
      operation: `validation.${operation.operation}`,
      target: operation.target,
      before: operation.expected,
      after: operation.actual,
      result: operation.result,
      reason: operation.reason,
      duration: operation.duration
    });
  }

  /**
   * Log user interaction
   */
  async logUser(operation: {
    operation: 'approve' | 'reject' | 'modify' | 'skip';
    target?: string;
    details?: string;
    result?: OperationLog['result'];
  }): Promise<void> {
    await this.log({
      category: 'user',
      operation: `user.${operation.operation}`,
      target: operation.target,
      details: operation.details,
      result: operation.result
    });
  }

  /**
   * Query logs with filters
   */
  async query(filter: OperationLogFilter = {}): Promise<OperationLog[]> {
    await this.flush();

    try {
      const logFile = path.join(this.logPath, `${this.sessionId}.log выберите`);
      const content = await fs.readFile(logFile, 'utf-8');
      const logs: OperationLog[] = JSON.parse(content);

      return logs.filter(entry => {
        if (filter.sessionId && entry.sessionId !== filter.sessionId) return false;
        if (filter.category && entry.category !== filter.category) return false;
        if (filter.operation && !entry.operation.includes(filter.operation)) return false;
        if (filter.target && entry.target !== filter.target) return false;
        if (filter.result && entry.result !== filter.result) return false;
        if (filter.since && entry.timestamp < filter.since) return false;
        if (filter.until && entry.timestamp > filter.until) return false;
        return true;
      }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    } catch {
      return [];
    }
  }

  /**
   * Get operation history for undo/restore UI
   */
  async getOperationHistory(
    sessionId?: string,
    limit: number = 50
  ): Promise<Array<{
    entry: OperationLog;
    undoable: boolean;
    undoCommand?: string;
  }>> {
    const history = await this.query({ sessionId: sessionId || this.sessionId });
    const result = [];

    for (const entry of history.slice(0, limit)) {
      const undoable = this.canUndo(entry);
      result.push({
        entry,
        undoable,
        undoCommand: undoable ? this.generateUndoCommand(entry) : undefined
      });
    }

    return result;
  }

  /**
   * Generate undo command for operation
   */
  private canUndo(entry: OperationLog): boolean {
    const fileOps = ['file.write', 'file.delete', 'file.move'];
    const backupOps = ['backup.restore', 'backup.create'];
    return fileOps.includes(entry.operation) && entry.result === 'success' ||
           backupOps.includes(entry.operation) && entry.result === 'success';
  }

  /**
   * Generate undo command
   */
  private generateUndoCommand(entry: OperationLog): string {
    switch (entry.operation) {
      case 'file.write':
        if (entry.metadata?.backupId) {
          return `delobotomize restore ${entry.target} ${entry.metadata.backupId}`;
        }
        break;
      case 'file.delete':
        return `echo "${entry.before}" > ${entry.target}`;
      case 'file.move':
        return `mv ${entry.after} ${entry.target}`;
      case 'backup.restore':
        if (entry.metadata?.backupId) {
          // Get previous backup ID
          return `delobotomize restore ${this.projectPath} <previous-backup-id>`;
        }
        break;
    }
    return '# Undo not available for this operation';
  }

  /**
   * Calculate statistics
   */
  async getStats(sessionId?: string): Promise<{
    totalOperations: number;
    operationsByCategory: Record<string, number>;
    operationsByResult: Record<string, number>;
    totalTokens: number;
    totalCost: number;
    averageDuration: number;
  }> {
    const logs = await this.query({ sessionId: sessionId || this.sessionId });

    const stats = {
      totalOperations: logs.length,
      operationsByCategory: {} as Record<string, number>,
      operationsByResult: {} as Record<string, number>,
      totalTokens: 0,
      totalCost: 0,
      averageDuration: 0,
      durations: [] as number[]
    };

    for (const log of logs) {
      // Count by category
      stats.operationsByCategory[log.category] =
        (stats.operationsByCategory[log.category] || 0) + 1;

      // Count by result
      stats.operationsByResult[log.result] =
        (stats.operationsByResult[log.result] || 0) + 1;

      // Aggregate tokens and cost
      if (log.metadata?.tokens) {
        stats.totalTokens += log.metadata.tokens;
      }
      if (log.metadata?.cost) {
        stats.totalCost += log.metadata.cost;
      }

      // Collect durations
      if (log.duration) {
        stats.durations.push(log.duration);
      }
    }

    // Calculate average duration
    if (stats.durations.length > 0) {
      stats.averageDuration = stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length;
    }

    return stats;
  }

  /**
   * Export operations for test generation
   */
  async exportForTest(sessionId?: string): Promise<string> {
    const logs = await this.query({ sessionId: sessionId || this.sessionId });

    const testContent = `
// Auto-generated test from operation log
// Session: ${sessionId || this.sessionId}
// Generated: ${new Date().toISOString()}

describe('Delobotomize Operations Test', () => {
  ${this.generateTestCases(logs).join('\n\n  ')}
});
    `.trim();

    const exportPath = path.join(this.logPath, `${this.sessionId}-test.gen.ts`);
    await fs.writeFile(exportPath, testContent);

    return exportPath;
  }

  /**
   * Generate test cases from logs
   */
  private generateTestCases(logs: OperationLog[]): string[] {
    const cases: string[] = [];

    for (const log of logs.slice(0, 20)) { // Limit to first 20 ops
      switch (log.operation) {
        case 'file.write':
          cases.push(`it('should have written to ${log.target}', () => {
  // ${log.reason || 'File write operation'}
  expect(fileExists('${log.target}')).toBe(true);
});`);
          break;

        case 'llm.analyze':
          cases.push(`it('should have analyzed ${log.target || 'content'}', () => {
  // ${log.reason || 'LLM analysis operation'}
  expect(result.issuesFound).toBeGreaterThan(0);
});`);
          break;

        case 'validation.syntax':
          cases.push(`it('should have validated ${log.target}', () => {
  // ${log.reason || 'Syntax validation'}
  expect(isValid('${log.target}')).toBe(true);
});`);
          break;
      }
    }

    return cases;
  }

  /**
   * Flush buffer to disk
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    try {
      await fs.mkdir(this.logPath, { recursive: true });

      const logFile = path.join(this.logPath, `${this.sessionId}.log`);
      let existingLogs: OperationLog[] = [];

      try {
        const content = await fs.readFile(logFile, 'utf-8');
        existingLogs = JSON.parse(content);
      } catch {
        // File doesn't exist yet
      }

      // Append buffer to existing logs
      const allLogs = [...existingLogs, ...this.buffer];

      // Write back
      await fs.writeFile(logFile, JSON.stringify(allLogs, null, 2));

      // Clear buffer
      this.buffer = [];

    } catch (error) {
      console.error('Failed to flush operation log:', error);
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.flushInterval);
  }

  /**
   * Stop flush timer
   */
  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stopFlushTimer();
    await this.flush();
    this.removeAllListeners();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}