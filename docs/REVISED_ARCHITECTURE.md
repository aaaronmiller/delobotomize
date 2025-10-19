# Delobotomize - Revised Architecture & Implementation Plan
*Date: 2025-10-18*
*Version: 2.0 (Incorporating User Feedback)*

---

## REVISIONS SUMMARY

### User Feedback Addressed:

1. **✅ Removed --dry-run confusion**
   - Audit phase doesn't modify files (inherently "dry")
   - No need for --dry-run flag in audit
   - Archive/remediate have built-in confirmation prompts

2. **✅ Modular prompt/script architecture**
   - Prompts separated into `/prompts` directory
   - Scripts separated into `/scripts` directory
   - Independent from orchestration layer
   - Enables iterative refinement without breaking core

3. **✅ RAG/MCP Memory Graph Integration**
   - Audit findings stored as RAG-ready knowledge graph
   - MCP server exposes audit data to user's IDE
   - Persistent memory across sessions
   - Referenced RAG.md for implementation patterns

4. **✅ Research consolidation documented**
   - Created RESEARCH_CONSOLIDATION_LOG.md
   - All raw data preserved
   - Tier 1, 2, 3 consolidation phases logged

---

## CORE PHILOSOPHY

**Delobotomize = Emergency Triage + Context Restoration**

**NOT** a project starter (like SpecKit/Langchain-CLI)
**NOT** an active coding assistant (like Cursor/Aider)
**IS** a rescue tool for mid-project AI development disasters

---

## MODULAR ARCHITECTURE

### Directory Structure

```
delobotomize/
├── package.json
├── README.md
├── LICENSE (MIT)
├── .gitignore
├── delobotomize.config.json         # User configuration
│
├── bin/
│   └── delobotomize                 # CLI entry point
│
├── src/
│   ├── cli.js                       # Command routing (orchestration only)
│   ├── orchestrator/                # Task orchestration (no business logic)
│   │   ├── audit-orchestrator.js    # Coordinates audit phase
│   │   ├── triage-orchestrator.js   # Coordinates triage phase
│   │   └── remediate-orchestrator.js # Coordinates remediation phase
│   │
│   ├── core/                        # Core business logic
│   │   ├── file-scanner.js          # Filesystem operations
│   │   ├── ast-parser.js            # AST parsing for imports/exports
│   │   ├── dependency-graph.js      # Build file dependency graph
│   │   ├── classifier.js            # File classification logic
│   │   └── intent-analyzer.js       # LLM-based intent analysis
│   │
│   ├── memory/                      # RAG/MCP Memory System
│   │   ├── knowledge-graph.js       # Build knowledge graph from audit
│   │   ├── mcp-server.js            # MCP server for IDE integration
│   │   ├── embeddings.js            # Vector embeddings for semantic search
│   │   └── chunking.js              # RAG chunking strategies
│   │
│   ├── utils/
│   │   ├── api-client.js            # LLM API abstraction
│   │   ├── rate-limiter.js          # API rate limit handling
│   │   ├── logger.js                # Colored console output
│   │   └── git-helper.js            # Git operations (commit, rollback)
│   │
│   └── validators/
│       ├── audit-validator.js       # Validate audit completeness
│       ├── triage-validator.js      # Validate classification
│       └── remediate-validator.js   # Validate proposed changes
│
├── prompts/                         # LLM prompts (modular, version-controlled)
│   ├── audit/
│   │   ├── file-analysis.md         # Analyze single file intent
│   │   ├── syntax-check.md          # Check syntax errors
│   │   └── import-analysis.md       # Analyze imports/exports
│   │
│   ├── triage/
│   │   ├── classify-file.md         # Classify file purpose
│   │   ├── detect-scope-creep.md    # Detect out-of-scope features
│   │   └── intent-decision.md       # CREATE vs DELETE vs ARCHIVE
│   │
│   └── remediate/
│       ├── generate-function.md     # Generate missing function
│       ├── fix-imports.md           # Fix broken imports
│       └── consolidate-findings.md  # Consolidate all audit results
│
├── scripts/                         # Utility scripts (independent tools)
│   ├── setup/
│   │   ├── init-config.js           # Generate config file
│   │   ├── detect-api-keys.js       # Auto-detect API keys in env
│   │   └── create-directories.js    # Create output directories
│   │
│   ├── validation/
│   │   ├── test-api-connection.js   # Test LLM API connectivity
│   │   ├── validate-config.js       # Validate config file
│   │   └── check-dependencies.js    # Check project dependencies
│   │
│   └── reporting/
│       ├── generate-markdown.js     # Generate markdown reports
│       ├── generate-json.js         # Generate JSON exports
│       └── generate-graphs.js       # Generate dependency graphs
│
├── templates/                       # Document templates
│   ├── config.json                  # Default configuration template
│   ├── spec-overview.md             # Project spec template
│   ├── audit-report.md              # Audit report template
│   └── remediation-plan.md          # Remediation plan template
│
├── .delobotomize/                   # Generated artifacts (git-ignored)
│   ├── config.json                  # Active configuration
│   ├── audit-results/
│   │   ├── summary.md
│   │   ├── detailed-analysis.json
│   │   ├── dependency-graph.json
│   │   └── per-file/               # Individual file audit results
│   │       ├── src-index.js.json
│   │       └── ...
│   │
│   ├── knowledge-graph/             # RAG Memory System
│   │   ├── graph.json               # Full knowledge graph
│   │   ├── chunks/                  # RAG chunks
│   │   │   ├── chunk-001.json
│   │   │   └── ...
│   │   └── embeddings/              # Vector embeddings
│   │       └── index.faiss          # FAISS index for search
│   │
│   ├── mcp-server/                  # MCP Server files
│   │   ├── server.json              # MCP server config
│   │   └── context.json             # Current project context
│   │
│   └── specs/                       # Generated/repaired specs
│       ├── OVERVIEW.md
│       ├── ARCHITECTURE.md
│       └── FEATURES.md
│
└── docs/
    ├── USAGE.md
    ├── ARCHITECTURE.md (this file)
    ├── RAG_INTEGRATION.md
    └── MCP_SERVER.md
```

