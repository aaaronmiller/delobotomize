# 🧠 Delobotomize

> **Emergency triage system for AI-assisted development disasters. Stop context collapse before it destroys your codebase.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org/)

---

## 🚨 The Problem: Context Collapse Syndrome

You're debugging with AI assistance. What starts as a simple bug fix spirals into chaos:

- AI "fixes" working code, breaking 3 new features
- Same wrong solution suggested repeatedly
- Code quality degrades with each iteration
- You lose track of what's broken vs. what works
- The AI becomes a **"blind gardener"** - pruning healthy code while the real bugs survive

**This is Context Collapse Syndrome (CCS)** - when AI loses project coherence mid-session.

## ✨ The Solution: Persistent Memory + Triage

**Delobotomize** provides:

1. 🧠 **Persistent Memory Bank** - Context that survives across AI sessions
2. 🔍 **Automated Symptom Detection** - Identify collapse patterns before disaster
3. 🛠️ **5-Phase Triage System** - Emergency recovery workflow
4. 📊 **Narrative Reporting** - Understand what happened and why
5. 🔌 **Model-Agnostic** - Works with OpenAI, Anthropic, Gemini, Cohere, OpenRouter

---

## 🎯 Quick Start

### Installation

```bash
# Install globally
npm install -g delobotomize

# Or use with npx
npx delobotomize --help
```

### Your First Triage

```bash
# 1. Navigate to your troubled project
cd /path/to/your/project

# 2. Run full triage with narrative report
delobotomize triage .

# Output:
# 🎭 Beginning triage with narrative generation...
# 🧠 Initializing context manager...
#    ✓ Memory system initialized
#
# 🔍 Phase 1: Identifying the Problem
#    ✓ Identified: Context collapse detected with 15 symptoms
#    ✓ Symptoms: 15 detected
#
# 🩺 Phase 2: Performing Diagnosis
#    ℹ Found 3 related patterns in memory
#    ✓ Syndrome: context_collapse
#    ✓ Severity: HIGH
#    ✓ Confidence: 85%
#
# 🛠️  Phase 3: Executing Remediation
#    ✓ Phase executed: phase_1_context_reconstruction
#    ✓ Steps completed: 8
#
# ✨ Phase 4: Assessing Resolution
#    ✓ Health improved: 42% → 78% (+36%)
#
# 💾 Memory saved to .delobotomize/memory/snapshot.json
# 📁 Triage report saved to: .delobotomize/triage-report-2025-10-20.md

# 3. Review the narrative report
cat .delobotomize/triage-report-*.md
```

---

## 📚 User Experience Example

### Scenario: Breaking Production After "Simple" Bug Fix

**Initial State:**
```
You: "Fix the undefined variable error in auth.ts"

AI: [Makes 47 changes across 12 files]
     [Breaks authentication completely]
     [Introduces TypeScript errors]
     [Removes working error handling]

You: "Why did you change all those files?!"

AI: "I was fixing potential issues..."
```

### With Delobotomize:

```bash
# Step 1: Run triage BEFORE letting AI make changes
delobotomize scan .

# Output shows:
# 🎯 Status: AT_RISK
# Confidence: 78%
# Summary: Detected scattered undefined variables, fragile auth flow
#
# 📊 Context Health Scores:
#    Overall: 62%
#    Architecture: 55%  ⚠️
#    Consistency: 72%
#    Completeness: 59%  ⚠️
#
# 🚨 Critical Issues:
#    • Inconsistent error handling patterns across auth module
#      src/auth/handlers.ts
#    • Missing type definitions for user session
#      src/types/session.ts
#
# 💡 Recommendations:
#    immediate: Externalize auth prompts before making changes
#    soon: Create type-safe session interface
```

```bash
# Step 2: Initialize memory to preserve context
delobotomize memory init

# Step 3: Store current working state
delobotomize memory search --query "authentication flow" --type pattern

# Found 0 results (first run)
```

```bash
# Step 4: Let AI fix the bug, but now it has context
# (Provide AI with the scan results and critical issues)

# Step 5: After AI makes changes, verify
delobotomize scan .

# 📊 Context Health Scores:
#    Overall: 68% (+6%)  ✓
#    Architecture: 62% (+7%)
#
# Changes improved health - safe to proceed!
```

```bash
# Step 6: Document the fix in memory
delobotomize memory export

# Creates snapshot with:
# - Symptoms detected
# - Solutions applied
# - Health score changes
# - Patterns learned
```

