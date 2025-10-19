# Artifact #3 - codebase-mapper.cjs (Automated Codebase Scanner)

**Source:** ARTIFACTS.md (lines 1477-2097)
**Date:** 2025-10-15 19:30:00 PST
**Version:** 1.0.0
**Tags:** [codebase-analysis, audit, mapping, file-classification, DIRECT-IMPLEMENTATION]

---

## Context Classification

**Primary Context:** **DIRECT IMPLEMENTATION** 🎯

**DataKiln-Specific:** Configuration patterns, project goals list
**General Value:** 95% of this code is directly applicable to ANY project
**Delobotomize Use:** **This IS our audit scanner** (with modifications)

---

## Executive Summary

**What This Is:**
- Complete Node.js script for scanning and classifying project files
- Dependency graph construction via import/export detection
- Classification engine (core, active, suspicious, orphaned, stale)
- Multi-report generation (summary, detailed, archival plan, dependency graph)

**Direct Value:**
- 616 lines of production-ready code
- Already handles ES6 + CommonJS patterns
- Proven classification heuristics
- Report structure is excellent

**Adaptation Required:**
- Remove DataKiln-specific patterns (youtube-transcript, gemini-analysis)
- Add LLM intent analysis layer for "WHY does this file exist?"
- Integrate with RAG/MCP for persistent findings
- Make configuration project-agnostic

---

## CODE STRUCTURE ANALYSIS

### 1. Configuration System (Lines 1496-1517)

**DataKiln-Specific Elements:**
```javascript
// REMOVE: DataKiln-specific patterns
projectGoals: [
  'YouTube video transcript extraction and analysis',
  'Deep research orchestration with Gemini AI',
  'Browser automation via Playwright',
  'Express API server with SSE progress tracking',
  'Frontend UI with Vite/React/Tailwind'
]
```

**Generic Elements (KEEP):**
```javascript
// KEEP: These are universally applicable
scanDirs: ['src', 'scripts', 'server.cjs', 'vite.config.ts', 'package.json'],
ignoreDirs: ['node_modules', 'dist', 'build', '.git', 'browser-context', '.kilocode'],
includeExtensions: ['.js', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.md'],
outputDir: './audit-reports'
```

**Delobotomize Modification:**
```javascript
// Auto-detect project type and adapt
const CONFIG = {
  scanDirs: detectEntryPoints(), // Auto-find src/, lib/, etc.
  ignoreDirs: [...DEFAULT_IGNORES, ...readGitignore()],
  includeExtensions: detectLanguages(), // JS/TS/PY/GO based on package files
  outputDir: '.delobotomize/audit-reports'
};
```

---

### 2. Classification Rules (Lines 1523-1565)

**Current Rules (Mostly Generic):**

| Rule Type | Pattern | Generic? | Notes |
|-----------|---------|----------|-------|
| **core** | `server.(cjs\|js\|ts)`, `main.`, `App.`, `index.` | ✅ YES | Universal patterns |
| **activeScripts** | `youtube-transcript`, `gemini.*analysis` | ❌ NO | DataKiln-specific |
| **config** | `.config.(js\|ts\|cjs)`, `.rc`, `package.json` | ✅ YES | Universal |
| **suspicious** | `example/`, `demo/`, `test/`, `backup/`, `old/` | ✅ YES | Universal anti-patterns |

**Delobotomize Enhancement:**
```javascript
const CLASSIFICATION_RULES = {
  core: [
    /server\.(cjs|js|ts)$/,
    /main\.(js|ts|tsx|py|go)$/,
    /App\.(tsx|jsx)$/,
    /index\.(html|tsx|jsx|py)$/,
    /package\.json$/, /go\.mod$/, /pyproject\.toml$/ // Multi-language
  ],

  // REMOVE DataKiln-specific activeScripts patterns
  // ADD: LLM-based intent detection instead (see below)

  suspicious: [
    ...CURRENT_PATTERNS,
    /temp/i, /tmp/i, /scratch/i, // Additional patterns
    /\d{8}/, // Date-stamped files (backup20241015.js)
    /-copy\d*\./ // Finder duplicates (file-copy.js)
  ]
};
```

