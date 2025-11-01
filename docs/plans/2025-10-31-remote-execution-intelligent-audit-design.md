# Remote Execution & Intelligent Audit System Design

**Date:** 2025-10-31
**Status:** Approved
**Version:** 1.0

## Executive Summary

Transform delobotomize from a local-only tool into a remote execution system that can analyze and fix any project from any location. The system will perform intelligent, LLM-powered code audits that understand intent (not just syntax), and fix issues using one of two equal-priority methods: diff-based (token-efficient) or full-file replacement (simpler).

## Core Requirements

### 1. Remote Execution
- Run delobotomize from anywhere: `delobotomize triage /path/to/any/project`
- Store analysis data in target project's `.delobotomize/` directory (auto-gitignored)
- No need to install delobotomize inside target projects
- Support both interactive and automated modes

### 2. Intelligent Audit System
- Scan **all files** in target project (not just known patterns)
- LLM-powered analysis that understands **intent** vs **syntax**
- Distinguish between:
  - AI hallucinations (non-existent functions)
  - Incomplete refactors (function moved to wrong file)
  - Missing imports (function exists but not imported)
  - Intentional incomplete work vs bugs
- Multi-stage analysis: file-by-file → cross-file synthesis → fix ordering

### 3. Dual Fix Methods (Equal Priority)
- **Method 1: Diff-Based** - Structured unified diffs (token-efficient)
- **Method 2: Full-File** - Complete file replacement (simpler, uses more tokens)
- Both methods receive equal implementation quality
- User selects method via `--fix-method=diff` or `--fix-method=full`
- Track token usage and accuracy for comparison

### 4. Spec File Handling
- Auto-detect spec files (speckit, custom formats, or none)
- Validate against speckit structure if present
- Generate spec files from scratch if missing
- Primary issue: spec files causing poor context transfer between AI sessions

### 5. Backup & Restore System
- Backup to `.delobotomize/backups/<timestamp>/`
- Commands: `restore`, `redo`, `history`
- Backup before applying fixes
- Backup modified files before restoring (enable undo/redo cycles)

### 6. Natural Language Reports
- Overall summary for quick review
- Individual file reports with detailed analysis
- All actions logged in natural language
- Enable user interaction for feedback/changes

## Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────────┐
│                  INTERFACES (Present + Future)           │
├──────────────────┬──────────────────┬───────────────────┤
│   CLI Handler    │  Web UI (future) │  API Endpoints    │
│  (interactive)   │   (React/Vue)    │   (REST/GraphQL)  │
└────────┬─────────┴────────┬─────────┴─────────┬─────────┘
         │                  │                   │
         └──────────────────┼───────────────────┘
                            │
                ┌───────────▼──────────────┐
                │   AuditEngine (Core)     │
                │  - File discovery        │
                │  - Issue detection       │
                │  - LLM integration       │
                │  - State management      │
                └───────────┬──────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
    │ Scanner │      │ RepairLLM │     │  Backup   │
    │ Service │      │  Service  │     │  Manager  │
    └─────────┘      └───────────┘     └───────────┘
```

### Project Structure in Target

```
/path/to/target-project/
├── src/                        # User's existing code
├── .claude/                    # User's existing AI config (if exists)
├── .agents/                    # User's existing agents (if exists)
├── spec/                       # User's existing specs (if exists)
├── .gitignore                  # Updated to ignore .delobotomize/
└── .delobotomize/             # Added by delobotomize
    ├── state.json              # Current session state
    ├── reports/
    │   └── 2025-10-31-143022/
    │       ├── summary.md      # Overall summary
    │       ├── files/          # Individual file reports
    │       │   ├── src_app.ts.md
    │       │   ├── .claude_config.md
    │       │   └── ...
    │       ├── metadata.json   # Structured data for future Web UI
    │       └── method-comparison.json  # Token usage comparison
    ├── backups/
    │   └── 2025-10-31-143022/  # Timestamped backup
    │       ├── src/
    │       ├── .claude/
    │       └── manifest.json   # What was backed up
    └── logs/
        └── session-143022.log  # Detailed operation log
