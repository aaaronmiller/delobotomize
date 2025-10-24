import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { spawn, ChildProcess } from 'child_process';
import { SymptomDetector } from '../core/symptom-detector';
import { PromptLoader } from '../core/prompt-loader';

interface WorkflowPhase {
  name: string;
  description: string;
  priority: number;
  estimated_duration: string;
  steps: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  script?: string;
  depends_on?: string[];
  required: boolean;
  rollback_point?: boolean;
  validation?: string[];
  fallback?: string;
}

interface RemediationConfig {
  workflow: any;
  phases: Record<string, WorkflowPhase>;
  recovery_strategies: any;
  rollback_procedures: any;
  monitoring?: any;
  optimization_config?: any;
}

interface RemediationResult {
  workflow_id: string;
  phase_executed: string;
  steps_completed: string[];
  steps_failed: string[];
  total_duration_ms: number;
  success: boolean;
  artifacts: {
    backup_path?: string;
    logs: string[];
    metrics: Record<string, any>;
  };
}

/**
 * Tier 1 Critical Component for orchestrating remediation workflows
 * Designed for iterative optimization with externalized YAML configuration
 */
export class RemediationOrchestrator {
  private config: RemediationConfig | null = null;
  private configPath = './workflows/remediation.yaml';
  private symptomDetector: SymptomDetector;
  private promptLoader: PromptLoader;
  private executionLog: string[] = [];

  constructor(configPath?: string) {
    if (configPath) {
      this.configPath = configPath;
    }
    this.symptomDetector = new SymptomDetector();
    this.promptLoader = new PromptLoader();
  }