**LLM Intent Layer (NEW):**
```javascript
// Ask WHY this file exists
async function classifyViaIntent(file) {
  const prompt = `
    File: ${file.path}
    Lines: ${file.lines}
    Imports: ${file.imports.join(', ')}
    Exports: ${file.exports.join(', ')}

    Question: Why does this file exist? Categories:
    - CORE: Essential infrastructure (server, router, auth)
    - FEATURE: Implements specific user-facing functionality
    - UTILITY: Helper functions (logger, formatter)
    - TEST: Testing code
    - ABANDONED: Started but never finished
    - DUPLICATE: Functionality exists elsewhere
  `;

  return await llm.classify(prompt); // Lightweight model
}
```

---

### 3. CodebaseAnalyzer Class (Lines 1571-2078)

**Methods Breakdown:**

| Method | Purpose | Generic? | Adaptation Needed |
|--------|---------|----------|-------------------|
| `scanDirectory()` | Recursive file scanning | ✅ YES | None - perfect as-is |
| `analyzeFile()` | Extract metadata | ✅ YES | Add intent analysis layer |
| `extractImports()` | Parse ES6/CJS imports | ✅ YES | Add Python/Go support |
| `extractExports()` | Parse exports | ✅ YES | Add multi-language |
| `analyzeImports()` | Build dependency graph | ✅ YES | None - perfect |
| `classifyFiles()` | Apply classification rules | 🟡 PARTIAL | Remove DataKiln patterns |
| `generateReports()` | Create 4 output files | ✅ YES | Add JSON output for MCP |
| `generateSummaryReport()` | High-level stats | ✅ YES | None |
| `generateDetailedReport()` | Per-file breakdown | ✅ YES | None |
| `generateArchivalPlan()` | Bash script + manifest | ✅ YES | None - brilliant! |
| `generateDependencyGraph()` | Import relationships | ✅ YES | Add visual graph (mermaid) |

---

## KEY FUNCTIONS FOR DELOBOTOMIZE

### Function 1: `extractImports()` (Lines 1654-1673)

**Current Implementation:**
```javascript
extractImports(content, ext) {
  const imports = [];

  if (['.js', '.cjs', '.ts', '.tsx', '.jsx'].includes(ext)) {
    // ES6 imports
    const es6Pattern = /import\s+.*?from\s+['"](.+?)['"]/g;
    let match;
    while ((match = es6Pattern.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // CommonJS requires
    const cjsPattern = /require\s*\(['"](.+?)['"]\)/g;
    while ((match = cjsPattern.exec(content)) !== null) {
      imports.push(match[1]);
    }
  }

  return imports;
}
```

**Delobotomize Enhancement:**
```javascript
extractImports(content, ext) {
  const imports = [];

  // JavaScript/TypeScript (KEEP EXISTING)
  if (['.js', '.cjs', '.ts', '.tsx', '.jsx'].includes(ext)) {
    // ... existing code
  }

  // Python
  if (ext === '.py') {
    // from foo import bar
    const fromPattern = /from\s+([^\s]+)\s+import/g;
    let match;
    while ((match = fromPattern.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // import foo
    const importPattern = /^import\s+([^\s]+)/gm;
    while ((match = importPattern.exec(content)) !== null) {
      imports.push(match[1]);
    }
  }

  // Go
  if (ext === '.go') {
    const goPattern = /import\s+"([^"]+)"/g;
    let match;
    while ((match = goPattern.exec(content)) !== null) {
      imports.push(match[1]);
    }
  }

  return imports;
}
```

---

### Function 2: `classifyFiles()` (Lines 1734-1789)

**Current Logic Flow:**
1. Check core patterns → mark as 'core'
2. Check activeScripts patterns → mark as 'active' (DataKiln-specific!)
3. Check config patterns → mark as 'config'
4. Check if orphaned → mark as 'orphaned'
5. Check suspicious patterns → mark as 'suspicious'
6. Check last modified > 90 days → mark as 'stale'
7. Default → 'active'