```

### Delobotomize Project Structure (Orchestrator)

```
delobotomize/
├── src/
│   ├── cli/
│   │   └── delobotomize.ts    # CLI entry point
│   ├── core/
│   │   ├── audit-engine.ts    # NEW: Main audit orchestrator
│   │   ├── scanner.ts         # Enhanced for full project scanning
│   │   └── ...
│   ├── services/              # NEW FOLDER
│   │   ├── file-scanner.ts    # Discovers all files
│   │   ├── repair-llm.ts      # LLM integration for fixes
│   │   ├── backup-manager.ts  # Handles backups/restore
│   │   └── spec-detector.ts   # Detects spec file patterns
│   ├── strategies/            # NEW FOLDER
│   │   ├── fix-strategy.ts    # IFixStrategy interface
│   │   ├── diff-based.ts      # DiffBasedStrategy
│   │   └── full-file.ts       # FullFileStrategy
│   ├── llm/                   # Existing provider abstraction
│   ├── memory/                # Existing
│   └── ...
├── prompts/
│   ├── analysis/              # NEW
│   │   ├── file-analysis.md
│   │   ├── cross-file-synthesis.md
│   │   └── fix-ordering.md
│   └── fix/                   # NEW
│       ├── diff-generation.md
│       └── full-replacement.md
├── templates/                 # NEW
│   ├── summary-template.md
│   ├── file-report-template.md
│   └── comparison-report-template.md
├── config/
│   ├── models.json            # NEW: Model configs with context windows
│   └── fix-methods.json       # NEW: Method configurations
└── dist/                      # Compiled output
```

## Workflow: Intelligent Audit Process

### Phase 1: File-by-File Analysis

```
For each file in target project:
  1. Read file content
  2. Detect file type & purpose (code, config, AI prompt, spec, etc.)
  3. Validate file size against model context window
  4. Send to LLM with context:
     - File path & content
     - Project structure overview
     - Previously detected issues (for cross-file understanding)
  5. LLM returns structured analysis:
     {
       "file": "src/auth/login.ts",
       "file_purpose": "Handle user login authentication",
       "issues": [
         {
           "type": "missing_function",
           "severity": "high",
           "line": 47,
           "description": "Function validateSession() called but not defined",
           "intent_analysis": "Should validate JWT tokens based on context",
           "cause": "ai_hallucination",  // vs "incomplete_refactor"
           "proposed_fix": {...}
         }
       ],
       "cross_file_dependencies": ["src/auth/session.ts"],
       "health_score": 45,
       "requires_human_review": true
     }
  6. Store analysis in .delobotomize/reports/<session>/files/<filename>.md
  7. Track all issues in session state
```

### Phase 2: Cross-File Synthesis

```
After all files scanned:
  1. LLM performs "second pass" analysis:
     - Reviews all detected issues together
     - Identifies root causes vs symptoms
     - Determines fix order based on dependencies
     - Example: "Don't delete broken import, function exists in wrong file"

  2. Generate fix plan with execution order:
     {
       "fixes": [
         {
           "file": "src/auth/session.ts",
           "action": "create",
           "diff": "... unified diff ...",
           "rationale": "validateSession needed by login.ts"
         }
       ],
       "execution_order": ["create session.ts", "fix login.ts import"]
     }

  3. Generate summary.md:
     - Total files scanned: 247
     - Files with issues: 18
     - Issues by severity: 12 high, 34 medium, 67 low
     - Root causes: "AI hallucinated non-existent functions (8 cases)"
     - Proposed changes: 23 modifications, 3 new files, 0 deletions
```

### Phase 3: Interactive Checkpoint (if --interactive)

```
Display summary.md to user

Ask: "Review complete. Apply fixes? (y)es / (n)o / (r)eview individual files"
  - y: Proceed to backup & apply
  - n: Exit (save report only)
  - r: Show file-by-file reports, allow selective approval

If user requests changes:
  - Accept natural language feedback
  - Re-run analysis with new constraints
  - Update fix plan
  - Show updated summary
```

### Phase 4: Backup & Apply

```
1. Create timestamped backup:
   - Backup all files that will be modified
   - Store in .delobotomize/backups/<timestamp>/
   - Generate manifest.json listing all backed up files