### Result

✅ Bug fixed without breaking existing functionality
✅ Context preserved across sessions
✅ Pattern stored for future reference
✅ Health score improved, not degraded

---

## 🎓 Sample Prompting Examples

### Example 1: Pre-Debugging Scan

**Before asking AI to fix anything:**

```
You to AI:
"Before we start debugging, I'm running a context scan:

[Paste output of: delobotomize scan .]

Based on these context health scores and critical issues, please:
1. Only address the undefined variable in auth.ts line 47
2. Do NOT modify error handling patterns (flagged as inconsistent)
3. Do NOT change any files outside src/auth/
4. Preserve the existing session type structure

What's your proposed fix for JUST the undefined variable?"
```

### Example 2: Using Memory for Context

**Query memory before making changes:**

```bash
delobotomize memory search --query "authentication errors" --top-k 5
```

```
You to AI:
"I've searched our project memory for similar authentication issues.
Here are 3 patterns we've encountered before:

[Paste memory search results]

Given these past patterns, please fix the current auth error while
avoiding the mistakes we made in previous attempts."
```

### Example 3: Post-Fix Validation

**After AI makes changes:**

```
You to AI:
"I'm validating your changes with delobotomize:

BEFORE: Overall Health 62%
AFTER:  Overall Health 58% (-4%)

The health score DECREASED. Please review your changes and identify
what might have introduced new issues. Specifically:

- Architecture score dropped from 55% to 48%
- New critical issue: 'Circular dependency in auth imports'

Can you revise your approach?"
```

### Example 4: Iterative Improvement

**Using memory across sessions:**

```bash
# Session 1 - Initial fix
delobotomize triage .
# Health: 42% → 65%

# Session 2 (next day) - Check memory first
delobotomize memory stats

# 📊 Memory Statistics:
#    Total Nodes: 47
#    Symptoms: 15
#    Patterns: 12
#    Solutions: 20
```

```
You to AI (next session):
"Continuing from yesterday. Our memory system shows:
- 15 symptoms detected in initial scan
- 12 patterns identified
- 20 solutions applied
- Health improved from 42% to 65%

[Paste: delobotomize memory search --query "yesterday's auth fixes"]

Using this context, let's tackle the remaining authentication issues
without regressing on yesterday's progress."
```

---

## 📖 Comprehensive Usage Guide

### Core Commands

#### 1. Scan - Detect Context Collapse

```bash
# Basic scan
delobotomize scan /path/to/project

# Scan with severity filter
delobotomize scan . --severity critical

# Use specific prompt version
delobotomize scan . --prompt-version v2.1
```

**Output:**
- Context health scores (0-100%)
- Critical issues with file locations
- Recommendations prioritized by urgency
- Status: HEALTHY | AT_RISK | COLLAPSED | CRITICAL

#### 2. Triage - Full Recovery Workflow

```bash
# Full triage with narrative report
delobotomize triage /path/to/project

# Automated mode (minimal output)
delobotomize triage . --automated

# Skip narrative report generation
delobotomize triage . --no-report
```

**4-Phase Process:**
1. **Problem Identification** - Extract symptoms, scan codebase
2. **Diagnosis** - Identify syndrome type and severity
3. **Remediation** - Execute corrective workflow
4. **Resolution** - Re-scan and measure improvement

**Output:**
- Detailed narrative report in `.delobotomize/triage-report-{timestamp}.md`
- Before/after health scores
- List of changes made
- Recommendations for next steps

#### 3. Memory - Persistent Context

```bash
# Initialize memory system
delobotomize memory init

# Search memory semantically
delobotomize memory search --query "undefined variable errors"

# Search with filters
delobotomize memory search \
  --query "authentication bugs" \
  --type symptom \
  --top-k 10

# View statistics
delobotomize memory stats

# Export snapshot
delobotomize memory export

# Clear all memory
delobotomize memory clear
```

**Memory Node Types:**
- `symptom` - Problems detected
- `pattern` - Recognized collapse patterns
- `solution` - Fixes applied
- `artifact` - Extracted code/docs
- `insight` - Lessons learned

#### 4. Extract - Phase 0 Context Extraction

```bash
# Extract from source materials
delobotomize extract

# Custom output directory
delobotomize extract --output ./analysis/extracted
```