  async loadConfig(): Promise<void> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      this.config = yaml.parse(content);
      this.log('Config loaded successfully');
    } catch (error) {
      throw new Error(`Failed to load workflow config: ${error}`);
    }
  }

  async remediate(
    projectPath: string,
    diagnosis: any,
    options: {
      dryRun?: boolean;
      createBackup?: boolean;
      autoConfirm?: boolean;
    } = {}
  ): Promise<RemediationResult> {
    const startTime = Date.now();

    if (!this.config) {
      await this.loadConfig();
    }

    this.log(`Starting remediation for ${projectPath}`);
    this.log(`Diagnosis: ${diagnosis.diagnosis?.syndrome_detected || 'unknown'}`);

    // Determine entry point based on diagnosis
    const entryPoint = this.determineEntryPoint(diagnosis);
    const phase = this.config!.phases[entryPoint];

    if (!phase) {
      throw new Error(`No phase found for entry point: ${entryPoint}`);
    }

    // Create backup if critical
    if (options.createBackup && diagnosis.diagnosis?.severity === 'critical') {
      await this.createBackup(projectPath);
    }

    // Execute the workflow phase
    const result = await this.executePhase(projectPath, phase, options);

    result.total_duration_ms = Date.now() - startTime;
    result.artifacts.logs = this.executionLog;

    this.log(`Remediation completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);

    return result;
  }

  private determineEntryPoint(diagnosis: any): string {
    if (!diagnosis.diagnosis?.severity) {
      return 'optimization_phase';
    }

    const triggers = this.config!.workflow.triggers;
    const severity = diagnosis.diagnosis.severity;

    for (const trigger of triggers) {
      if (trigger.condition.includes(severity)) {
        return trigger.entry_point;
      }
    }

    return 'optimization_phase';
  }

  private async executePhase(
    projectPath: string,
    phase: WorkflowPhase,
    options: any
  ): Promise<RemediationResult> {
    const result: RemediationResult = {
      workflow_id: this.config!.workflow.id,
      phase_executed: phase.name,
      steps_completed: [],
      steps_failed: [],
      total_duration_ms: 0,
      success: false,
      artifacts: {
        logs: [],
        metrics: {}
      }
    };

    this.log(`Executing phase: ${phase.name}`);

    // Build execution order based on dependencies
    const executionOrder = this.resolveDependencies(phase.steps);

    for (const step of executionOrder) {
      try {
        this.log(`Executing step: ${step.name}`);
        const stepResult = await this.executeStep(projectPath, step, options);

        if (stepResult.success) {
          result.steps_completed.push(step.id);
          this.log(`Step completed: ${step.name}`);
        } else {
          result.steps_failed.push(step.id);
          this.log(`Step failed: ${step.name} - ${stepResult.error}`);

          if (step.required) {
            // Critical step failed, stop execution
            this.log('Critical step failed - stopping workflow');
            await this.handleRollback(projectPath, step);
            break;
          }
        }
      } catch (error: any) {
        result.steps_failed.push(step.id);
        this.log(`Step error: ${step.name} - ${error.message}`);

        if (step.required) {
          await this.handleRollback(projectPath, step);
          break;
        }
      }
    }

    result.success = result.steps_failed.length === 0;
    return result;
  }

  private resolveDependencies(steps: WorkflowStep[]): WorkflowStep[] {
    const resolved: WorkflowStep[] = [];
    const visited = new Set<string>();

    const visit = (step: WorkflowStep) => {
      if (visited.has(step.id)) return;
      visited.add(step.id);

      if (step.depends_on) {
        for (const depId of step.depends_on) {
          const dep = steps.find(s => s.id === depId);
          if (dep) visit(dep);
        }
      }

      resolved.push(step);
    };

    for (const step of steps) {
      visit(step);
    }

    return resolved;
  }

  private async executeStep(
    projectPath: string,
    step: WorkflowStep,
    options: any
  ): Promise<{ success: boolean; error?: string }> {
    if (options.dryRun) {
      this.log(`[DRY RUN] Would execute: ${step.name}`);
      return { success: true };
    }

    try {
      switch (step.type) {
        case 'automation':
        case 'script':
          return await this.executeScript(projectPath, step.script || step.id + '.ts', options);

        case 'analysis':
          return await this.executeAnalysis(projectPath, step);

        case 'recovery':
          return await this.executeRecovery(projectPath, step);

        default:
          return { success: true }; // Default success for undefined types
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async executeScript(
    projectPath: string,
    scriptPath: string,
    options: any
  ): Promise<{ success: boolean; error?: string }> {
    const fullPath = path.resolve(scriptPath);

    return new Promise((resolve) => {
      const childProcess: ChildProcess = spawn('ts-node', [fullPath, projectPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      childProcess.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      childProcess.on('close', (code: number | null) => {
        if (code === 0) {
          this.log(`Script output: ${output.substring(0, 200)}...`);
          resolve({ success: true });
        } else {
          this.log(`Script error: ${errorOutput}`);
          resolve({ success: false, error: errorOutput });
        }
      });

      childProcess.on('error', (err: Error) => {
        this.log(`Process error: ${err.message}`);
        resolve({ success: false, error: err.message });
      });
    });
  }

  private async executeAnalysis(
    projectPath: string,
    step: WorkflowStep
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Use symptom detector for analysis steps
      const detection = await this.symptomDetector.detect(projectPath);
      this.log(`Analysis found ${detection.symptoms.length} symptoms`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async executeRecovery(
    projectPath: string,
    step: WorkflowStep
  ): Promise<{ success: boolean; error?: string }> {
    // Load recovery strategy from config
    const strategyId = step.id.replace(/[^a-zA-Z0-9]/g, '_');
    // Implementation would depend on specific recovery strategies
    this.log(`Executing recovery strategy: ${strategyId}`);
    return { success: true };
  }

  private async handleRollback(projectPath: string, failedStep: WorkflowStep): Promise<void> {
    this.log(`Initiating rollback for failed step: ${failedStep.name}`);

    if (!this.config?.rollback_procedures) {
      this.log('No rollback procedures configured');
      return;
    }

    // Implement rollback logic based on configuration
    // This would restore from backup or revert changes
  }

  private async createBackup(projectPath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `delobotomize-backup-${timestamp}`;
    const backupPath = path.join(path.dirname(projectPath), backupName);

    this.log(`Creating backup at: ${backupPath}`);

    // Implementation would copy project to backup location
    // For now, just create directory
    await fs.mkdir(backupPath, { recursive: true });

    return backupPath;
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.executionLog.push(logEntry);
    console.log(logEntry);
  }

  /**
   * Get workflow metrics for optimization
   */
  getExecutionMetrics() {
    return {
      execution_history: this.executionLog,
      success_rate: 0, // Would track over time
      average_duration: 0 // Would calculate from history
    };
  }

  /**
   * Hot-reload configuration for development
   */
  async reloadConfig(): Promise<void> {
    this.config = null;
    await this.loadConfig();
    this.log('Configuration reloaded');
  }
}