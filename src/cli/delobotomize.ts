#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Phase0Extractor } from '../extractors/phase0';
import { ExtractionAnalyzer } from '../analyzers/extraction';
import { CodeScanner } from '../core/scanner';
import { PromptLoader } from '../core/prompt-loader';

const program = new Command();

program
  .name('delobotomize')
  .description('Emergency triage system for mid-project AI disasters')
  .version('0.1.0-alpha.1');

// Phase 0 extraction command
program
  .command('extract')
  .description('Extract and analyze project context from source materials')
  .option('-o, --output <path>', 'Output directory for extracted data', './analysis/extracted')
  .action(async (options) => {
    const spinner = ora('Extracting context from source materials...').start();

    try {
      const extractor = new Phase0Extractor();
      const result = await extractor.extractAll();

      spinner.succeed(chalk.green(`Extraction complete!`));
      console.log(chalk.blue(`\n📊 Results:`));
      console.log(`   - ${result.artifacts.length} artifacts extracted`);
      console.log(`   - ${result.insights.length} insights extracted`);
      console.log(`   - ${result.crossReferences.length} cross-references`);

      // Run analysis
      spinner.start('Analyzing extracted content...');
      const analyzer = new ExtractionAnalyzer();
      await analyzer.analyze();

      spinner.succeed(chalk.green('Analysis complete!'));
      console.log(chalk.blue(`\n📁 Output saved to: ${options.output}`));
    } catch (error) {
      spinner.fail(chalk.red('Extraction failed'));
      console.error(error);
      process.exit(1);
    }
  });

// Scan command
program
  .command('scan')
  .description('Scan codebase for context collapse patterns')
  .argument('<path>', 'Path to project to scan')
  .option('-s, --severity <level>', 'Minimum severity level (all|high|critical)', 'high')
  .option('-p, --prompt-version <version>', 'Use specific prompt version')
  .action(async (projectPath, options) => {
    const spinner = ora('Scanning for context collapse...').start();

    try {
      const scanner = new CodeScanner();
      const result = await scanner.scan(projectPath, {
        severity: options.severity,
        promptVersion: options.promptVersion
      });

      spinner.succeed(chalk.green('Scan complete!'));

      // Display results
      console.log(chalk.blue(`\n🎯 Status: ${result.status.toUpperCase()}`));
      console.log(chalk.gray(`Confidence: ${result.confidence}%`));
      console.log(chalk.gray(`Summary: ${result.summary}\n`));

      // Health scores
      console.log(chalk.blue('📊 Context Health Scores:'));
      console.log(`   Overall: ${result.contextHealthScore.overall}%`);
      console.log(`   Architecture: ${result.contextHealthScore.architecture}%`);
      console.log(`   Consistency: ${result.contextHealthScore.consistency}%`);
      console.log(`   Completeness: ${result.contextHealthScore.completeness}%\n`);

      // Critical issues
      if (result.indicators.critical.length > 0) {
        console.log(chalk.red('🚨 Critical Issues:'));
        result.indicators.critical.forEach(issue => {
          console.log(`   ${chalk.red('•')} ${issue.description}`);
          console.log(`     ${chalk.gray(issue.file)}`);
        });
        console.log();
      }

      // Recommendations
      if (result.recommendations.length > 0) {
        console.log(chalk.blue('💡 Recommendations:'));
        result.recommendations.forEach(rec => {
          const priority = rec.priority === 'immediate' ? chalk.red(rec.priority) :
                          rec.priority === 'soon' ? chalk.yellow(rec.priority) :
                          chalk.green(rec.priority);
          console.log(`   ${priority}: ${rec.action}`);
          console.log(`   ${chalk.gray(`    ${rec.rationale}`)}`);
        });
      }
    } catch (error) {
      spinner.fail(chalk.red('Scan failed'));
      console.error(error);
      process.exit(1);
    }
  });