---

## PHASE GATES (No Dry-Run Confusion)

### Phase 1: AUDIT ✅
**What it does:** Scans all files, analyzes intent, builds dependency graph
**File modification:** ❌ None (read-only by design)
**Output:** JSON reports in `.delobotomize/audit-results/`
**Validation:** All files scanned? Dependency graph complete?

**User experience:**
```bash
$ delobotomize audit

🔍 Scanning codebase...
📊 Building dependency graph...
🧠 Analyzing file intent (via LLM)...
✅ Audit complete! Results in .delobotomize/audit-results/

Next step: delobotomize triage
```

**No --dry-run flag** - audit is inherently read-only

---

### Phase 2: TRIAGE ✅
**What it does:** Classifies files (core/incomplete/scope-creep/broken)
**File modification:** ❌ None (classification only)
**Output:** Classification in `audit-results/summary.md`
**Validation:** All files classified?

**User experience:**
```bash
$ delobotomize triage

🏷️  Classifying files based on audit...
✅ Triage complete!

Summary:
  Core files: 45
  Scope creep: 12 (recommended for archival)
  Incomplete: 8 (need implementation)
  Broken: 3 (need fixes)

Review: .delobotomize/audit-results/summary.md
Next step: delobotomize archive (or delobotomize remediate)
```

**No --dry-run flag** - triage is classification, not modification

---

### Phase 3: ARCHIVE ⚠️
**What it does:** Moves scope-creep files to `/archived-bloat/`
**File modification:** ✅ YES (moves files)
**Safety:** Interactive confirmation prompt + git commit before/after
**Rollback:** `delobotomize restore`

**User experience:**
```bash
$ delobotomize archive

⚠️  This will move 12 files to /archived-bloat/

Files to archive:
  src/demo/example.js (reason: demo file)
  src/old-api.js (reason: not imported anywhere)
  ...

Continue? [y/N]: y

📦 Creating git commit (pre-archive snapshot)...
🗄️  Archiving files...
📝 Generating archive manifest...
📦 Creating git commit (post-archive)...
✅ Archive complete!

To undo: delobotomize restore
Next step: delobotomize validate
```

**Built-in safety** - no --dry-run needed, confirmation prompt is the safety

---

### Phase 4: REMEDIATE ⚠️
**What it does:** Generates fixes (diff edits) for broken/incomplete code
**File modification:** ❌ None (generates proposals)
**Output:** Diff edit files in `.delobotomize/remediation/`
**User applies diffs:** Via IDE or `git apply`