2. Apply fixes using selected method (diff or full-file):
   - Process in dependency order
   - Validate each fix before applying
   - Log all actions to session log
   - Track token usage for comparison

3. Generate completion report:
   - Files modified: 23
   - Lines changed: +342, -178
   - Issues resolved: 45
   - Backup location: .delobotomize/backups/2025-10-31-143022/
   - Token usage: 45,230 tokens ($0.14)
   - Method used: diff-based
```

## Dual Fix Methods: Equal Implementation

### Common Interface

```typescript
interface IFixStrategy {
  name: string;
  validate(file: string, modelConfig: ModelConfig): Promise<ValidationResult>;
  analyze(file: string, context: ProjectContext): Promise<AnalysisResult>;
  generateFix(analysis: AnalysisResult): Promise<FixResult>;
  apply(fix: FixResult, options: ApplyOptions): Promise<ApplyResult>;
  rollback(applyResult: ApplyResult): Promise<void>;
  estimateCost(file: string): Promise<CostEstimate>;
}
```

### Method 1: Diff-Based Strategy

**Prompting:**
```markdown
You are analyzing a file from a codebase with AI-generated issues.

FILE: {file_path}
CONTENT:
```
{file_content}
```

ISSUES TO FIX:
{issues_json}

Generate unified diff format fixes for each issue.
Preserve all working code. Only change what's necessary.

RESPOND IN JSON:
{
  "fixes": [
    {
      "file": string,
      "diff": string,  // Unified diff format
      "rationale": string
    }
  ]
}
```

**Advantages:**
- Token-efficient (only sends changed sections)
- Clear visibility into what changed
- Good for large files
- Easy to review diffs

**Limitations:**
- More complex to generate correctly
- Requires careful line number tracking
- May fail on complex restructuring

### Method 2: Full-File Strategy

**Prompting:**
```markdown
You are fixing a file with AI-generated issues.

ORIGINAL FILE ({file_path}):
```
{full_file_content}
```

ISSUES DETECTED:
{issues_json}

Return the COMPLETE corrected file content.
Fix all issues while preserving intended functionality.

RESPOND IN JSON:
{
  "file": string,
  "original_hash": string,  // MD5 for verification
  "fixed_content": string,  // Complete fixed file
  "changes_summary": string[]
}
```

**Advantages:**
- Simpler for LLM to generate
- Can handle complex restructuring
- Hash verification ensures LLM understood file
- Natural for complete rewrites

**Limitations:**
- Uses more tokens (sends entire file twice)
- Harder to review what changed
- May hit context limits on large files
- Higher cost per file

### Parity Features

Both methods receive:
- ✅ Equal retry logic (3 attempts with exponential backoff)
- ✅ Equal validation (confidence threshold, syntax checking)
- ✅ Equal error handling and fallback strategies
- ✅ Equal quality reports (detailed change logs)
- ✅ Equal configuration options
- ✅ Equal integration with backup/restore system

## LLM Provider Configuration

### Supported Models (via OpenRouter)

```typescript
const SUPPORTED_MODELS = [
  {
    model: 'anthropic/claude-3.5-sonnet',
    contextWindow: 200000,
    maxFileTokens: 100000,      // ~400KB files
    costPer1kTokens: 0.003,
    recommended: true
  },
  {
    model: 'google/gemini-pro-1.5',
    contextWindow: 2000000,
    maxFileTokens: 1000000,     // ~4MB files (massive!)
    costPer1kTokens: 0.0007,
    recommended: true  // Best for large files
  },
  {
    model: 'openai/gpt-4-turbo',
    contextWindow: 128000,
    maxFileTokens: 64000,       // ~256KB files
    costPer1kTokens: 0.01
  },
  {
    model: 'anthropic/claude-3-opus',
    contextWindow: 200000,
    maxFileTokens: 100000,
    costPer1kTokens: 0.015
  },
  {
    model: 'openai/gpt-4o',
    contextWindow: 128000,
    maxFileTokens: 64000,
    costPer1kTokens: 0.005
  }
];
```

### File Size Validation

```
Token estimation: 1 token ≈ 4 characters

Diff-based method requirements:
  - File content + system prompt + analysis + diff output
  - Safe limit: 50% of context window for file content