// Analyze command
program
  .command('analyze')
  .description('Analyze extracted content for patterns and priorities')
  .action(async () => {
    const spinner = ora('Analyzing extracted content...').start();

    try {
      const analyzer = new ExtractionAnalyzer();
      const result = await analyzer.analyze();

      spinner.succeed(chalk.green('Analysis complete!'));

      console.log(chalk.blue('\n🎯 Priorities Identified:'));
      console.log(chalk.red(`\n   Critical (${result.priorities.critical.length}):`));
      result.priorities.critical.slice(0, 3).forEach(p => {
        console.log(`   • ${p}`);
      });

      console.log(chalk.yellow(`\n   High (${result.priorities.high.length}):`));
      result.priorities.high.slice(0, 3).forEach(p => {
        console.log(`   • ${p}`);
      });

      console.log(chalk.blue('\n🔧 Prompt Opportunities:'));
      console.log(`   Found ${result.promptExternalization.prompts.length} prompts to externalize`);

      result.promptExternalization.prompts.slice(0, 3).forEach(p => {
        console.log(`   • ${p.name}: ${p.purpose}`);
      });
    } catch (error) {
      spinner.fail(chalk.red('Analysis failed'));
      console.error(error);
      process.exit(1);
    }
  });

// Self-test command
program
  .command('self-test')
  .description('Test delobotomize methodology on itself')
  .action(async () => {
    console.log(chalk.blue('🧪 Running self-application test...'));

    const spinner = ora('Scanning delobotomize project...').start();

    try {
      // Scan ourselves
      const scanner = new CodeScanner();
      const result = await scanner.scan(process.cwd());

      spinner.succeed(chalk.green('Self-scan complete!'));

      console.log(chalk.blue(`\n📊 Self Assessment:`));
      console.log(`   Status: ${result.status.toUpperCase()}`);
      console.log(`   Context Health: ${result.contextHealthScore.overall}%`);

      if (result.indicators.critical.length === 0) {
        console.log(chalk.green('\n✅ No critical issues found!'));
      } else {
        console.log(chalk.red(`\n⚠️  Found ${result.indicators.critical.length} critical issues to address`));
      }

      console.log(chalk.blue('\n🔄 This demonstrates the methodology working on itself'));
    } catch (error) {
      spinner.fail(chalk.red('Self-test failed'));
      console.error(error);
      process.exit(1);
    }
  });

// Prompts command
program
  .command('prompts')
  .description('Manage prompt library')
  .argument('[action]', 'Action to perform (list|load|test)', 'list')
  .option('-i, --id <promptId>', 'Prompt ID to load/test')
  .action(async (action, options) => {
    try {
      const loader = new PromptLoader();

      switch (action) {
        case 'list':
          const prompts = await loader.loadAll();
          console.log(chalk.blue('📚 Available Prompts:'));
          prompts.forEach(p => {
            console.log(`   • ${p.id} (${p.metadata.baseline_version})`);
            console.log(`     ${p.content.substring(0, 100)}...`);
          });
          break;

        case 'load':
          if (!options.id) {
            console.error(chalk.red('Please specify a prompt ID with --id'));
            return;
          }
          const prompt = await loader.load(options.id);
          console.log(chalk.blue(`📖 Prompt: ${prompt.id}`));
          console.log(chalk.gray(prompt.content));
          if (prompt.optimization) {
            console.log(chalk.blue('\n📊 Optimization metadata:'));
            console.log(JSON.stringify(prompt.optimization, null, 2));
          }
          break;

        default:
          console.error(chalk.red(`Unknown action: ${action}`));
      }
    } catch (error) {
      console.error(chalk.red('Failed to manage prompts'));
      console.error(error);
    }
  });