**Delobotomize Enhancement:**
```javascript
async classifyFiles() {
  console.log('🏷️  Classifying files...');

  for (const file of this.files) {
    // PHASE 1: Pattern-based classification (fast)
    const patternClass = this.classifyByPattern(file); // Existing logic

    // PHASE 2: Intent-based classification (LLM)
    if (patternClass === 'unknown' || patternClass === 'active') {
      file.intent = await this.classifyViaIntent(file); // NEW
      file.classification = this.resolveClassification(patternClass, file.intent);
    } else {
      file.classification = patternClass;
    }

    // PHASE 3: Risk scoring (NEW)
    file.riskScore = this.calculateRisk(file);
  }
}

calculateRisk(file) {
  let risk = 0;

  // High complexity + no tests = risky
  if (file.lines > 500 && !this.hasTestCoverage(file.path)) {
    risk += 30;
  }

  // Orphaned exports = probably dead code
  if (file.classification === 'orphaned') {
    risk += 40;
  }

  // Suspicious patterns = high risk
  if (file.classification === 'suspicious') {
    risk += 50;
  }

  // Modified recently = low risk (actively maintained)
  const daysSinceModified = (Date.now() - file.lastModified) / (1000 * 60 * 60 * 24);
  if (daysSinceModified < 30) {
    risk -= 20;
  }

  return Math.max(0, Math.min(100, risk)); // Clamp 0-100
}
```

---

### Function 3: `generateArchivalPlan()` (Lines 1894-2010)

**This is BRILLIANT - generates executable bash script!**

**Current Output:**
```bash
#!/bin/bash
# archive-files.sh - Generated by codebase analyzer

ARCHIVE_DIR="archive/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$ARCHIVE_DIR"

# For each file to archive:
mkdir -p "$ARCHIVE_DIR/$(dirname "${file.path}")"
mv "${file.path}" "$ARCHIVE_DIR/${file.path}"
echo "- ${file.path} (${file.reason})" >> "$ARCHIVE_DIR/MANIFEST.md"
```

**Delobotomize Enhancement:**
```javascript
async generateArchivalPlan() {
  const toArchive = this.files.filter(f =>
    f.classification === 'suspicious' ||
    f.classification === 'orphaned' ||
    f.classification === 'stale' ||
    f.riskScore > 60 // NEW: Risk-based archival
  );

  // Generate script WITH git integration
  const scriptContent = `
#!/bin/bash
set -e

ARCHIVE_DIR=".delobotomize/archive/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$ARCHIVE_DIR"

# Create git commit BEFORE archiving (safety!)
git add -A
git commit -m "Pre-archive snapshot (auto-generated by Delobotomize)"

${toArchive.map(file => `
# ${file.path} (Risk: ${file.riskScore}/100)
mkdir -p "$ARCHIVE_DIR/$(dirname "${file.path}")"
git mv "${file.path}" "$ARCHIVE_DIR/${file.path}" # Use git mv, not mv
`).join('\n')}

# Create post-archive commit
git add -A
git commit -m "Archive ${toArchive.length} files (Delobotomize auto-triage)"

echo "✅ Archived ${toArchive.length} files"
echo "📁 Location: $ARCHIVE_DIR"
echo "To rollback: git reset --hard HEAD~2"
  `;

  // ... rest of function
}
```

---

### Function 4: `generateDependencyGraph()` (Lines 2012-2057)

**Current Output:** Markdown lists of imports

**Delobotomize Enhancement:** Add Mermaid diagram generation

```javascript
async generateDependencyGraph() {
  // ... existing markdown generation ...

  // NEW: Generate Mermaid diagram
  let mermaid = `graph LR\n`;

  for (const [file, imports] of this.imports.entries()) {
    const fileShort = file.replace(/^src\//, '');
    for (const imp of imports) {
      const impShort = imp.replace(/^src\//, '');
      mermaid += `  ${fileShort} --> ${impShort}\n`;
    }
  }

  await fs.writeFile(
    path.join(CONFIG.outputDir, 'dependency-graph.mmd'),
    mermaid
  );
  console.log('✅ Generated: dependency-graph.mmd');
}
```

---

## REPORT STRUCTURE ANALYSIS

### Generated Files (4 reports)

| Report | Purpose | Value for Delobotomize |
|--------|---------|------------------------|
| **summary.md** | High-level stats, classification breakdown | ✅ Perfect as-is |
| **detailed-analysis.md** | Per-file metadata | ✅ Add intent analysis |
| **archival-plan.md** | Bash script + file list | ✅ Add git integration |
| **dependency-graph.md** | Import relationships | ✅ Add mermaid diagram |