**User experience:**
```bash
$ delobotomize remediate

🧠 Analyzing incomplete/broken files with smart model...
📝 Generating remediation plan...
✅ Remediation plan complete!

Actions proposed:
  CREATE: src/auth/validateToken.js (function missing)
  FIX: src/api/users.js (line 45: undefined import)
  DELETE: src/utils/old-helper.js (hallucination, not in spec)

Review diff edits in: .delobotomize/remediation/diffs/

To apply:
  1. Review diffs carefully
  2. Apply in your IDE or: git apply .delobotomize/remediation/combined.patch

Next step: delobotomize validate
```

**No --dry-run flag** - generates proposals, user decides whether to apply

---

### Phase 5: VALIDATE ✅
**What it does:** Smoke tests after changes (imports resolve? build works?)
**File modification:** ❌ None (testing only)
**Output:** Pass/fail report

**User experience:**
```bash
$ delobotomize validate

🔍 Running post-change validation...
  ✅ All imports resolve
  ✅ No circular dependencies
  ⚠️  Build has 2 TypeScript warnings (non-blocking)
  ✅ Core files unchanged

Validation: PASSED (with warnings)

Ready to resume development!
Use the prompt in .delobotomize/context-bootstrap.md
```

---

## RAG/MCP MEMORY GRAPH INTEGRATION

### Concept (from RAG.md)

**Problem:** After audit, findings are lost when user returns to IDE

**Solution:** Store audit findings as RAG-ready knowledge graph, expose via MCP server

### Architecture

```
┌─────────────────────────────────────────────────────┐
│ Delobotomize Audit                                   │
│ ├─ Scans codebase                                    │
│ ├─ Analyzes intent                                   │
│ └─ Outputs: JSON reports                             │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ RAG Processing (Chunking + Embeddings)               │
│ ├─ Chunk audit results (Semantic chunking)          │
│ ├─ Generate embeddings (vector representations)      │
│ └─ Build knowledge graph (file → findings)           │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ MCP Server (Persistent Memory)                       │
│ ├─ Exposes knowledge graph to IDE                    │
│ ├─ Enables semantic search (find by meaning)         │
│ └─ Provides context to AI assistant                  │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ User's IDE (Cursor, VS Code, etc.)                   │
│ ├─ AI assistant queries MCP server                   │
│ ├─ Retrieves audit findings for current file         │
│ └─ Context-aware suggestions (knows what's broken!)  │
└─────────────────────────────────────────────────────┘
```

### Data Structure (from RAG.md patterns)

**Recursive Hierarchical Chunking** (Method 4 from RAG.md):

```json
{
  "chunk_id": "uuid_file_src_auth_js",
  "content": "File: src/auth.js\nStatus: INCOMPLETE\nIssue: Function validateToken() called on line 45 but doesn't exist\nIntent: Authentication is a core project goal (from spec)\nRecommendation: CREATE function, don't delete call",
  "hierarchy_level": 2,
  "parent_chunk_id": "uuid_audit_summary",
  "structural_markers": {
    "file_path": "src/auth.js",
    "classification": "incomplete",
    "priority": "high"
  },
  "metadata": {
    "source_doc_id": "delobotomize_audit_2025-10-18",
    "chunk_type": "recursive_hierarchical",
    "date_processed": "2025-10-18",
    "embedding_model": "text-embedding-3-small"
  }
}
```

**Knowledge Graph Structure:**

```json
{
  "nodes": [
    {
      "id": "file_src_auth_js",
      "type": "file",
      "classification": "incomplete",
      "issues": ["missing_function_validateToken"],
      "dependencies": ["src/api/users.js"]
    },
    {
      "id": "function_validateToken",
      "type": "missing_function",
      "called_by": ["src/auth.js:45"],
      "recommendation": "CREATE",
      "reason": "Auth is in project spec"
    }
  ],
  "edges": [
    {
      "from": "file_src_auth_js",
      "to": "function_validateToken",
      "relationship": "needs"
    }
  ]
}
```

### MCP Server Implementation

**Based on research:** "RAG-Memory MCP Server" pattern