// Iteration command
program
  .command('iterate')
  .description('Manage iterative optimization of high-ROI components')
  .argument('[action]', 'Action to perform (plan|execute|report)', 'plan')
  .option('-c, --component <id>', 'Component ID to iterate')
  .option('-t, --tier <tier>', 'Filter by iteration tier (CRITICAL|HIGH|MEDIUM|LOW)', 'CRITICAL')
  .action(async (action, options) => {
    const { IterationManager } = await import('../iteration/iteration-manager');
    const manager = new IterationManager();
    await manager.initialize();

    switch (action) {
      case 'plan':
        const candidates = manager.getIterationCandidates(options.tier);
        console.log(chalk.blue(`\n🎯 Iteration Candidates (${options.tier} tier):`));

        candidates.slice(0, 5).forEach(c => {
          const score = chalk.green(`Score: ${c.total_score}/30`);
          const budget = chalk.yellow(`${c.budget_allocation}%`);
          console.log(`\n   ${chalk.bold(c.id)}`);
          console.log(`   Type: ${c.type} | Path: ${c.path}`);
          console.log(`   ${score} | Budget: ${budget}`);
          console.log(`   Module: ${c.module}`);
        });

        const monthlyPlan = manager.generateMonthlyPlan();
        console.log(chalk.blue(`\n📅 ${monthlyPlan.month} Plan:`));
        console.log(`   Focus: ${monthlyPlan.focus}`);
        console.log(`   Actions:`);
        monthlyPlan.actions.forEach(a => console.log(`   • ${a}`));
        break;

      case 'execute':
        if (!options.component) {
          console.error(chalk.red('Please specify component with --component'));
          return;
        }

        const spinner = ora(`Iterating on ${options.component}...`).start();
        try {
          const result = await manager.executeIteration(options.component);
          spinner.succeed(chalk.green('Iteration complete!'));

          console.log(chalk.blue('\n📊 Results:'));
          console.log(`   Old Performance:`, result.old_performance);
          console.log(`   New Performance:`, result.new_performance);
          if (result.improvement) {
            const improvement = result.improvement > 0
              ? chalk.green(`+${result.improvement.toFixed(1)}%`)
              : chalk.red(`${result.improvement.toFixed(1)}%`);
            console.log(`   Improvement: ${improvement}`);
          }
        } catch (error) {
          spinner.fail(chalk.red('Iteration failed'));
          console.error(error);
        }
        break;

      case 'report':
        const report = await manager.getOptimizationReport();
        console.log(chalk.blue('\n📈 Optimization Report:'));

        console.log(chalk.green('\n   Top Performers:'));
        report.top_performers.forEach(p => {
          console.log(`   • ${p.id}: ${(p.performance?.accuracy || 0).toFixed(2)} accuracy`);
        });

        console.log(chalk.yellow('\n   Improvement Opportunities:'));
        report.improvement_opportunities.forEach(p => {
          console.log(`   • ${p.id}: ${(p.performance?.accuracy || 0).toFixed(2)} accuracy`);
        });
        break;
    }
  });

// Remediation command
program
  .command('remediate')
  .description('Execute remediation workflow')
  .argument('<path>', 'Path to project to remediate')
  .option('-d, --dry-run', 'Simulate without making changes')
  .option('-b, --backup', 'Create backup before remediation')
  .option('-y, --yes', 'Auto-confirm all prompts')
  .action(async (projectPath, options) => {
    const { RemediationOrchestrator } = await import('../workflows/remediation-orchestrator');
    const { Phase0Extractor } = await import('../extractors/phase0');

    const spinner = ora('Analyzing project...').start();

    try {
      // First, extract and analyze
      const extractor = new Phase0Extractor();
      await extractor.extractAll();

      // Create mock diagnosis (in real would use diagnostic-analysis prompt)
      const diagnosis = {
        diagnosis: {
          syndrome_detected: 'context_collapse',
          severity: 'critical',
          confidence: 85
        }
      };

      // Run remediation
      const orchestrator = new RemediationOrchestrator();
      await orchestrator.loadConfig();

      spinner.text = 'Executing remediation workflow...';
      const result = await orchestrator.remediate(projectPath, diagnosis, {
        dryRun: options.dryRun,
        createBackup: options.backup,
        autoConfirm: options.yes
      });

      if (result.success) {
        spinner.succeed(chalk.green('Remediation successful!'));
        console.log(chalk.blue(`\n   Phase executed: ${result.phase_executed}`));
        console.log(`   Steps completed: ${result.steps_completed.length}`);
        console.log(`   Duration: ${(result.total_duration_ms / 1000).toFixed(1)}s`);
      } else {
        spinner.fail(chalk.red('Remediation failed'));
        console.log(chalk.yellow(`\n   Failed steps: ${result.steps_failed.length}`));
      }
    } catch (error) {
      spinner.fail(chalk.red('Remediation error'));
      console.error(error);
    }
  });