Full-file method requirements:
  - Original file + fixed file + system prompt + analysis
  - Safe limit: 40% of context window for file content

Auto-fallback:
  - If file too large for full-file method → suggest diff method
  - If file too large for current model → suggest Gemini Pro 1.5
  - If file exceeds all models → suggest file splitting
```

## Command-Line Interface

### Core Commands

```bash
# Triage (main command)
delobotomize triage <path>                          # Auto mode
delobotomize triage <path> --interactive            # Step-by-step
delobotomize triage <path> --dry-run                # Audit only
delobotomize triage <path> --fix-method=diff        # Specify method
delobotomize triage <path> --model=google/gemini-pro-1.5

# Validation
delobotomize validate <path>                        # Check file sizes
delobotomize validate <path> --model=<model>        # For specific model

# Backup Management
delobotomize restore <path> <timestamp>             # Restore backup
delobotomize redo <path>                            # Re-apply last fixes
delobotomize history <path>                         # Show backup timeline
delobotomize diff <path> <timestamp>                # Compare backup

# Comparison
delobotomize compare <path>                         # Run both methods
delobotomize compare <path> --models=model1,model2  # Compare models

# Reports
delobotomize report <path>                          # View last report
delobotomize report <path> --session=<timestamp>    # Specific session
```

### Example Usage Scenarios

**Scenario 1: First-time audit (interactive)**
```bash
delobotomize triage ~/projects/broken-app --interactive

# Output:
🔍 Scanning 247 files...
📊 Analysis complete: 18 files with issues
📄 Report: /Users/me/projects/broken-app/.delobotomize/reports/2025-10-31-143022/summary.md

[Shows summary]

Review complete. Apply fixes?
(y)es / (n)o / (r)eview individual files: r

[Shows file-by-file list]
Select files to review (comma-separated, or 'all'): 1,3,7

[Shows detailed reports for selected files]

Proceed with fixes?
(y)es / (n)o / (m)odify: y

Select fix method:
1. Diff-based (recommended, ~$0.45 estimated)
2. Full-file replacement (~$1.20 estimated)
Choice: 1

✅ Backup created: .delobotomize/backups/2025-10-31-143022/
🔧 Applying 23 fixes...
✅ Complete! 23 files modified, 45 issues resolved.
```

**Scenario 2: Automated CI/CD**
```bash
#!/bin/bash
# In CI pipeline

delobotomize triage . --fix-method=diff --model=anthropic/claude-3.5-sonnet

if [ $? -eq 0 ]; then
  echo "✅ Code audit passed"
  cat .delobotomize/reports/latest/summary.md >> $GITHUB_STEP_SUMMARY
else
  echo "❌ Code audit failed"
  exit 1
fi
```

**Scenario 3: Restore from backup**
```bash
# Oh no, the fixes broke something!
delobotomize restore ~/projects/app 2025-10-31-143022

# Output:
⚠️  This will restore 23 files from backup
✅ Current state backed up to: .delobotomize/backups/2025-10-31-150000/
✅ Restored from: .delobotomize/backups/2025-10-31-143022/
💡 To re-apply fixes: delobotomize redo ~/projects/app

# Actually, the fixes were fine
delobotomize redo ~/projects/app