```javascript
// src/memory/mcp-server.js

class DelobotomizeMCPServer {
  constructor(knowledgeGraph, embeddingsIndex) {
    this.graph = knowledgeGraph;
    this.index = embeddingsIndex;
  }

  // MCP Server endpoint: Get context for file
  async getFileContext(filePath) {
    const node = this.graph.findNode(filePath);
    if (!node) return null;

    return {
      file: filePath,
      classification: node.classification,
      issues: node.issues,
      recommendations: this.getRecommendations(node),
      relatedFiles: this.graph.getDependencies(node)
    };
  }

  // MCP Server endpoint: Semantic search
  async semanticSearch(query) {
    const queryEmbedding = await this.embed(query);
    const results = this.index.search(queryEmbedding, k=5);

    return results.map(r => ({
      chunk_id: r.id,
      content: r.content,
      relevance: r.score,
      file: r.metadata.file_path
    }));
  }

  // MCP Server endpoint: Get all incomplete files
  async getIncompleteFiles() {
    return this.graph.nodes.filter(n =>
      n.classification === 'incomplete'
    );
  }
}
```

**User's IDE Integration:**

```javascript
// User's .cursor/config or continue.dev config

{
  "mcpServers": {
    "delobotomize": {
      "command": "node",
      "args": [".delobotomize/mcp-server/server.js"],
      "env": {}
    }
  }
}
```

**Usage in IDE:**

User types: `@delobotomize What's broken in src/auth.js?`

MCP Server responds:
```
src/auth.js is classified as INCOMPLETE.

Issues:
- Function validateToken() called on line 45 but doesn't exist

Recommendation: CREATE this function (auth is in project spec)

Dependencies:
- src/api/users.js imports this file
```

### Persistence Across Sessions

**From RAG.md:** "Database-backed project memory management system"

- Audit findings stored in `.delobotomize/knowledge-graph/graph.json`
- Vector embeddings in `.delobotomize/knowledge-graph/embeddings/index.faiss`
- MCP server reads these on startup
- Findings persist even if user closes IDE and returns later
- **Solves context collapse problem permanently**

---

## MODULAR PROMPT ARCHITECTURE

### Separation of Concerns

**Orchestration** (src/orchestrator/) - Coordinates tasks
**Prompts** (prompts/) - LLM instructions
**Scripts** (scripts/) - Utility functions

### Example: Audit Phase

**Orchestration (src/orchestrator/audit-orchestrator.js):**
```javascript
async function auditCodebase(config) {
  // 1. Scan files
  const files = await fileScanner.scan(config.scanDirs);

  // 2. For each file, run analysis (parallel)
  const results = await Promise.all(
    files.map(file => analyzeFile(file, config))
  );

  // 3. Build dependency graph
  const graph = await dependencyGraph.build(results);

  // 4. Validate completeness
  await auditValidator.validate(results, graph);

  // 5. Save results
  await saveResults(results, graph);
}
```

**Prompt (prompts/audit/file-analysis.md):**
```markdown
# File Intent Analysis

You are analyzing a code file to determine why it exists and whether it should be kept, modified, or archived.

## Input
- **File path:** {{FILE_PATH}}
- **File content:** {{FILE_CONTENT}}
- **Project goals:** {{PROJECT_GOALS}}
- **Import count:** {{IMPORT_COUNT}}
- **Imported by:** {{IMPORTED_BY}}

## Your Task
Analyze this file and determine:

1. **Purpose:** What does this file do?
2. **Alignment:** Does it align with project goals?
3. **Status:** Is it complete, incomplete, or broken?
4. **Recommendation:** KEEP / ARCHIVE / FIX / CREATE_MISSING

## Output Format (JSON)
{
  "purpose": "Brief description",
  "alignment": "aligned|out-of-scope|unclear",
  "status": "complete|incomplete|broken",
  "issues": ["Issue 1", "Issue 2"],
  "recommendation": "KEEP|ARCHIVE|FIX|CREATE_MISSING",
  "reason": "Explanation for recommendation"
}
```

**Script (scripts/validation/test-api-connection.js):**
```javascript
#!/usr/bin/env node
// Standalone script to test API connectivity

const apiClient = require('../../src/utils/api-client');

async function testConnection(provider, apiKey) {
  try {
    const response = await apiClient.test(provider, apiKey);
    console.log(`✅ ${provider} API connected successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${provider} API connection failed:`, error.message);
    return false;
  }
}

// Can be run independently: node scripts/validation/test-api-connection.js
```

### Benefits of Separation

1. **Iterative Refinement:** Modify prompts without touching orchestration
2. **Version Control:** Track prompt changes separately from code
3. **Testing:** Test scripts independently
4. **Reusability:** Use same scripts in multiple orchestrators
5. **Clarity:** Clear separation of "what to do" (orchestration) vs "how to do it" (scripts/prompts)