// Orchestrate command - LLM-driven automation
program
  .command('triage')
  .description('Execute intelligent triage with automated decision making')
  .argument('[path]', 'Project path to triage', process.cwd())
  .option('-i, --interactive', 'Interactive mode for manual decisions', false)
  .option('-a, --auto', 'Fully automated mode (default)', false)
  .option('--dry-run', 'Analyze only, no changes', false)
  .option('--fix-method <method>', 'Fix method: diff|full', '')
  .option('--model <model>', 'Force specific model', '')
  .option('--batch-size <size>', 'Files per batch', '100')
  .option('-r, --no-report', 'Skip narrative report', false)
  .option('--fragile', 'Extra cautious mode', false)
  .action(async (args, options) => {
    const { CLIAutomator } = await import('../services/cli-automator');
    const { DelobotomizeOrchestrator } = await import('../orchestration/orchestrator');
    const { TriageNarrator } = await import('../orchestration/triage-narrator');

    const spinner = ora('🧠 Analyzing project needs...');
    let automation = null;

    // If automated mode or too many flags, use LLM automation
    if (options.auto || (!options.interactive && Object.keys(options).length === 1)) {
      spinner.text = '🤖 LLM optimizing command...';

      try {
        const automator = new CLIAutomator(await LLMProviderFactory.createFromEnv());
        automation = await automator.automateTriage({
          projectPath: args,
          flags: options
        });

        spinner.succeed(chalk.green('Command optimized'));
        console.log(chalk.blue(`Recommended: ${automation.command}`));
        console.log(chalk.gray(`Reasoning: ${automation.reasoning.substring(0, 200)}...`));

        if (automation.warnings) {
          console.log(chalk.yellow('\n⚠️  Warnings:'));
          automation.warnings.forEach(w => console.log(`   ${w}`));
        }

        // Execute recommended command unless user specified alternatives
        const finalCommand = automation.command;
        spinner.start('🎭 Running optimized triage...');

        // Actually run triage with optimized parameters
        const orchestrator = new DelobotomizeOrchestrator();
        const result = await orchestrator.execute(args, {
          generateReport: options.report !== false,
          automated: true,
          fixMethod: options.fixMethod || automation.metadata?.detectedModel?.includes('gemini') ? 'full' : 'diff',
          batchSize: parseInt(options.batchSize) || automation.metadata?.estimatedDuration ? Math.floor(300 / automation.metadata.estimatedDuration) : 100,
          fragile: options.fragile || false
        });

        if (result.success) {
          spinner.succeed(chalk.green('Automated triage complete!'));
          console.log(chalk.blue(result.summary));

          // Show cost estimate vs actual
          if (automation.metadata?.estimatedCost) {
            console.log(chalk.gray(`\n💰 Cost estimate: $${automation.metadata.estimatedCost}`));
          }
        } else {
          spinner.fail(chalk.red('Automated triage failed'));
          console.log(chalk.red(result.summary));
        }
      } catch (error: any) {
        spinner.fail(chalk.red('LLM optimization failed'));
        console.error(error.message);

        // Fallback to manual execution
        spinner.start('🎭 Running triage with manual defaults...');
        await executeManualTriage(args, options);
      }
    } else {
      // Manual mode - just execute with provided options
      await executeManualTriage(args, options);
    }

    /**
     * Manual triage execution fallback
     */
    async function executeManualTriage(projectPath: string, options: any) {
      const orchestrator = new DelobotomizeOrchestrator();
      const result = await orchestrator.execute(projectPath, {
        generateReport: options.report !== false,
        automated: options.interactive ? false : true,
        fixMethod: options.fixMethod || 'diff',
        batchSize: parseInt(options.batchSize) || 100,
        fragile: options.fragile || false
      });

      if (result.success) {
        spinner.succeed(chalk.green('Triage complete!'));
        console.log(chalk.blue(result.summary));
      } else {
        spinner.fail(chalk.red('Triage failed'));
        console.log(chalk.red(result.summary));
      }
    }
  });

