# Delobotomize - Conversation Archive
*Generated: 2025-10-18*
*Purpose: Preserve all ideas, decisions, and context from project initialization discussions*

---

## 📋 TABLE OF CONTENTS

1. [Project Mission & Core Problem](#project-mission--core-problem)
2. [Ideas Implemented](#ideas-implemented)
3. [Ideas Deferred for Later](#ideas-deferred-for-later)
4. [Ideas Rejected/Out of Scope](#ideas-rejectedout-of-scope)
5. [Other Valuable Ideas (Unrelated)](#other-valuable-ideas-unrelated)
6. [Technical Decisions](#technical-decisions)
7. [Architecture Clarifications](#architecture-clarifications)
8. [Research Directives](#research-directives)

---

## PROJECT MISSION & CORE PROBLEM

### The "Blind Gardener" Syndrome
**User's Original Problem (from DataKiln project):**
- Mid-project, AI assistant loses all context of project state
- User: "Fix this TypeScript error"
- AI: Sees unused import → **DELETES IT** (destructive)
- AI: Sees function call to non-existent function → **DELETES THE CALL** (wrong!)
- AI: Sees missing dependency → **REMOVES THE IMPORT** (misses the point!)

**Root Cause:**
The function/import/dependency was there **intentionally** - it's an **incomplete implementation** that needs to be **CREATED**, not deleted. But the AI has no context to know this.

**User Experience:**
- "Testing Hell" - fix one bug, create three others
- Each iteration digs deeper hole due to context rot
- AI reports "everything's done, ready for deployment" when nothing actually works
- User spinning in place, making no forward progress

### Project Mission Statement
**Delobotomize = Emergency triage and context restoration for mid-project disasters where AI-assisted development has gone off the rails**

**What it does:**
1. Deep audit of entire codebase (intent analysis, not just syntax checking)
2. Intelligent classification (scope creep vs incomplete implementation vs actual bugs)
3. Safe archival of out-of-scope files
4. Spec generation/repair if missing
5. Generate remediation plan (CREATE missing functions, don't delete calls)
6. Bootstrap project back into working state with fresh context

**What it is NOT:**
- Not a project starter (like SpecKit/Langchain-CLI)
- Not a general-purpose linter
- Not an auto-fix tool (it generates plans, user reviews)

---

## IDEAS IMPLEMENTED

### ✅ Core Functionality

1. **Multi-Dimensional File Audit**
   - Syntax errors (TypeScript/linting)
   - Missing imports (flag, don't delete)
   - Called functions that don't exist (flag, don't delete call)
   - Unused dependencies (investigate, don't auto-remove)
   - Scope creep indicators
   - **Intent analysis** - WHY does this broken code exist?

2. **Intelligent Classification Engine**
   - Core (essential, working)
   - Incomplete (partially built features → CREATE missing parts)
   - Scope Creep (out-of-scope → archive)
   - Broken (actual bugs → fix)
   - Orphaned (nothing uses it → potential deletion)

3. **Safe Archival System**
   - Archive directory for removed files (not deleted permanently)
   - Maintains audit trail (why each file was archived)
   - Full rollback capability
   - Named something like `/archived-bloat/` or `/delobotomized/` (TBD)

4. **Spec Generation/Repair**
   - If no spec files exist → generate them from codebase analysis
   - Borrow formats from SpecKit/Langchain-CLI
   - Bootstrap project into spec-driven format

5. **Diff Edit System**
   - Generate proposed changes as diff edits
   - User reviews before applying
   - Can accept globally or selectively
   - Prevents automated destruction of user code

6. **Two-Tier LLM Strategy**
   - **Lightweight models** for syntax checking, file scanning (cheap/fast)
   - **Smart models** for intent analysis, consolidation, planning (expensive/accurate)
   - User configurable model selection

7. **Model-Agnostic API Integration**
   - Auto-detect API keys from environment:
     - `ANTHROPIC_API_KEY` (Claude)
     - `OPENAI_API_KEY` (GPT)
     - `GEMINI_API_KEY` (Google)
     - `PERPLEXITY_API_KEY`
     - `OPENROUTER_API_KEY`
   - Suggest best model based on available keys
   - User override in config

8. **Parallel Agent Execution (Within Phases)**
   - NOT: Different agents for audit vs archive vs validate (sequential)
   - YES: 50 agents auditing 50 files simultaneously
   - Sequential gates between phases (all audits complete → then classify)

### ✅ User Experience

1. **CLI-First Interface**
   - Commands: `audit`, `archive`, `validate`, `remediate`
   - Interactive prompts for safety
   - `--dry-run` mode
   - `--verbose` for detailed output

2. **Progressive Review Process**
   - Generate audit reports → user reviews
   - Propose archival plan → user approves
   - Generate diff edits → user selects which to apply
   - Never auto-modify without confirmation

3. **Context Bootstrap on Exit**
   - After triage, provide user with:
     - Updated spec files
     - Task list for next steps
     - Prompt template to feed their AI assistant
     - "Hot context" state to resume work

### ✅ Technical Architecture

1. **Three-Phase Sequential Operation**
   ```
   PHASE 1: AUDIT (parallel file analysis)
      ↓
   PHASE 2: TRIAGE (intelligent classification)
      ↓
   PHASE 3: REMEDIATION (generate plans, user reviews)
   ```

2. **Structured Output Format**
   - JSON reports from each agent
   - Consolidated into master audit matrix
   - Human-readable markdown summaries

3. **Package Manager: pnpm** (not npm)

4. **Target Hardware:**
   - Low-end: MacBook M1 with 8-16GB RAM
   - High-end: MacBook M3 Ultra with 36GB RAM
   - Optimize agent count for these specs

### ✅ Borrowing from Existing Tools

1. **From SpecKit:**
   - Spec file formats
   - Project structure templates

2. **From Langchain-CLI:**
   - Validation patterns
   - Pre-flight check concepts

3. **Unique to Delobotomize:**
   - Mid-project rescue (not initialization)
   - Intent analysis (create vs delete decisions)
   - Deep audit matrix with rationale
   - Spec generation mid-project

---

## IDEAS DEFERRED FOR LATER

### 🔄 Potential Future Features

1. **Web UI for Reports (ShadCN)**
   - User mentioned ShadCN for possible web interface
   - Primary interface is CLI
   - Web UI would be for visualizing audit reports only
   - **Status:** Nice-to-have, Phase 2 feature

2. **Pre-Flight Checker for New Projects**
   - User idea: "Run this AFTER spec creation but BEFORE coding starts"
   - Validates project setup before first line of code
   - Checks for ambiguity, missing specs, holes in design
   - **Status:** Good idea, but out of scope for v1.0 (rescue tool, not starter)

3. **Continuous Context Preservation**
   - Original idea from transcript: Memory Bank integration
   - User clarified: "Skip it" for now
   - Possible future: `.delobotomize/context/` directory
   - **Status:** Needs more research on generic approach

4. **Multi-IDE Support**
   - Transcript mentioned `.kilocode/`, `.cursor/` directories
   - User said: "Skip it, seems like hallucination"
   - Possible future: Support multiple IDE context formats
   - **Status:** Not needed for v1.0

5. **Automated Rollback on Detection**
   - If audit detects scope creep mid-session
   - Auto-suggest rollback to last good state
   - **Status:** Advanced feature, needs safe implementation

6. **Project Health Scoring**
   - Numerical score (0-100) for project health
   - Metrics: spec coverage, broken code ratio, scope creep percentage
   - **Status:** Research needed on metrics

---

## IDEAS REJECTED/OUT OF SCOPE

### ❌ Explicitly Excluded

1. **Memory Bank Integration (Kilo Code specific)**
   - **Why rejected:** Too framework-specific, not generic
   - User: "I don't know what the fuck that's doing there, skip it"
   - Alternative: Generate context bootstrap files instead

2. **Auto-Fix Without Review**
   - **Why rejected:** Too dangerous, defeats the purpose
   - Core principle: User must review all changes
   - Tool generates plans, user executes

3. **DataKiln-Specific Features**
   - YouTube transcript extraction
   - Gemini AI integration
   - Browser automation (Playwright)
   - Express server / Vite frontend
   - **Why rejected:** Those are application features, not triage features

4. **npm as Package Manager**
   - **Why rejected:** User specified pnpm (npm being deprecated)

5. **Hardcoded Model Selection**
   - **Why rejected:** User wants model-agnostic, configurable

6. **Deleting Files Without Archival**
   - **Why rejected:** Too risky, always archive first

7. **Sequential-Only Execution**
   - Original misunderstanding: Different agents for different phases
   - **Why rejected:** Phases are sequential, but work WITHIN phases parallelizes

---

## OTHER VALUABLE IDEAS (UNRELATED)

### 💡 Interesting Concepts from Discussion

1. **"Hot Context" Theory**
   - When AI is fresh/new, context is "cold" - no project knowledge
   - After proper priming, context is "hot" - AI knows what's going on
   - Problem: Users start with cold context, AI makes bad decisions
   - **Applicability:** Any AI-assisted development, worth researching

2. **Intent Analysis as Core Capability**
   - Most linters/auditors check WHAT is wrong
   - Few check WHY it's wrong
   - Delobotomize asks: "Why did the developer write this broken code?"
   - **Applicability:** Could be standalone research project

3. **Two-Tier LLM Strategy**
   - Cheap models for grunt work (syntax, file scanning)
   - Expensive models for intelligence (planning, analysis)
   - **Applicability:** Any agentic system with budget constraints

4. **Consolidation with Data Preservation**
   - When consolidating reports, mark certain data as "KEEP VERBATIM"
   - Prevents important details from being summarized away
   - **Applicability:** Any multi-agent system with reporting

5. **Diff Edit as Communication Format**
   - Instead of applying changes directly
   - Generate diff edits for user/IDE to apply
   - **Applicability:** Any code modification tool

6. **Progressive Consolidation**
   - Don't consolidate 50 reports at once
   - Consolidate 3 at a time → then consolidate those → repeat
   - Prevents token limit issues and data loss
   - **Applicability:** Any large-scale data aggregation

---

## TECHNICAL DECISIONS

### ✅ Confirmed Decisions

1. **Package Manager:** pnpm (not npm)
   - Reason: npm being deprecated (per user)

2. **Archive Directory Name:** TBD
   - Options discussed:
     - `/archived-bloat/`
     - `/scope-creep-archive/`
     - `/delobotomized/`
     - `/archive/` (simple)
   - User preference: "Name it something that indicates the shit is trash"
   - **Decision needed:** User to pick final name

3. **Project Goals Detection:**
   - Auto-infer from existing specs (if present)
   - Present inference to user
   - User confirms/modifies
   - Reassess with AI based on user input
   - Repeat until confirmed

4. **Diff Edit Application:**
   - Research needed: Can we apply diffs programmatically from CLI?
   - If yes: Build into tool
   - If no: Require user to run in IDE (Claude Code, Cursor, etc.)
   - Generate diff edit files user can apply in their editor

5. **Model Assignment Strategy:**
   - **Agent tasks** (file scanning, syntax checking): Lightweight models
   - **Intelligence tasks** (classification, planning): Smart models
   - User configurable per task type

6. **Rollback Mechanism:**
   - All archived files maintain full audit trail
   - Manifest of what was moved and why
   - Simple restore script to undo archival
   - All diff edits tracked before application

### ⚠️ Decisions Pending Research

1. **Number of Concurrent Agents:**
   - Hardware specs to test:
     - MacBook M1 with 8-16GB RAM (low-end)
     - MacBook M3 Pro Max with 36GB RAM (high-end, user's machine)
   - Research needed: What's Claude Code's limit?
   - Extrapolate to PC equivalents (8-core vs Ryzen gaming rig)

2. **Spec File Formats:**
   - Borrow from SpecKit and Langchain-CLI
   - Research needed: What are their exact formats?

3. **Context Preservation Format:**
   - User said skip Memory Bank
   - But we still need to output something for context bootstrap
   - Research needed: What format works across IDEs?

---

## ARCHITECTURE CLARIFICATIONS

### Async/Parallel Execution (CORRECTED)

**WRONG Understanding:**
```
Agent 1: Audit files
Agent 2: Archive files  } Running in parallel
Agent 3: Validate      }
```

**CORRECT Understanding:**
```
PHASE 1: AUDIT
  ├─ Agent 1: Audit file-001.js  ┐
  ├─ Agent 2: Audit file-002.js  │
  ├─ Agent 3: Audit file-003.js  ├─ All in parallel
  ├─ ...                         │
  └─ Agent 50: Audit file-050.js ┘

  [WAIT FOR ALL TO COMPLETE]

PHASE 2: CLASSIFY
  ├─ Smart Agent: Analyze audit results
  └─ Generate triage matrix

  [WAIT FOR COMPLETION]

PHASE 3: REMEDIATE
  ├─ Agent 1: Generate fixes for module A  ┐
  ├─ Agent 2: Generate fixes for module B  ├─ Parallel (non-conflicting)
  └─ Agent 3: Generate fixes for module C  ┘

  [WAIT FOR ALL]

PHASE 4: USER REVIEW
  └─ Present plans, user approves/modifies
```

### Audit Process Flow

```
1. File Scanner
   └─ Generate manifest of all files

2. Dispatch to Audit Workers (parallel)
   ├─ Each worker receives: file path + audit prompt
   ├─ Worker analyzes:
   │   ├─ Syntax errors
   │   ├─ Missing imports
   │   ├─ Undefined functions being called
   │   ├─ Unused dependencies
   │   └─ Scope creep indicators
   ├─ Worker performs INTENT ANALYSIS:
   │   └─ "WHY does this broken code exist?"
   └─ Returns structured JSON report

3. Consolidation (sequential, 3 at a time)
   ├─ Consolidate reports 1-3 → summary-1
   ├─ Consolidate reports 4-6 → summary-2
   ├─ ...
   ├─ Consolidate summaries 1-3 → meta-summary-1
   └─ Final consolidation → master audit matrix

4. Classification (smart model)
   ├─ Load project specs (if exist)
   ├─ Compare code against goals
   └─ Classify each file/function:
       ├─ CORE (essential, working)
       ├─ INCOMPLETE (create missing parts)
       ├─ SCOPE CREEP (archive)
       ├─ BROKEN (fix)
       └─ ORPHANED (investigate)

5. Generate Remediation Plan
   ├─ Archive plan (which files to move)
   ├─ Diff edits (proposed fixes)
   ├─ Task list (create missing functions)
   └─ Context bootstrap (prompt for next session)
```

### Data Preservation During Consolidation

**Problem:** When consolidating 50 reports into 1, important details get lost

**Solution:** Two-tier data marking
1. **Agent marks data as:**
   - `KEEP_VERBATIM`: Critical details that must survive consolidation
   - `SUMMARIZABLE`: Can be condensed

2. **Consolidator respects flags:**
   - All `KEEP_VERBATIM` items pass through unchanged
   - `SUMMARIZABLE` items get condensed

**Example:**
```json
{
  "file": "src/auth.js",
  "findings": [
    {
      "type": "missing_function",
      "detail": "validateToken() is called on line 45 but doesn't exist",
      "preserve": "KEEP_VERBATIM",
      "reason": "This is WHY the code is broken"
    },
    {
      "type": "import_count",
      "detail": "File has 12 imports",
      "preserve": "SUMMARIZABLE"
    }
  ]
}
```

---

## RESEARCH DIRECTIVES

### Phase 1: Agent Capacity Research

**Objective:** Determine how many concurrent agents Claude Code can handle

**Target Hardware:**
1. **User's Machine:** MacBook M3 Pro Max with 36GB RAM
2. **Low-End Baseline:** MacBook M1 with 8-16GB RAM
3. **PC Equivalents:**
   - Low: Standard 8-core PC
   - High: Ryzen multi-core gaming rig

**Questions to Answer:**
- What do other Claude Code users report for concurrent agent limits?
- Is limit based on RAM, CPU, or API rate limits?
- What's the sweet spot (max agents before performance degrades)?
- How does this scale with hardware specs?

**Deliverable:**
- Recommended agent count for low/med/high-end machines
- Fallback: If unknown, test empirically during development

---

### Phase 2: Similar Tool Research (18 Agents)

#### **Tier 1: Tool Discovery (8 agents)**

1. **Langchain-CLI Research**
   - Architecture
   - Spec file formats
   - Audit/validation features
   - What it does well, what it lacks

2. **SpecKit Research**
   - Spec formats
   - Validation approach
   - Project templates
   - Integration patterns

3. **Aider Research**
   - How does it maintain context across sessions?
   - What strategies prevent context collapse?
   - Multi-file editing approach

4. **Continue.dev Research**
   - Context management strategies
   - How does it handle project state?
   - Diff generation methods

5. **Cursor Research**
   - Project understanding mechanisms
   - Context preservation
   - Multi-file refactoring

6. **Codemod/AST Tools Research**
   - Large-scale refactoring patterns
   - Safe transformation strategies
   - Rollback mechanisms

7. **Sourcegraph/Code Intelligence Research**
   - Code analysis techniques
   - Dependency graphing
   - Intent inference methods

8. **Semgrep/CodeQL Research**
   - Static analysis patterns
   - Rule definition formats
   - Custom rule creation

#### **Tier 2: Deep Dive (6 agents)**

9. **Spec Format Analysis**
   - Extract exact formats from Langchain-CLI and SpecKit
   - Commonalities and differences
   - Recommendation for Delobotomize

10. **Intent Analysis Techniques**
    - How do tools determine "why" code exists?
    - ML-based approaches
    - Heuristic methods
    - Best practices

11. **LLM-Based Code Audit Best Practices**
    - Prompt engineering for code analysis
    - Structured output schemas
    - Multi-pass analysis techniques

12. **Parallel Agent Orchestration**
    - Frameworks: CrewAI, AutoGen, LangGraph
    - Coordination patterns
    - Error handling in parallel execution

13. **Context Preservation Strategies**
    - Across AI coding sessions
    - Between different tools
    - Generic vs IDE-specific approaches

14. **Project Health Metrics**
    - Code quality scoring systems
    - Triage priority algorithms
    - Quantifying "project health"

#### **Tier 3: Implementation (4 agents)**

15. **Multi-Model API Orchestration**
    - Supporting Claude + GPT + Gemini + Perplexity
    - Fallback strategies
    - Cost optimization

16. **Structured LLM Output**
    - JSON schema enforcement
    - Validation patterns
    - Error recovery

17. **File Archival Safety**
    - Rollback mechanisms
    - Manifest formats
    - Integrity verification

18. **CLI UX for Triage Tools**
    - Best practices for interactive CLIs
    - Progress reporting
    - Error communication

---

### Consolidation Strategy

**Phase 1: Initial Consolidation (3 reports at a time)**
```
Reports 1-3   → Summary A
Reports 4-6   → Summary B
Reports 7-9   → Summary C
...
Reports 16-18 → Summary F
```

**Phase 2: Meta-Consolidation**
```
Summaries A-C → Meta-Summary 1
Summaries D-F → Meta-Summary 2
```

**Phase 3: Final Consolidation**
```
Meta-Summaries 1-2 → Executive Report
```

**Data Preservation Rules:**
- Items marked `KEEP_VERBATIM` pass through all levels unchanged
- Statistical data can be aggregated
- Tool names, version numbers, URLs must survive
- Key insights flagged by agents must survive

---

### Deliverable: Executive Report

**Structure:**
1. **Competitive Landscape**
   - What similar tools exist
   - What they do/don't do
   - Market gaps

2. **Technical Approaches**
   - How other tools solve similar problems
   - Proven patterns
   - Anti-patterns to avoid

3. **Spec Format Recommendations**
   - Borrow from Langchain-CLI/SpecKit
   - Adaptations for Delobotomize
   - Justification

4. **Context Preservation Strategies**
   - What actually works
   - Framework-agnostic approaches
   - Implementation recommendations

5. **Parallel Execution Patterns**
   - How to orchestrate N agents efficiently
   - Error handling
   - Progress tracking

6. **Unique Value Proposition**
   - What makes Delobotomize different
   - Why it's needed
   - Target user

7. **Implementation Roadmap**
   - Revised project structure
   - Technology choices
   - Development phases

---

## KEY INSIGHTS FROM USER

### User's Mental Model

1. **"Context Hot Theory"**
   - Cold context = AI doesn't know project state
   - Hot context = AI properly primed with project knowledge
   - Problem: Users start sessions with cold context
   - Solution: Delobotomize primes the context before user resumes work

2. **Create vs Delete Philosophy**
   - When encountering broken code, ask: "Why does this exist?"
   - If it's incomplete: CREATE the missing parts
   - If it's scope creep: ARCHIVE it
   - If it's a hallucination: DELETE it
   - **Default should be CREATE, not DELETE**

3. **Programmatic vs LLM Tasks**
   - Syntax checking: Programmatic (fast, cheap)
   - File scanning: Programmatic
   - Intent analysis: LLM (requires intelligence)
   - Classification: LLM (requires understanding)
   - Consolidation: LLM (requires synthesis)

4. **User Control is Paramount**
   - Never auto-modify without review
   - Generate plans, user approves
   - Diff edits, user selects
   - If automation fails, it fails safe (no data loss)

5. **Archival is Safety Net**
   - Don't delete anything permanently
   - Archive provides rollback capability
   - Audit trail explains WHY files were moved
   - User can investigate later if needed

### User's Pain Points (from DataKiln)

1. **Testing Hell**
   - Fix one bug → create three others
   - AI reports "done" when nothing works
   - No forward progress, just spinning

2. **Context Collapse**
   - Mid-session, AI loses track of project
   - Starts making destructive changes
   - No understanding of what's working vs broken

3. **Blind Deletion**
   - AI sees unused import → deletes it
   - AI sees undefined function → deletes the call
   - Misses that those were INCOMPLETE, not wrong

4. **Scope Creep Accumulation**
   - AI adds features beyond project goals
   - Files accumulate that don't belong
   - Project becomes bloated and unfocused

5. **No Recovery Path**
   - Once project derails, no clear way back
   - Existing tools don't help mid-project rescue
   - User left manually untangling the mess

---

## NEXT STEPS

1. ✅ Archive this conversation (DONE - this file)
2. ⏳ Research Claude Code agent capacity limits
3. ⏳ Deploy 18 research agents
4. ⏳ Consolidate research reports
5. ⏳ Generate executive report
6. ⏳ Revise project structure based on findings
7. ⏳ Get user approval on revised plan
8. ⏳ Begin implementation

---

## APPENDIX: User Quotes

> "The model needs to have context to be able to do the kind of code analysis and error debugging so that it's not just going in and debugging like a goddamn psychopath."

> "If there's a function there and program made it, there's probably a fucking reason for that."

> "Once the context is primed and it's ready and everything works right, but essentially, since they're working with non-hot context... [the AI] doesn't necessarily even know to look at the PRD files, and you know, prime its context and get back to its initial state before it starts cutting shit up."

> "The user would say, 'Okay, this doesn't work.' The model would go and say, 'fixes one thing.' Then it comes back and it's like, 'okay, everything's done, the project's ready for deployment.' And it's not ready for deployment, the fucking nothing works still."

> "This is an approach to resolve that critical issue."

---

*End of Conversation Archive*
*All ideas captured, categorized, and preserved for future reference*
