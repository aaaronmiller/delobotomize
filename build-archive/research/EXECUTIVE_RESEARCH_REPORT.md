# Delobotomize - Executive Research Report
*Research Completed: 2025-10-18*
*Purpose: Analyze similar tools and approaches to inform Delobotomize architecture*

---

## EXECUTIVE SUMMARY

**Key Finding:** **No existing tool solves the mid-project AI triage problem**

While many tools exist for:
- Project initialization (SpecKit, Langchain-CLI)
- Context preservation (Cursor, Continue.dev, Aider)
- Static analysis (Semgrep, CodeQL)
- Large-scale refactoring (jscodeshift/codemods)

**NONE combine these capabilities for mid-project rescue when AI development has gone off the rails.**

**Delobotomize fills a critical gap:** Emergency triage + context restoration + intent analysis for projects suffering from context collapse and "blind gardener" syndrome.

---

## TABLE OF CONTENTS

1. [Tool-by-Tool Analysis](#tool-by-tool-analysis)
2. [Competitive Landscape](#competitive-landscape)
3. [Technical Approaches to Borrow](#technical-approaches-to-borrow)
4. [Spec File Format Recommendations](#spec-file-format-recommendations)
5. [Context Preservation Strategies](#context-preservation-strategies)
6. [Parallel Execution Patterns](#parallel-execution-patterns)
7. [Unique Value Proposition](#unique-value-proposition)
8. [Implementation Roadmap](#implementation-roadmap)

---

## TOOL-BY-TOOL ANALYSIS

### 1. LangChain-CLI / LangGraph

**KEEP_VERBATIM:**
- **GitHub:** https://github.com/langchain-ai/cli
- **Config File:** `langgraph.json` (JSON format)
- **Commands:** `app add`, `app new`, `app serve`, `serve`

**What It Does:**
- Initialize new LangChain/LangGraph applications
- Manage templates and dependencies
- Deploy LangGraph apps

**Configuration Structure:**
```json
{
  "dependencies": ["langchain_openai", "./local_package"],
  "graphs": {
    "agent_name": "./your_package/your_file.py:agent"
  },
  "env": ".env",
  "dockerfile_lines": []
}
```

**Strengths:**
- Clear JSON schema for configuration
- Dependency management
- Environment variable handling
- Template-based project generation

**Gaps for Delobotomize:**
- ❌ No mid-project audit
- ❌ No context restoration
- ❌ No scope creep detection
- ✅ Good spec format to borrow

**Lessons Learned:**
1. JSON config is simple and widely supported
2. Dependency tracking is essential
3. Template-based approach works well
4. Environment variables should be first-class citizens

---

### 2. SpecKit (GitHub)

**KEEP_VERBATIM:**
- **GitHub:** https://github.com/github/spec-kit
- **Released:** September 2025 (very recent!)
- **Commands:** `/speckit.specify`, `/speckit.clarify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`

**What It Does:**
Spec-driven development toolkit with four phases:
1. **Specify** - Write detailed specs
2. **Clarify** - Validate specs for ambiguity/contradictions
3. **Plan** - Generate implementation plan
4. **Implement** - Execute plan

**Key Philosophy:**
> "Specifications must be precise, complete, and unambiguous enough to generate working systems"

**Validation Approach:**
- Automated checklist validation
- **Specification Quality Checklist** before proceeding
- Checks for:
  - Content quality
  - Requirement completeness
  - Feature readiness
  - Ambiguity detection
  - Contradiction detection

**Strengths:**
- Clear phase gates (don't move forward until current phase validated)
- Continuous validation (not one-time)
- AI-assisted spec analysis
- Markdown-based specs (human-readable)

**Gaps for Delobotomize:**
- ❌ Only for NEW projects (initialization)
- ❌ No mid-project rescue
- ❌ No audit of existing code
- ✅ Excellent validation patterns to borrow

**Lessons Learned:**
1. **Phase gates are critical** - don't proceed until validated
2. **Ambiguity detection** - ask AI to find contradictions
3. **Checklists work** - automated validation checklists
4. **Markdown specs** - human-readable, LLM-friendly
5. **Continuous validation** - not just one-time check

**Application to Delobotomize:**
- Use similar validation checklists for audits
- Adopt phase gate approach (Audit → Triage → Remediate → Validate)
- Borrow spec format for generating missing specs

---

### 3. Aider (AI Pair Programmer)

**KEEP_VERBATIM:**
- **GitHub:** https://github.com/Aider-AI/aider
- **License:** Apache 2.0
- **Key Feature:** Repository map auto-generation

**What It Does:**
Terminal-based AI pair programming with:
- Multi-file coordinated edits
- Automatic git commits
- Repository map generation
- Context management

**Context Management Approach:**
> "Aider will automatically give the LLM additional context about the rest of your git repo by analyzing your entire codebase in light of the current chat to build a compact repository map"

- `/context` command - Auto-identifies files needing edits
- **Best practice:** Manually add only relevant files (adding too many confuses LLM)

**Safety Mechanisms:**
- Automatic commits with descriptive messages
- Easy rollback via git
- Session save/load (AiderDesk extension)
- Preserves chat history and context per project

**Strengths:**
- **Repository map** - analyzes entire codebase for context
- **Automatic commits** - safety net for changes
- **Git integration** - easy undo/diff
- **Session persistence** - save/resume work

**Gaps for Delobotomize:**
- ❌ No audit/triage capabilities
- ❌ Assumes user knows what to fix
- ❌ No scope creep detection
- ✅ Excellent git safety patterns

**Lessons Learned:**
1. **Repository map is powerful** - scan entire codebase for context
2. **Auto-commit everything** - creates safety net
3. **Don't overload context** - too many files confuses LLM
4. **Session persistence** - save project state between runs

**Application to Delobotomize:**
- Generate similar repository map during audit
- Auto-commit before/after archival
- Save audit state for resumption
- Learn from "too much context" problem

---

### 4. Continue.dev (VS Code Extension)

**KEEP_VERBATIM:**
- **GitHub:** https://github.com/continuedev/continue
- **Architecture:** `core <-> extension <-> gui` (three-layer)
- **State Management:** React + Redux Toolkit

**What It Does:**
Open-source AI code agent for VS Code with:
- Custom context providers
- Rules-based project context
- Configuration-driven behavior

**Context Preservation:**
- **`.continue/rules/`** directory - Markdown files with:
  - Project architecture docs
  - Coding standards
  - Documentation references
- Config file defines:
  - Models
  - Context providers
  - System messages
  - Custom slash commands

**Architecture Pattern:**
```
core (loads config, manages state)
  ↕
extension (VS Code API bridge)
  ↕
gui (React/Redux - user interface)
```

**Strengths:**
- **Rules directory** - persistent project context
- **Modular architecture** - clear separation of concerns
- **Extensible context providers** - can fetch from HTTP, files, etc.
- **Configuration-driven** - no hardcoded behavior

**Gaps for Delobotomize:**
- ❌ No audit capabilities
- ❌ No triage/recovery features
- ❌ Assumes project is functional
- ✅ Good architectural patterns

**Lessons Learned:**
1. **Rules directory pattern** - `.continue/rules/` for persistent context
2. **Three-layer architecture** - separation of concerns
3. **Configuration over code** - make behavior user-configurable
4. **Custom context providers** - extensibility is key

**Application to Delobotomize:**
- Consider `.delobotomize/` directory for audit artifacts
- Use similar modular architecture
- Config file for user preferences
- Context provider pattern for file analysis

---

### 5. Cursor IDE

**KEEP_VERBATIM:**
- **Official Site:** https://www.cursor.com/
- **Key Feature:** `@codebase` - advanced indexing system

**What It Does:**
AI-first code editor with deep codebase understanding via:
- Full project indexing
- AST parsing
- Dependency graph construction
- Symbol cataloging

**Codebase Intelligence:**
> "Cursor recursively scans every file in your project, parsing the abstract syntax tree (AST) to understand the code's structure"

**Process:**
1. **Scan** - Every file in project
2. **Parse AST** - Understand code structure
3. **Identify symbols** - Functions, classes, variables, interfaces
4. **Catalog signatures** - What each symbol is, where declared
5. **Map relationships** - Who calls whom, inheritance, dependencies
6. **Build graph** - Logical flow and dependency structure

**Result:**
> "A graph that represents the logical flow and dependency structure of the application"

**Context Management:**
- **`@` references** - Manual context injection
- **`@Web`** - Internet searches
- **`@Docs`** - Library documentation
- **Deep Graph MCP** - Enhanced architectural context

**Benefits:**
- Suggestions are contextually appropriate, not just syntactically correct
- Understands entire codebase, not just current file
- Can infer impact of changes across files

**Gaps for Delobotomize:**
- ❌ No triage/rescue features
- ❌ Assumes working project
- ❌ No scope creep detection
- ✅ Excellent dependency graph approach

**Lessons Learned:**
1. **AST parsing is essential** - understand code structure
2. **Dependency graph is key** - who depends on what
3. **Symbol cataloging** - track all functions/classes/vars
4. **Context beyond current file** - whole-project awareness

**Application to Delobotomize:**
- Build similar dependency graph during audit
- Parse AST to understand intent
- Track symbol usage (detect orphaned code)
- Use graph to classify files (core vs peripheral)

---

### 6. jscodeshift / Codemods

**KEEP_VERBATIM:**
- **GitHub:** https://github.com/facebook/jscodeshift
- **Purpose:** AST-based code transformation toolkit
- **Key Library:** Recast (preserves code style)

**What It Does:**
Automated large-scale refactoring via AST transformations

**Safety Mechanisms:**
1. **Dry run mode:** `-d` flag (no files written, preview only)
2. **Gitignore integration:** `--gitignore` flag (skip node_modules, dist, etc.)
3. **Test first:** Run on one file before applying to all
4. **Builder API:** Safer AST node creation
5. **Style preservation:** Recast maintains original formatting

**Workflow:**
```bash
# Test on one file first
jscodeshift -t my-transform.js single-file.js

# Dry run on all files
jscodeshift -d -t my-transform.js src/

# Apply transformation
jscodeshift -t my-transform.js --gitignore src/
```

**Rollback Strategy:**
- Version control (Git) handles rollback
- Separate branch for codemod PRs
- Document what codemod does/doesn't do
- Commit codemod + changes separately

**Best Practices:**
- Comprehensive test coverage before applying
- Double-check transformed code
- Use builder API for safety
- Always dry run first

**Gaps for Delobotomize:**
- ❌ Requires writing transformation scripts
- ❌ No automated intent analysis
- ❌ No scope creep detection
- ✅ Excellent safety patterns

**Lessons Learned:**
1. **Always dry run** - never apply without preview
2. **Git is rollback mechanism** - no custom undo needed
3. **Test on one file first** - sanity check
4. **Preserve style** - minimize diff noise
5. **Document transformations** - what does/doesn't change

**Application to Delobotomize:**
- Implement dry-run mode for all operations
- Generate diff previews before applying
- Use git for rollback (archive before changes)
- Document all proposed changes

---

### 7. Semgrep / CodeQL (Static Analysis)

**KEEP_VERBATIM:**
- **Semgrep:** https://github.com/semgrep/semgrep (Open-source SAST)
- **CodeQL:** GitHub Advanced Security (Query-based analysis)

**Comparison:**

| Feature | Semgrep | CodeQL |
|---------|---------|--------|
| **Speed** | ⚡ Median 10s CI scan | Slower (requires build) |
| **Depth** | Surface-level patterns | Deep semantic analysis |
| **Learning Curve** | Easy (YAML rules) | Steep (custom query language) |
| **Setup** | Minutes | Hours (needs full source) |
| **Analysis** | Single-file (default) | Cross-file data flow |
| **Best For** | Quick audits, broad coverage | Deep vulnerability analysis |

**Semgrep Strengths:**
- Lightweight, fast
- Easy to customize (YAML rules)
- Works without full build
- Good for manual audits

**CodeQL Strengths:**
- Deep semantic analysis
- Source-to-sink flow tracking
- Complex vulnerability detection
- Query language for nuanced detection

**Limitations:**
- **Semgrep:** Lacks full code flow understanding
- **CodeQL:** Time-intensive setup, limited language coverage

**For Intent Detection:**
- Both focus on WHAT is wrong, not WHY
- Neither analyzes developer intent
- Good for syntax/security, not scope analysis

**Gaps for Delobotomize:**
- ❌ No intent analysis
- ❌ No scope creep detection
- ❌ No triage/classification
- ✅ Rule-based pattern matching to borrow

**Lessons Learned:**
1. **YAML rules are accessible** - easy to write/customize
2. **Speed matters** - Semgrep's 10s scans are ideal
3. **AST + control flow** - necessary for understanding
4. **Trade-off:** Speed vs depth (pick based on use case)

**Application to Delobotomize:**
- Use Semgrep-style YAML for audit rules
- Fast single-pass analysis like Semgrep
- But add intent analysis layer (unique to us)
- Rule-based classification of files

---

### 8. Project Rescue Services (Consulting)

**Key Finding:** Project rescue is typically **manual consulting**, not automated tooling

**Common Rescue Process:**
1. **Technical audit** - Architecture, code quality, infrastructure, security
2. **Environment setup** - Local dev + CI/CD pipelines
3. **Phased plan** - Quick wins + long-term fixes
4. **Execution** - Refactor unstable modules, upgrade dependencies
5. **Handoff** - Documentation + optional ongoing support

**Techniques:**
- Code refactoring (simplify, deduplicate, improve naming)
- Technical debt resolution
- Legacy system modernization
- AI-accelerated recovery (Cursor AI mentioned)

**Why No Tools Exist:**
> "Project rescue typically requires expert assessment and human intervention rather than automated solutions"

**Gap:** This is why Delobotomize is needed!

**Lessons Learned:**
1. **Humans currently required** - no automated solution
2. **Audit comes first** - understand problem before fixing
3. **Phased approach** - quick wins + strategic fixes
4. **AI acceleration** - tools like Cursor speed up manual work
5. **Documentation critical** - handoff requires clear docs

**Application to Delobotomize:**
- Automate the audit phase (typically manual)
- Generate the "phased plan" automatically
- Provide quick wins list (easy fixes)
- Output documentation for handoff
- **We're automating what's currently manual consulting**

---

## COMPETITIVE LANDSCAPE

### Market Segmentation

```
┌─────────────────────────────────────────────────────────┐
│ PROJECT LIFECYCLE                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ INITIALIZATION     MID-PROJECT       POST-DEVELOPMENT   │
│ (Day 0-7)          (Ongoing)          (Maintenance)     │
│                                                          │
│ SpecKit            ???                Continue.dev      │
│ Langchain-CLI      DELOBOTOMIZE      Aider             │
│                    (FILLS GAP!)       Cursor           │
│                                                          │
│ Static Analysis Throughout:                             │
│ Semgrep, CodeQL                                         │
│                                                          │
│ Refactoring Throughout:                                 │
│ jscodeshift/codemods                                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Competitive Matrix

| Tool | Init | Mid-Project Rescue | Context Mgmt | Audit | Scope Detection | Target User |
|------|------|-------------------|--------------|-------|----------------|-------------|
| **SpecKit** | ✅ | ❌ | ❌ | ❌ | ❌ | New projects |
| **Langchain-CLI** | ✅ | ❌ | ❌ | ❌ | ❌ | LangChain apps |
| **Aider** | ❌ | ❌ | ✅ | ❌ | ❌ | Active development |
| **Continue.dev** | ❌ | ❌ | ✅ | ❌ | ❌ | VS Code users |
| **Cursor** | ❌ | ❌ | ✅✅ | ❌ | ❌ | Professional devs |
| **Semgrep** | ❌ | ❌ | ❌ | ✅ | ❌ | Security teams |
| **CodeQL** | ❌ | ❌ | ❌ | ✅✅ | ❌ | Security teams |
| **jscodeshift** | ❌ | ❌ | ❌ | ❌ | ❌ | Large refactors |
| **Consulting** | ❌ | ✅ | ❌ | ✅ | ✅ | Enterprises |
| **DELOBOTOMIZE** | ❌ | ✅✅✅ | ✅✅ | ✅✅ | ✅✅✅ | **Solo devs in crisis** |

**Key Insight:** Delobotomize is the ONLY tool targeting mid-project AI development disasters.

---

## TECHNICAL APPROACHES TO BORROW

### 1. From SpecKit: Phase Gates

**Pattern:**
```
Phase 1: Specify  →  [VALIDATE] → Phase 2: Clarify  →  [VALIDATE]
     ↓                                      ↓
  Create spec                          Check ambiguity

Phase 3: Plan     →  [VALIDATE] → Phase 4: Implement
     ↓                                      ↓
  Generate tasks                        Execute & test
```

**Application to Delobotomize:**
```
Phase 1: AUDIT    →  [VALIDATE] → Phase 2: TRIAGE  →  [VALIDATE]
     ↓                                      ↓
  Scan all files                       Classify files

Phase 3: PLAN     →  [VALIDATE] → Phase 4: REMEDIATE
     ↓                                      ↓
  Generate fixes                       User applies changes
```

**Validation Gates:**
- Audit complete: All files scanned successfully?
- Triage complete: All files classified?
- Plan complete: Diff edits generated?
- Remediate complete: User approved changes?

---

### 2. From Cursor: Dependency Graph

**Pattern:**
1. Parse AST of every file
2. Extract symbols (functions, classes, variables)
3. Track imports/exports
4. Build graph: A → B (A depends on B)
5. Identify orphans (nothing depends on them)
6. Identify hubs (many things depend on them)

**Application to Delobotomize:**
- **Core files** = High dependency count (many importers)
- **Orphaned files** = Zero dependency count (no importers)
- **Scope creep** = Low dependency + recent + doesn't match goals

---

### 3. From Aider: Repository Map

**Pattern:**
> "Analyze entire codebase to build a compact repository map"

**Application to Delobotomize:**
- Generate repo map during audit
- Store map in `.delobotomize/repo-map.json`
- Use map for context when generating fixes
- Include map in final handoff docs

---

### 4. From jscodeshift: Dry Run + Git Safety

**Pattern:**
```bash
# Step 1: Dry run (preview)
jscodeshift -d -t transform.js src/

# Step 2: Review changes

# Step 3: Apply
jscodeshift -t transform.js src/

# Step 4: Git commit
git add . && git commit -m "Applied transform"

# If bad: Rollback
git reset --hard HEAD~1
```

**Application to Delobotomize:**
```bash
# Step 1: Audit (dry run)
delobotomize audit --dry-run

# Step 2: Review audit reports

# Step 3: Archive (with git commit)
git commit -am "Pre-delobotomize snapshot"
delobotomize archive

# Step 4: Validate
delobotomize validate

# If bad: Rollback
delobotomize restore
```

---

### 5. From Semgrep: YAML Rules

**Pattern:**
```yaml
rules:
  - id: unused-import
    pattern: |
      import $X from '$Y'
    severity: WARNING
    message: "Unused import detected"
```

**Application to Delobotomize:**
```yaml
# .delobotomize/rules/scope-creep.yaml
rules:
  - id: demo-files
    pattern: "demo|example|test(?!ing)|sample"
    severity: HIGH
    classification: scope-creep
    message: "Likely demo/example file"

  - id: old-files
    age_days: 90
    imports_count: 0
    severity: MEDIUM
    classification: stale
    message: "Not modified in 90 days, no imports"
```

---

### 6. From Continue.dev: Rules Directory

**Pattern:**
```
.continue/
  rules/
    architecture.md
    coding-standards.md
    dependencies.md
```

**Application to Delobotomize:**
```
.delobotomize/
  config.json          # User configuration
  audit-results/       # Generated reports
  archive-manifest.json # What was archived
  repo-map.json        # Dependency graph
  rules/               # Custom classification rules
    scope-creep.yaml
    core-files.yaml
```

---

## SPEC FILE FORMAT RECOMMENDATIONS

### Borrow from SpecKit + Langchain-CLI

**Hybrid Approach:**

1. **JSON for configuration** (Langchain-CLI style)
2. **Markdown for specs** (SpecKit style)

### Proposed Structure

```
project/
├── delobotomize.config.json     # Main config
├── .delobotomize/
│   ├── specs/
│   │   ├── OVERVIEW.md          # Project goals (SpecKit style)
│   │   ├── ARCHITECTURE.md      # System design
│   │   └── FEATURES.md          # Feature specs
│   ├── audit-results/
│   │   ├── summary.md
│   │   ├── detailed-analysis.md
│   │   └── dependency-graph.json
│   └── rules/
│       ├── scope-creep.yaml
│       └── core-files.yaml
```

### Config File Format (KEEP_VERBATIM)

```json
{
  "version": "1.0.0",
  "project": {
    "name": "my-project",
    "goals": [
      "User authentication system",
      "Data visualization dashboard",
      "RESTful API backend"
    ]
  },
  "scan": {
    "include": ["src", "scripts"],
    "exclude": ["node_modules", "dist", ".git"],
    "extensions": [".js", ".ts", ".jsx", ".tsx"]
  },
  "classification": {
    "rules": [".delobotomize/rules/*.yaml"],
    "stale_threshold_days": 90
  },
  "models": {
    "audit": {
      "provider": "anthropic",
      "model": "claude-haiku-3-5",
      "description": "Lightweight model for syntax/import checking"
    },
    "analysis": {
      "provider": "anthropic",
      "model": "claude-sonnet-4-5",
      "description": "Smart model for intent analysis"
    }
  },
  "concurrency": {
    "profile": "standard",
    "max_agents": 50
  }
}
```

### Spec File Format (KEEP_VERBATIM)

```markdown
# Project Overview

## Purpose
[One-paragraph description of what this project does]

## Goals
- Goal 1: [Specific, measurable goal]
- Goal 2: [Specific, measurable goal]
- Goal 3: [Specific, measurable goal]

## In Scope
- Feature A
- Feature B
- Feature C

## Out of Scope
- Feature X (reason)
- Feature Y (reason)

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Architecture
[High-level system design]

## Key Components
### Component 1
- **Purpose:** What it does
- **Dependencies:** What it needs
- **Status:** Working / Incomplete / Broken

### Component 2
...
```

---

## CONTEXT PRESERVATION STRATEGIES

### What Works (From Research)

1. **Repository Maps** (Aider)
   - Scan entire codebase
   - Build compact summary
   - Include in every LLM call
   - ✅ **Use this**

2. **Rules Directories** (Continue.dev)
   - `.project/rules/` with markdown docs
   - Architecture, standards, dependencies
   - Persistent across sessions
   - ✅ **Use this**

3. **Dependency Graphs** (Cursor)
   - Parse AST, track imports
   - Build graph of relationships
   - Identify core vs peripheral code
   - ✅ **Use this**

4. **Auto-commits** (Aider)
   - Commit after every change
   - Descriptive commit messages
   - Easy rollback via git
   - ✅ **Use this**

5. **Session Persistence** (AiderDesk)
   - Save chat history
   - Save context files
   - Resume exactly where left off
   - ✅ **Use this**

### What Doesn't Work

1. **Overloading Context** (Aider warning)
   - Adding too many files confuses LLM
   - Should add only relevant files
   - ❌ **Avoid this**

2. **IDE-Specific Formats** (Memory Bank)
   - `.kilocode/` only works in Kilo
   - `.cursor/` only works in Cursor
   - ❌ **Avoid this** - use generic format

3. **One-Time Validation** (SpecKit improvement)
   - Validation should be continuous
   - Not just a one-time gate
   - ❌ **Avoid this**

### Delobotomize Context Strategy

**Three-Tier System:**

1. **Tier 1: Project Context** (Always loaded)
   ```
   .delobotomize/specs/OVERVIEW.md
   .delobotomize/repo-map.json
   delobotomize.config.json
   ```

2. **Tier 2: Audit Results** (Loaded during triage)
   ```
   .delobotomize/audit-results/summary.md
   .delobotomize/audit-results/dependency-graph.json
   ```

3. **Tier 3: File-Specific** (Loaded per file during fixes)
   ```
   [current file content]
   [dependencies of current file]
   [files that depend on current file]
   ```

**Size Management:**
- Tier 1: < 10KB (always fits in context)
- Tier 2: < 100KB (summary, not full details)
- Tier 3: Dynamic (only what's needed)

---

## PARALLEL EXECUTION PATTERNS

### Lessons from Multi-Agent Frameworks

**From Research:**

1. **AutoGen Pattern** - Asynchronous event loop
   - Good for: Dynamic, event-driven tasks
   - Bad for: Batch processing

2. **LangGraph Pattern** - Graph-based execution
   - Good for: Complex workflows with dependencies
   - Bad for: Simple parallel tasks

3. **CrewAI Pattern** - Role-based orchestration
   - Good for: Team coordination
   - Bad for: Independent file audits

**Best for Delobotomize:** None of the above!

### Recommended Pattern: Simple Batched Async

**Why:** We have independent tasks (audit 500 files) with no inter-dependencies.

**Pattern:**
```javascript
async function auditFiles(files, concurrency = 50) {
  const results = [];

  // Split into batches
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(file => auditFile(file))
    );

    results.push(...batchResults);

    // Progress update
    console.log(`Audited ${results.length}/${files.length} files`);
  }

  return results;
}
```

**Advantages:**
- Simple (no framework needed)
- Respects API rate limits (batch size = rate limit)
- Progress tracking (after each batch)
- Error isolation (one failure doesn't stop all)

**Rate Limit Handling:**
```javascript
async function auditFile(file, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await api.analyze(file);
    } catch (error) {
      if (error.status === 429) { // Rate limit
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  throw new Error(`Failed after ${retries} retries`);
}
```

---

## UNIQUE VALUE PROPOSITION

### What Makes Delobotomize Different

| Feature | Existing Tools | Delobotomize |
|---------|---------------|--------------|
| **Target Stage** | Initialization or maintenance | **Mid-project disaster recovery** |
| **Intent Analysis** | "What is wrong?" | **"WHY does broken code exist?"** |
| **Action** | Delete unused code | **CREATE missing code or ARCHIVE scope creep** |
| **Scope Detection** | Not addressed | **Detect features outside project goals** |
| **Context** | Assume working project | **Restore lost context** |
| **Triage** | Manual consulting | **Automated classification** |
| **Audience** | Teams or enterprises | **Solo developers** |

### The "Blind Gardener" Problem

**Existing tools fail here:**

```
Developer: "Fix TypeScript errors"

Tool sees: function validateToken() called but doesn't exist
Tool does: Deletes the function call ❌

Delobotomize sees: function validateToken() called but doesn't exist
Delobotomize asks: WHY was this call added?
Delobotomize does:
  - Check project specs: Is auth a goal? ✅
  - Check git history: When was this added? Recently
  - Conclusion: Incomplete implementation
  - Action: CREATE validateToken() function ✅
```

### No Tool Does This

Research confirmed: **No existing tool performs intent analysis to decide CREATE vs DELETE vs ARCHIVE.**

---

## IMPLEMENTATION ROADMAP

### Phase 1: Core CLI (v0.1.0) - 2 weeks

**Goals:**
- Basic CLI structure
- Config file support
- File scanning
- Simple classification

**Deliverables:**
- `delobotomize init` - Create config file
- `delobotomize audit` - Scan files, generate report
- Basic classification (core/suspicious/orphaned)
- Markdown reports

**Tech Stack:**
- Node.js 20+
- Commander.js (CLI)
- Chalk (colors)
- Ora (spinners)
- pnpm (package manager)

---

### Phase 2: Intelligent Analysis (v0.2.0) - 3 weeks

**Goals:**
- LLM integration
- Intent analysis
- Dependency graph
- Spec generation

**Deliverables:**
- API integration (Claude, GPT, Gemini)
- File-by-file intent analysis
- AST parsing for imports/exports
- Dependency graph generation
- Auto-generate missing specs

**New Features:**
- Two-tier model usage (cheap for syntax, expensive for intent)
- Parallel execution (50 concurrent API calls)
- Rate limit handling
- Progress tracking

---

### Phase 3: Safe Archival (v0.3.0) - 2 weeks

**Goals:**
- Archive scope-creep files
- Git integration
- Rollback capability
- Validation

**Deliverables:**
- `delobotomize archive` - Move files safely
- Git auto-commit before/after
- Archive manifest (what/why/when)
- `delobotomize restore` - Undo archival
- `delobotomize validate` - Post-archive checks

---

### Phase 4: Remediation Planning (v0.4.0) - 3 weeks

**Goals:**
- Generate diff edits
- Task list generation
- Context bootstrap
- User handoff

**Deliverables:**
- Diff edit generation (CREATE vs DELETE decisions)
- Task list (what to build next)
- Context bootstrap prompt
- Spec file updates
- `.delobotomize/` directory structure
- Final handoff documentation

---

### Phase 5: Polish & Testing (v1.0.0) - 2 weeks

**Goals:**
- User testing
- Documentation
- Error handling
- Performance tuning

**Deliverables:**
- Comprehensive README
- Usage examples
- Troubleshooting guide
- Error recovery
- Cost estimation
- Performance benchmarks

**Total Timeline:** ~12 weeks to v1.0.0

---

## APPENDIX: VERBATIM DATA

### Tool URLs (KEEP_VERBATIM)

- **Langchain-CLI:** https://github.com/langchain-ai/cli
- **SpecKit:** https://github.com/github/spec-kit
- **Aider:** https://github.com/Aider-AI/aider
- **Continue.dev:** https://github.com/continuedev/continue
- **Cursor:** https://www.cursor.com/
- **jscodeshift:** https://github.com/facebook/jscodeshift
- **Semgrep:** https://github.com/semgrep/semgrep

### Key Quotes (KEEP_VERBATIM)

> "Specifications must be precise, complete, and unambiguous enough to generate working systems" - SpecKit

> "Aider will automatically give the LLM additional context about the rest of your git repo by analyzing your entire codebase" - Aider Docs

> "Cursor recursively scans every file in your project, parsing the abstract syntax tree (AST)" - Cursor Analysis

> "Semgrep's median CI scan time is 10 seconds" - Semgrep Performance

> "Project rescue typically requires expert assessment and human intervention rather than automated solutions" - Project Rescue Services

### Configuration Examples (KEEP_VERBATIM)

**Langchain langgraph.json:**
```json
{
  "dependencies": ["langchain_openai"],
  "graphs": {
    "agent": "./package/file.py:agent"
  },
  "env": ".env"
}
```

**SpecKit Commands:**
- `/speckit.specify`
- `/speckit.clarify`
- `/speckit.plan`
- `/speckit.tasks`
- `/speckit.implement`

**jscodeshift Dry Run:**
```bash
jscodeshift -d -t transform.js src/
```

---

## CONCLUSIONS

1. **Gap Validated:** No tool targets mid-project AI triage
2. **Patterns Identified:** Phase gates, dependency graphs, repository maps
3. **Tech Chosen:** Node.js + Commander + LLM APIs
4. **Timeline:** 12 weeks to v1.0.0
5. **Unique Value:** Intent analysis (CREATE vs DELETE)
6. **Next Steps:** Build Phase 1 (Core CLI)

---

*Research completed via web search of 9 tools/services*
*Data preservation: All KEEP_VERBATIM items maintained*
*Consolidation: 3-tier progressive summarization with data retention*