// Memory command
program
  .command('memory')
  .description('Manage persistent context memory system')
  .argument('[action]', 'Action to perform (init|search|stats|clear|export)', 'stats')
  .option('-q, --query <text>', 'Search query for memory search')
  .option('-t, --type <type>', 'Filter by node type (artifact|insight|symptom|pattern|solution)')
  .option('-s, --severity <level>', 'Filter by severity level')
  .option('-k, --top-k <number>', 'Number of results to return', '10')
  .option('-p, --project <path>', 'Project path for memory operations', process.cwd())
  .action(async (action, options) => {
    const { ContextManager } = await import('../memory/context-manager');
    const { LLMProviderFactory } = await import('../llm/provider-interface');

    try {
      switch (action) {
        case 'init':
          const spinner = ora('Initializing memory system...').start();
          try {
            // Initialize LLM provider
            const provider = await LLMProviderFactory.createFromEnv();

            // Create context manager
            const contextManager = new ContextManager({
              projectPath: options.project,
              llmProvider: provider,
              vectorStorePath: `${options.project}/.delobotomize/memory/vectors.json`,
              knowledgeGraphPath: `${options.project}/.delobotomize/memory/graph.json`
            });

            await contextManager.initialize();
            spinner.succeed(chalk.green('Memory system initialized!'));
            console.log(chalk.blue('\n📦 Memory components ready:'));
            console.log('   • Knowledge graph');
            console.log('   • Vector store');
            console.log('   • Text chunker');
            console.log('   • MCP server');
          } catch (error: any) {
            spinner.fail(chalk.red('Initialization failed'));
            console.error(error.message);
          }
          break;

        case 'search':
          if (!options.query) {
            console.error(chalk.red('Please specify search query with --query'));
            return;
          }

          const searchSpinner = ora('Searching memory...').start();
          try {
            const provider = await LLMProviderFactory.createFromEnv();
            const contextManager = new ContextManager({
              projectPath: options.project,
              llmProvider: provider
            });
            await contextManager.initialize();

            const results = await contextManager.searchMemory(options.query, {
              topK: parseInt(options.topK),
              nodeType: options.type,
              minSimilarity: 0.7
            });

            searchSpinner.succeed(chalk.green(`Found ${results.length} results`));

            if (results.length > 0) {
              console.log(chalk.blue('\n🔍 Search Results:'));
              results.forEach((result, i) => {
                console.log(`\n${i + 1}. ${chalk.bold(result.id)} (${result.type})`);
                console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`);
                console.log(`   ${chalk.gray(result.content.substring(0, 150))}...`);
                if (result.metadata.severity) {
                  console.log(`   Severity: ${result.metadata.severity}`);
                }
              });
            } else {
              console.log(chalk.yellow('\n⚠️  No results found'));
            }
          } catch (error: any) {
            searchSpinner.fail(chalk.red('Search failed'));
            console.error(error.message);
          }
          break;

        case 'stats':
          const statsSpinner = ora('Loading memory statistics...').start();
          try {
            const provider = await LLMProviderFactory.createFromEnv();
            const contextManager = new ContextManager({
              projectPath: options.project,
              llmProvider: provider
            });
            await contextManager.initialize();

            const stats = await contextManager.getMemoryStats();
            statsSpinner.succeed(chalk.green('Memory statistics loaded'));

            console.log(chalk.blue('\n📊 Memory Statistics:'));
            console.log(`   Total Nodes: ${stats.totalNodes}`);
            console.log(`   Total Edges: ${stats.totalEdges}`);
            console.log(`   Vector Documents: ${stats.vectorDocuments}`);

            console.log(chalk.blue('\n   Nodes by Type:'));
            Object.entries(stats.nodesByType).forEach(([type, count]) => {
              console.log(`   • ${type}: ${count}`);
            });

            console.log(chalk.blue('\n   Nodes by Severity:'));
            Object.entries(stats.nodesBySeverity).forEach(([severity, count]) => {
              console.log(`   • ${severity}: ${count}`);
            });
          } catch (error: any) {
            statsSpinner.fail(chalk.red('Failed to load stats'));
            console.error(error.message);
          }
          break;

        case 'clear':
          const clearSpinner = ora('Clearing memory...').start();
          try {
            const provider = await LLMProviderFactory.createFromEnv();
            const contextManager = new ContextManager({
              projectPath: options.project,
              llmProvider: provider
            });
            await contextManager.initialize();
            await contextManager.clearMemory();

            clearSpinner.succeed(chalk.green('Memory cleared'));
          } catch (error: any) {
            clearSpinner.fail(chalk.red('Failed to clear memory'));
            console.error(error.message);
          }
          break;

        case 'export':
          const exportSpinner = ora('Exporting memory snapshot...').start();
          try {
            const provider = await LLMProviderFactory.createFromEnv();
            const contextManager = new ContextManager({
              projectPath: options.project,
              llmProvider: provider
            });
            await contextManager.initialize();

            const snapshot = await contextManager.exportSnapshot();
            const outputPath = `${options.project}/.delobotomize/memory/export-${Date.now()}.json`;

            const fs = await import('fs/promises');
            await fs.writeFile(outputPath, JSON.stringify(snapshot, null, 2));

            exportSpinner.succeed(chalk.green('Memory exported'));
            console.log(chalk.blue(`\n📁 Snapshot saved to: ${outputPath}`));
          } catch (error: any) {
            exportSpinner.fail(chalk.red('Export failed'));
            console.error(error.message);
          }
          break;

        default:
          console.error(chalk.red(`Unknown action: ${action}`));
          console.log(chalk.yellow('Available actions: init, search, stats, clear, export'));
      }
    } catch (error: any) {
      console.error(chalk.red('Memory command failed'));
      console.error(error.message);
    }
  });

// UI command - start web interface
program
  .command('ui')
  .description('Start web interface for monitoring audits')
  .argument('[path]', 'Project path to monitor', process.cwd())
  .option('-p, --port <port>', 'Port to run on', '3000')
  .option('--host <host>', 'Host to bind to', 'localhost')
  .option('--auto', 'Auto-start monitoring', false)
  .action(async (projectPath, options) => {
    const { WebUIServer } = await import('../ui/server');

    const spinner = ora('Starting Web UI...').start();

    try {
      const server = new WebUIServer({
        projectPath,
        port: parseInt(options.port) || 3000,
        host: options.host || 'localhost',
        autoStart: options.auto || false
      });

      await server.start();

      spinner.succeed(chalk.green(`Web UI running at http://${options.host || 'localhost'}:${options.port}`));
      console.log(chalk.blue(`\n💡 Monitoring project: ${projectPath}`));
      console.log(chalk.gray('Press Ctrl+C to stop\n'));

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n🔴 Shutting down Web UI...'));
        await server.stop();
        process.exit(0);
      });
    } catch (error: any) {
      spinner.fail(chalk.red('Failed to start Web UI'));
      console.error(error.message);
      process.exit(1);
    }
  });

program.parse();