# Output:
✅ Re-applied fixes from session 2025-10-31-143022
```

## Logging & Transparency

### Session Log Format

```log
[2025-10-31 14:30:22] SESSION_START project=/path/to/target method=diff model=anthropic/claude-3.5-sonnet
[2025-10-31 14:30:23] FILE_SCAN total=247 include_patterns=*.ts,*.js,*.md,.claude/**
[2025-10-31 14:30:23] SCAN_FILE file=src/auth/login.ts size=1247 type=typescript
[2025-10-31 14:30:25] LLM_REQUEST provider=openrouter model=claude-3.5-sonnet tokens_estimate=2340
[2025-10-31 14:30:28] LLM_RESPONSE issues_found=3 health_score=45 tokens_actual=2367 duration=3.2s cost=$0.007
[2025-10-31 14:30:28] ISSUE_DETECTED id=login-001 type=missing_function severity=high line=47
[2025-10-31 14:30:28] CROSS_REF file=src/auth/session.ts reason=validateSession_should_be_here
[2025-10-31 14:35:10] SYNTHESIS_START total_issues=127 files_with_issues=18
[2025-10-31 14:35:15] ROOT_CAUSE detected=ai_hallucination count=8 pattern=non_existent_functions
[2025-10-31 14:35:20] FIX_PLAN generated fixes=23 new_files=3 execution_order=[...]
[2025-10-31 14:35:22] USER_PROMPT action=review_summary
[2025-10-31 14:35:45] USER_RESPONSE action=approve method_selected=diff
[2025-10-31 14:35:46] BACKUP_START target=.delobotomize/backups/2025-10-31-143022/
[2025-10-31 14:35:48] BACKUP_FILE src/auth/login.ts → backups/2025-10-31-143022/src/auth/login.ts
[2025-10-31 14:35:50] BACKUP_COMPLETE files=23 size=127KB duration=4.2s
[2025-10-31 14:35:51] APPLY_FIX id=login-001 method=diff action=create file=src/auth/session.ts
[2025-10-31 14:35:51] VALIDATE_SYNTAX file=src/auth/session.ts result=valid
[2025-10-31 14:35:51] APPLY_SUCCESS file=src/auth/session.ts lines_added=12
[2025-10-31 14:35:52] APPLY_FIX id=login-002 method=diff action=modify file=src/auth/login.ts
[2025-10-31 14:35:52] APPLY_SUCCESS file=src/auth/login.ts lines_changed=2
[2025-10-31 14:36:10] SESSION_COMPLETE files_processed=247 files_modified=23 issues_resolved=45 tokens_total=45230 cost=$0.14 duration=348s
```

### Natural Language Summary

```markdown
# Delobotomize Audit Summary
**Session:** 2025-10-31-143022
**Project:** /Users/me/projects/broken-app
**Method:** diff-based
**Model:** anthropic/claude-3.5-sonnet

## Overview

Analyzed 247 files and identified 127 issues across 18 files. The primary problem was AI-generated code that referenced non-existent functions (8 occurrences), along with incomplete refactors and missing imports.

## Statistics

- **Files scanned:** 247
- **Files with issues:** 18 (7.3%)
- **Total issues:** 127
  - Critical: 23
  - High: 34
  - Medium: 47
  - Low: 23
- **Health score:** 45/100 → 87/100 (after fixes)

## Root Causes Identified

1. **AI Hallucinations (8 cases):** LLM generated calls to functions that were never implemented
   - Example: `validateSession()` in login.ts - function didn't exist anywhere
   - Fix: Created missing functions based on usage context

2. **Incomplete Refactors (5 cases):** Functions moved but imports not updated
   - Example: `hashPassword()` moved from auth.ts to crypto.ts, 3 files not updated
   - Fix: Updated all import statements

3. **Spec File Issues (3 cases):** .claude/context.md had outdated project structure
   - Caused AI to reference old file paths
   - Fix: Updated context files with current structure

## Changes Applied

- **23 files modified**
- **3 new files created**
- **0 files deleted**
- **Lines added:** 342
- **Lines removed:** 178

## Backup

All original files backed up to:
`.delobotomize/backups/2025-10-31-143022/`

To restore: `delobotomize restore . 2025-10-31-143022`

## Token Usage

- **Total tokens:** 45,230
- **Cost:** $0.14
- **Average per file:** 183 tokens

## Method Comparison

This session used **diff-based** method.
Estimated cost with full-file method: $0.38 (2.7x more expensive)

---
*See individual file reports in `.delobotomize/reports/2025-10-31-143022/files/`*
```

## Error Handling & Edge Cases

### File Size Limits

```typescript
if (fileSize > modelConfig.maxFileTokens) {
  if (method === FixMethod.FULL_FILE) {
    throw new ValidationError(
      `File ${file} too large for full-file method (${fileSize} tokens).\n` +
      `Options:\n` +
      `1. Use --fix-method=diff\n` +
      `2. Use --model=google/gemini-pro-1.5 (2M context)\n` +
      `3. Split file manually`
    );
  } else {
    // Even diff method can't handle this
    suggestFileSplitting(file);
  }
}
```

### LLM Failures

```typescript
// Retry logic with exponential backoff
const maxRetries = 3;
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    return await strategy.generateFix(analysis);
  } catch (error) {
    if (attempt === maxRetries) {
      // Final attempt failed - save analysis and continue
      this.log.error(`Failed to fix ${file} after ${maxRetries} attempts`);
      this.savePartialResult(file, analysis, error);
      continue;  // Don't block entire audit
    }
    await sleep(1000 * Math.pow(2, attempt - 1));
  }
}
```

### Syntax Validation Failures

```typescript
async applyFix(fix: FixResult): Promise<ApplyResult> {
  // Apply fix
  await this.writeFix(fix);

  // Validate syntax
  const syntaxValid = await this.validateSyntax(fix.file);

  if (!syntaxValid) {
    // Rollback and mark for human review
    await this.rollback(fix);

    return {
      success: false,
      reason: 'Syntax validation failed',
      action: 'rolled_back',
      requires_manual_fix: true
    };
  }

  return { success: true };
}
```

### Spec File Detection Failures

```typescript
class SpecDetector {
  async detect(projectPath: string): Promise<SpecConfig> {
    // Try common patterns
    const patterns = [
      'spec/**/*.md',
      '.spec/**/*.md',
      'specs/**/*.md',
      'tests/spec/**/*',
      '.claude/spec.md'
    ];

    const found = await this.findFiles(projectPath, patterns);

    if (found.length === 0) {
      return {
        hasSpecs: false,
        format: 'none',
        recommendation: 'Consider creating spec files for better AI context'
      };
    }

    // Detect format
    const format = await this.detectFormat(found);

    return {
      hasSpecs: true,
      format,  // 'speckit', 'custom', or 'unknown'
      files: found,
      needsValidation: format === 'speckit'
    };
  }
}
```

## Success Metrics

Track these metrics to validate the system is working:

1. **Accuracy:** % of fixes that don't require manual intervention
2. **Token Efficiency:** Average tokens per file (diff vs full comparison)
3. **Cost:** Dollar cost per project audit
4. **Coverage:** % of issues detected vs missed (human review)
5. **Restore Rate:** % of sessions that required backup restore
6. **User Satisfaction:** Interactive mode feedback ratings

## Future Enhancements (Post-MVP)

1. **Web UI:** Visual interface for reviewing fixes (replace CLI --interactive)
2. **CI/CD Integration:** GitHub Actions, GitLab CI templates
3. **Custom Rules:** User-defined issue patterns and fixes
4. **Team Collaboration:** Share analyses, collaborative review
5. **Learning System:** Improve prompts based on user feedback
6. **IDE Integration:** VSCode extension, JetBrains plugin
7. **Incremental Audits:** Only scan changed files (git diff)

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] File scanner service (all files)
- [ ] File size validator
- [ ] Backup manager (create/restore/redo)
- [ ] State management system
- [ ] Updated CLI argument parsing

### Phase 2: LLM Integration (Week 2-3)
- [ ] Strategy pattern infrastructure
- [ ] Diff-based strategy implementation
- [ ] Full-file strategy implementation
- [ ] Model configuration system
- [ ] Token usage tracking

### Phase 3: Audit Engine (Week 3-4)
- [ ] File-by-file analysis loop
- [ ] Cross-file synthesis
- [ ] Fix ordering algorithm
- [ ] Validation pipeline
- [ ] Report generation

### Phase 4: Interactive Mode (Week 4)
- [ ] Summary display
- [ ] User prompts and feedback
- [ ] Selective file review
- [ ] Method selection interface

### Phase 5: Testing & Polish (Week 5)
- [ ] End-to-end testing
- [ ] Token usage comparison analysis
- [ ] Error handling refinement
- [ ] Documentation updates
- [ ] Performance optimization

## Conclusion

This design transforms delobotomize into an intelligent code doctor that can:
- Work from anywhere on any project
- Understand code intent, not just syntax
- Fix issues using two equally-capable methods
- Provide transparent reporting and full backup/restore
- Scale to large projects with proper validation

The dual fix method approach enables empirical comparison of token efficiency vs simplicity, informing future optimization.
