import { TriageNarrator } from './triage-narrator';

/**
 * Main orchestration layer that coordinates all phases
 * of the delobotomization process
 */
export class DelobotomizeOrchestrator {
  async execute(projectPath: string, options: {
    generateReport?: boolean;
    saveArtifacts?: boolean;
    automated?: boolean;
  } = {}): Promise<{
    success: boolean;
    narrative?: any;
    summary: string;
  }> {
    console.log('🎭 Starting Delobotomize orchestration...');
    console.log(`📂 Project: ${projectPath}`);

    try {
      // Create triage narrator
      const narrator = new TriageNarrator(projectPath);

      // Execute full triage with narrative
      if (options.generateReport !== false) {
        const narrative = await narrator.executeFullTriage();

        return {
          success: true,
          narrative,
          summary: this.generateSuccessSummary(narrative)
        };
      } else {
        // Orchestrate without detailed narrative
        return await this.executeMinimal(projectPath);
      }
    } catch (error: any) {
      console.error('💥 Orchestration failed:', error.message);
      return {
        success: false,
        summary: `Failed to complete triage: ${error.message}`
      };
    }
  }

  private async executeMinimal(projectPath: string) {
    // Execute minimal triage without full narrative
    // This would be used for automated or CLI-only scenarios

    // For now, delegate to narrator but with minimal output
    const narrator = new TriageNarrator(projectPath);
    const narrative = await narrator.executeFullTriage();

    return {
      success: true,
      narrative,
      summary: narrator.getSummary()
    };
  }

  private generateSuccessSummary(narrative: any): string {
    const improvement = narrative.metrics.healthScoreChange.improvement;
    const issues = narrative.metrics.issuesResolved;

    return `
✅ Delobotomization Complete!

📊 Results:
   Health improved: ${improvement > 0 ? '+' : ''}${improvement}%
   Issues resolved: ${issues}
   Artifacts found: ${narrative.metrics.extractionResults.artifacts}
   Insights extracted: ${narrative.metrics.extractionResults.insights}

🎯 Status: ${narrative.resolution.afterState}

📄 Full report saved to project directory
`;
  }
}