---

## REVISED IMPLEMENTATION ROADMAP

### Phase 1: Core CLI + File Scanning (Week 1-2)

**Goals:**
- CLI structure with Commander.js
- File scanning (no LLM yet)
- Dependency graph construction (AST parsing)
- Basic classification (heuristic-based)

**Deliverables:**
- `delobotomize init` - Create config
- `delobotomize audit` - Scan files, build graph (no intent analysis yet)
- Output: Basic JSON reports

**Tech Stack:**
- Node.js 20+, pnpm
- Commander.js (CLI)
- @babel/parser (AST parsing)
- Chalk, Ora (UI)

---

### Phase 2: LLM Integration + Intent Analysis (Week 3-4)

**Goals:**
- API client for Claude/GPT/Gemini
- Prompt system (modular prompts)
- Intent analysis for files
- Two-tier model usage (cheap + expensive)

**Deliverables:**
- Intent analysis via LLM
- Classification with reasoning
- Parallel execution (50 concurrent API calls)
- Rate limit handling

**New Files:**
- `src/utils/api-client.js`
- `src/core/intent-analyzer.js`
- `prompts/audit/file-analysis.md`

---

### Phase 3: RAG/MCP Memory System (Week 5-6)

**Goals:**
- Chunk audit results (Semantic + Recursive Hierarchical)
- Generate embeddings
- Build knowledge graph
- MCP server implementation

**Deliverables:**
- `.delobotomize/knowledge-graph/` structure
- MCP server exposing audit findings
- Semantic search over findings
- IDE integration docs

**New Files:**
- `src/memory/knowledge-graph.js`
- `src/memory/mcp-server.js`
- `src/memory/embeddings.js`
- `src/memory/chunking.js`

**Dependencies:**
- `@anthropic-ai/sdk` (embeddings)
- `faiss-node` (vector search)
- Or `@xenova/transformers` (local embeddings)

---

### Phase 4: Archive + Remediate (Week 7-8)

**Goals:**
- Safe file archival with git commits
- Diff edit generation
- Task list for user
- Validation suite

**Deliverables:**
- `delobotomize archive` - Move files safely
- `delobotomize remediate` - Generate fixes
- `delobotomize restore` - Rollback
- `delobotomize validate` - Smoke tests

---

### Phase 5: Polish + Documentation (Week 9-10)

**Goals:**
- Comprehensive docs
- Example projects
- Error handling
- Performance tuning

**Deliverables:**
- Full README with examples
- Usage guide
- MCP server setup guide
- Troubleshooting docs

**Total:** ~10 weeks to v1.0.0

---

## TECHNICAL DECISIONS

### 1. No --dry-run Flag

**Rationale:** Each phase has built-in safety
- Audit/Triage: Read-only (no dry-run needed)
- Archive: Interactive confirmation + git commits
- Remediate: Generates proposals, doesn't apply

**User Feedback:** "Don't confuse users with dry-run that doesn't add utility"

---

### 2. Modular Prompts/Scripts

**Rationale:** Enable iterative improvement
- Prompts in `/prompts` (version-controlled markdown)
- Scripts in `/scripts` (independent utilities)
- Orchestration in `/src/orchestrator` (coordination only)

**User Feedback:** "Structure project so prompts/scripts can be refined without impacting orchestration"

---

### 3. RAG/MCP Integration

**Rationale:** Solve context collapse permanently
- Audit findings stored as knowledge graph
- MCP server exposes to IDE
- AI assistant has persistent memory of what's broken

**User Feedback:** "Create memory graph based on findings, use MCP server to provide findings permanently"

**Reference:** RAG.md for chunking strategies and data structures

---

### 4. Git-Based Rollback

**Rationale:** Leverage existing tools
- Auto-commit before archival
- Auto-commit after archival
- Rollback = `git reset --hard` or restore script

**Research:** jscodeshift pattern (no custom undo mechanism)

---

## NEXT STEPS

1. **✅ User approval of revised architecture**
2. **⏳ Begin Phase 1 implementation** (Core CLI + File Scanning)
3. **⏳ Create initial prompts** (file-analysis.md, classify-file.md)
4. **⏳ Research RAG chunking libraries** (for Phase 3)
5. **⏳ Research MCP server implementation** (for Phase 3)

---

*End of Revised Architecture*
*All user feedback incorporated, modular design established, RAG/MCP integration planned*