Extracts:
- Artifacts from ARTIFACTS.md
- Insights from CONVERSATION_TRANSCRIPT.md
- Cross-references between items

#### 5. Analyze - Pattern Analysis

```bash
# Analyze extracted content
delobotomize analyze
```

Identifies:
- Critical vs. high vs. medium priorities
- Prompt externalization opportunities
- ROI scores for components

#### 6. Prompts - Manage Prompt Library

```bash
# List all prompts
delobotomize prompts list

# Load specific prompt
delobotomize prompts load --id diagnostic-analysis

# Test prompt
delobotomize prompts test --id diagnostic-analysis
```

**Prompt-Layered Architecture (PLA):**
- Prompts stored in `prompts/` directory
- Versioned with baseline tracking
- Externalized for iteration without code changes

#### 7. Iterate - Optimize High-ROI Components

```bash
# Plan iteration candidates
delobotomize iterate plan --tier CRITICAL

# Execute iteration on component
delobotomize iterate execute --component scanner-core

# View optimization report
delobotomize iterate report
```

**30-Point ROI Scoring:**
- Severity (0-10)
- Frequency (0-10)
- Cascading impact (0-10)

#### 8. Remediate - Execute Remediation Workflow

```bash
# Remediate with options
delobotomize remediate /path/to/project

# Dry run (simulate only)
delobotomize remediate . --dry-run

# Create backup first
delobotomize remediate . --backup

# Auto-confirm all prompts
delobotomize remediate . --yes
```

#### 9. Self-Test - Validate Delobotomize Itself

```bash
# Dogfooding - test on delobotomize project
delobotomize self-test

# Output:
# 🧪 Running self-application test...
# ✓ Scanning delobotomize project...
#
# 📊 Self Assessment:
#    Status: HEALTHY
#    Context Health: 87%
#
# ✅ No critical issues found!
```

---

## 🔌 LLM Provider Configuration

Delobotomize is **model-agnostic** and supports multiple providers:

### Supported Providers

| Provider | Completions | Embeddings | Setup |
|----------|-------------|------------|-------|
| **OpenRouter** | ✅ | ✅ | `OPENROUTER_API_KEY` |
| **Anthropic (Claude)** | ✅ | ❌* | `ANTHROPIC_API_KEY` |
| **Google Gemini** | ✅ | ✅ | `GEMINI_API_KEY` |
| **OpenAI (GPT)** | ✅ | ✅ | `OPENAI_API_KEY` |
| **Cohere** | ✅ | ✅ | `COHERE_API_KEY` |

*Use OpenRouter for embeddings when using Anthropic for completions

### Configuration

**Option 1: Environment Variables** (Recommended)

```bash
# OpenRouter (access to many models)
export OPENROUTER_API_KEY="sk-or-v1-..."

# Or Anthropic Claude
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENROUTER_API_KEY="sk-or-v1-..."  # For embeddings

# Or Google Gemini
export GEMINI_API_KEY="AIza..."

# Or OpenAI
export OPENAI_API_KEY="sk-..."

# Or Cohere
export COHERE_API_KEY="..."
```

**Option 2: .env File**

```bash
# Copy template
cp .env.example .env

# Edit with your API keys
nano .env
```

### Provider Priority

Auto-detection checks in this order:
1. OPENROUTER_API_KEY
2. ANTHROPIC_API_KEY
3. GEMINI_API_KEY / GOOGLE_API_KEY
4. OPENAI_API_KEY
5. COHERE_API_KEY

### Model Selection

Override default models:

```bash
# OpenRouter
export OPENROUTER_MODEL="anthropic/claude-3.5-sonnet"

# Anthropic
export ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"

# Gemini
export GEMINI_MODEL="gemini-2.0-flash-exp"

# OpenAI
export OPENAI_MODEL="gpt-4o"

# Cohere
export COHERE_MODEL="command-r-plus"
```

---

## 🏗️ Architecture Overview

### 5-Phase System

```
Phase 0: EXTRACTION
├── Extract artifacts from source materials
├── Identify insights from conversations
└── Build cross-reference map

Phase 1: CONTEXT RECONSTRUCTION
├── Scan codebase for collapse symptoms
├── Build knowledge graph
├── Chunk and embed content (RAG)
└── Store in vector database

Phase 2: DIAGNOSTIC ANALYSIS
├── Load diagnostic prompts
├── Classify syndrome type
├── Assess severity and confidence
└── Query memory for similar patterns

Phase 3: REMEDIATION
├── Execute workflow steps
├── Apply corrective actions
├── Store solutions in memory
└── Create backups

Phase 4: VERIFICATION
├── Re-scan codebase
├── Measure health improvement
├── Validate fixes
└── Generate narrative report

Phase 5: CONTINUOUS ITERATION
├── Score components by ROI
├── Optimize high-value items
├── Track performance metrics
└── Improve over time
```