**NEW Report for Delobotomize:**
```javascript
async generateMCPExport() {
  // Export findings to MCP server format
  const mcpData = {
    timestamp: new Date().toISOString(),
    project: {
      totalFiles: this.stats.totalFiles,
      totalLines: this.stats.totalLines
    },
    files: this.files.map(f => ({
      path: f.path,
      classification: f.classification,
      intent: f.intent, // LLM-determined
      riskScore: f.riskScore,
      imports: this.imports.get(f.path) || [],
      importedBy: this.importedBy.get(f.path) || [],
      reason: f.reason,
      metadata: {
        lines: f.lines,
        size: f.size,
        lastModified: f.lastModified
      }
    })),
    recommendations: this.generateRecommendations()
  };

  await fs.writeFile(
    path.join(CONFIG.outputDir, 'mcp-export.json'),
    JSON.stringify(mcpData, null, 2)
  );
  console.log('✅ Generated: mcp-export.json (for MCP server)');
}
```

---

## DATAKILN-SPECIFIC ELEMENTS (TO REMOVE)

### 1. Project Goals Configuration
```javascript
// REMOVE: Lines 1509-1516
projectGoals: [
  'YouTube video transcript extraction and analysis',
  'Deep research orchestration with Gemini AI',
  'Browser automation via Playwright',
  'Express API server with SSE progress tracking',
  'Frontend UI with Vite/React/Tailwind'
]
```

**Delobotomize Replacement:**
```javascript
// Auto-infer from package.json
projectGoals: await this.inferProjectGoals()

async inferProjectGoals() {
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
  const goals = [];

  if (pkg.dependencies?.express) goals.push('Express API server');
  if (pkg.dependencies?.react) goals.push('React frontend');
  if (pkg.dependencies?.playwright) goals.push('Browser automation');
  // ... etc

  return goals;
}
```

---

### 2. Active Scripts Patterns
```javascript
// REMOVE: Lines 1536-1541
activeScripts: [
  /youtube-transcript/,
  /gemini.*analysis/,
  /deep-research-orchestrator/,
  /logger/
]
```

**Delobotomize Replacement:**
```javascript
// Don't hardcode patterns - use LLM intent detection
// OR: Let user configure via .delobotomize/config.yaml
activeScripts: CONFIG.customPatterns?.active || []
```

---

## DELOBOTOMIZE INTEGRATION PLAN

### Phase 1: Direct Adoption (Week 2)
1. Copy `CodebaseAnalyzer` class to `src/core/scanner.ts`
2. Convert from CommonJS to ESM
3. Add TypeScript types
4. Remove DataKiln-specific patterns

### Phase 2: Enhancement (Week 3-4)
1. Add multi-language support (Python, Go)
2. Add LLM intent analysis layer
3. Add risk scoring system
4. Add MCP export format

### Phase 3: Integration (Week 5)
1. Connect to RAG/MCP memory system
2. Add visual dependency graphs (Mermaid)
3. Add git integration to archive script
4. Add rollback safety mechanisms

---

## TEMPLATES FOR DIRECT USE

### Template 1: Classification Config
```yaml
# .delobotomize/classification.yaml

core_patterns:
  - server\.(cjs|js|ts)$
  - main\.(js|ts|tsx|py|go)$
  - App\.(tsx|jsx)$
  - index\.(html|tsx|jsx|py)$

suspicious_patterns:
  - example/
  - demo/
  - test(?!ing)/  # "test" but not "testing"
  - backup/
  - old/
  - deprecated/
  - temp/
  - \d{8}/  # Date-stamped dirs

stale_threshold_days: 90

ignore_dirs:
  - node_modules
  - dist
  - build
  - .git
  - __pycache__
  - .venv
```

---

### Template 2: Scanner Invocation
```javascript
// scripts/audit.js - Delobotomize entry point

import { CodebaseScanner } from '../src/core/scanner.js';

async function runAudit() {
  const scanner = new CodebaseScanner({
    scanDirs: await detectEntryPoints(),
    ignoreDirs: await readGitignore(),
    includeExtensions: await detectLanguages(),
    outputDir: '.delobotomize/audit'
  });

  // Run analysis
  await scanner.analyze();

  // Export to MCP
  await scanner.generateMCPExport();

  console.log('✅ Audit complete!');
  console.log('📊 View reports: .delobotomize/audit/');
}

runAudit();
```

---