### Memory System

```
Knowledge Graph          Vector Store           MCP Server
     (Nodes)          (Semantic Search)      (IDE Integration)
        │                    │                      │
        └────────────────────┴──────────────────────┘
                             │
                      Context Manager
                             │
                    ┌────────┴────────┐
              Chunking (RAG)     LLM Provider
                                 (Embeddings)
```

**Components:**
- **Knowledge Graph** - Structured relationships (symptoms → solutions)
- **Vector Store** - Semantic search with cosine similarity
- **Text Chunker** - 4 RAG strategies (fixed, sentence, semantic, hierarchical)
- **MCP Server** - Expose memory to IDEs via Model Context Protocol
- **LLM Provider** - Model-agnostic embedding generation

### File Structure

```
delobotomize/
├── src/
│   ├── cli/              # Command-line interface
│   ├── core/             # Scanner, detector, prompt loader
│   ├── extractors/       # Phase 0 extraction
│   ├── analyzers/        # Content analysis
│   ├── orchestration/    # Triage narrator, orchestrator
│   ├── workflows/        # Remediation workflows
│   ├── iteration/        # ROI scoring, optimization
│   ├── memory/           # Knowledge graph, vector store, MCP
│   └── llm/              # Provider interface, implementations
├── prompts/              # Externalized prompt library
├── config/               # Workflow configurations
└── .delobotomize/        # Generated data
    ├── memory/           # Persistent memory snapshots
    ├── triage-report-*   # Narrative reports
    └── backups/          # Pre-remediation backups
```

---

## 🎨 Example Workflows

### Workflow 1: Daily Development with Context Preservation

```bash
# Morning: Check project health
delobotomize scan .

# Before coding session: Initialize memory
delobotomize memory init

# During development: Track changes
# (Use scan periodically to monitor health)

# End of day: Save snapshot
delobotomize memory export
```

### Workflow 2: Emergency Recovery

```bash
# Disaster struck - AI broke everything
delobotomize triage .

# Review what happened
cat .delobotomize/triage-report-*.md

# Check health improvement
# Before: 35% | After: 68%

# Apply remaining fixes from recommendations
delobotomize remediate . --backup
```

### Workflow 3: Cross-Session Learning

```bash
# Week 1: Fix authentication bugs
delobotomize triage .
# Memory stores: symptoms, patterns, solutions

# Week 2: Similar auth issue appears
delobotomize memory search --query "authentication" --type solution

# Use past solutions to guide current fix
# Avoid repeating mistakes from Week 1
```

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/delobotomize.git
cd delobotomize

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run locally
npm link
delobotomize --help
```

### Testing Changes

```bash
# Test on delobotomize itself (dogfooding)
delobotomize self-test

# Run full triage
delobotomize triage .
```

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built from real-world patterns discovered during AI-assisted development disasters.

**Research-backed methodologies:**
- RAG chunking strategies from academic literature
- Context preservation techniques from LLM research
- Syndrome detection patterns from production debugging sessions

**Special Thanks:**
- Extracted from DataKiln project recovery experience
- Inspired by real conversations with Claude Code
- Built to solve actual problems, not hypothetical ones

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/delobotomize/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/delobotomize/discussions)
- **Documentation:** [docs/](docs/)

---

## 🚀 Roadmap

- [x] Phase 0: Extraction system
- [x] Phase 1: Context reconstruction (scanner, detector)
- [x] Phase 2: Diagnostic analysis
- [x] Phase 3: Remediation workflows
- [x] Phase 4: Verification & reporting
- [x] Phase 5: Iterative optimization
- [x] Memory system (Knowledge graph, Vector DB, MCP)
- [x] LLM provider abstraction (5 providers)
- [ ] v1.0.0: Public release
- [ ] IDE extensions (VS Code, Cursor)
- [ ] Web dashboard
- [ ] Team collaboration features

---

**Stop the blind gardener. Start with `delobotomize scan .`**