### Template 3: MCP Integration
```javascript
// src/memory/mcp-server.js

import { MCPServer } from '@modelcontextprotocol/sdk';

class DelobotomizeMCP extends MCPServer {
  async initialize() {
    // Load audit findings
    const findings = JSON.parse(
      await fs.readFile('.delobotomize/audit/mcp-export.json', 'utf-8')
    );

    // Index in vector DB
    await this.indexFindings(findings);
  }

  async getFileContext(filePath) {
    // Return audit findings for specific file
    return this.vectorDB.search({ path: filePath });
  }

  async semanticSearch(query) {
    // Search findings by meaning
    return this.vectorDB.semanticSearch(query);
  }
}
```

---

## RAG/MCP CHUNKING STRATEGY

**How to chunk this artifact for RAG:**

```json
{
  "chunks": [
    {
      "id": "codebase-mapper-overview",
      "content": "CodebaseAnalyzer class for scanning and classifying files",
      "metadata": {
        "artifact": "artifact-03",
        "type": "DIRECT_IMPLEMENTATION",
        "functions": ["scanDirectory", "classifyFiles", "generateReports"]
      }
    },
    {
      "id": "classification-rules",
      "content": "File classification patterns: core, active, suspicious, orphaned, stale",
      "metadata": {
        "artifact": "artifact-03",
        "type": "METHODOLOGY",
        "applicable_to": "ANY_PROJECT"
      }
    },
    {
      "id": "import-extraction",
      "content": "Regex patterns for extracting ES6 and CommonJS imports",
      "metadata": {
        "artifact": "artifact-03",
        "type": "CODE_PATTERN",
        "languages": ["javascript", "typescript"]
      }
    },
    {
      "id": "dependency-graph",
      "content": "Build import/export dependency graph using Maps",
      "metadata": {
        "artifact": "artifact-03",
        "type": "ALGORITHM",
        "complexity": "O(n)"
      }
    },
    {
      "id": "archive-script-generation",
      "content": "Generate executable bash script to move files to archive/",
      "metadata": {
        "artifact": "artifact-03",
        "type": "CODE_GENERATION",
        "safety": "includes rollback instructions"
      }
    }
  ]
}
```

---

## DELOBOTOMIZE AUDIT RULES (NEW)

```yaml
# .delobotomize/rules/scanner-patterns.yaml

rules:
  - id: orphaned-exports
    check: "file.exports.length > 0 && file.importedBy.length === 0"
    severity: MEDIUM
    classification: dead-code
    recommendation: "Archive if not recently modified"

  - id: high-complexity-no-tests
    check: "file.lines > 500 && !hasTestCoverage(file.path)"
    severity: HIGH
    classification: technical-debt
    recommendation: "Add tests before archiving"

  - id: suspicious-naming
    pattern: "test|demo|example|backup|old|deprecated|temp"
    severity: MEDIUM
    classification: scope-creep
    recommendation: "Review for archival"

  - id: stale-file
    check: "daysSinceModified > 90"
    severity: LOW
    classification: inactive
    recommendation: "Archive if not core infrastructure"
```

---

## KEY TAKEAWAYS

### What to Keep (95% of the code)
1. ✅ **All scanning logic** - recursive directory traversal
2. ✅ **Import/export extraction** - ES6 + CommonJS patterns
3. ✅ **Dependency graph construction** - perfect as-is
4. ✅ **Classification engine** - core, suspicious, orphaned, stale
5. ✅ **Report generation** - all 4 reports are excellent
6. ✅ **Archive script generation** - brilliant safety mechanism

### What to Remove (5%)
1. ❌ DataKiln `projectGoals` (lines 1510-1516)
2. ❌ DataKiln `activeScripts` patterns (lines 1536-1541)

### What to Add
1. ➕ Multi-language support (Python, Go)
2. ➕ LLM intent analysis layer
3. ➕ Risk scoring system
4. ➕ MCP export format (JSON)
5. ➕ Mermaid dependency diagrams
6. ➕ Git integration in archive script

---

## NEXT STEPS

1. Extract Artifact #4 (validate-post-archive.cjs) - validation patterns
2. Compare scanner + validator for integration opportunities
3. Create unified `src/core/scanner.ts` based on this artifact
4. Map to REVISED_ARCHITECTURE.md phases

---

*End of Artifact #3 Analysis*
*Key Takeaway: 95% of this code is production-ready for Delobotomize!*
*Next: Artifact #4 (validator - DIRECT IMPLEMENTATION)*
