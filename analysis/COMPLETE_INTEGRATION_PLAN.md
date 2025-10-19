# Delobotomize - Complete Integration Plan

**Created:** 2025-10-19
**Purpose:** Synthesize all analysis (artifacts + transcript) into actionable implementation roadmap

---

## EXECUTIVE SUMMARY

### What We Have:

**From ARTIFACTS.md (6 artifacts extracted):**
1. **Failure Analysis Framework** - 20 patterns, prevention checklists
2. **Resolution Audit Methodology** - Verification techniques, 4 failure patterns
3. **Codebase Mapper** - 616 lines of scanner code (95% ready)
4. **Post-Archive Validator** - 280 lines of validation code (90% ready)
5. **Implementation Checklist** - 6-phase recovery procedure
6. **Project Codification** - (duplicate of #5)

**From CONVERSATION_TRANSCRIPT.md (24 unique insights):**
- Named problem: "The Blind Gardener"
- Scientific backing: Context Degradation Syndrome
- Industry solutions: 5 research-backed approaches
- Claim verification methodology
- Solo developer adaptations
- Emergency recovery protocols
- + 18 more insights

**Total Assets:**
- **~900 lines** of production-ready code
- **6 phase structures** mapped to our 5-phase design
- **24 methodologies** for context preservation
- **20 failure patterns** to detect
- **15+ templates** for various use cases

---

## DELOBOTOMIZE PROJECT STRUCTURE

### Repository Layout:

```
delobotomize/
├── src/
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── init.ts          # Initialize project
│   │   │   ├── audit.ts         # Phase 1: Audit
│   │   │   ├── triage.ts        # Phase 2: Triage
│   │   │   ├── archive.ts       # Phase 3: Archive
│   │   │   ├── remediate.ts     # Phase 4: Remediate
│   │   │   ├── validate.ts      # Phase 5: Validate
│   │   │   ├── memory.ts        # Memory Bank operations
│   │   │   ├── health.ts        # Health checks
│   │   │   ├── verify.ts        # Claim verification
│   │   │   └── recover.ts       # Emergency recovery
│   │   └── index.ts             # CLI entry point
│   │
│   ├── core/
│   │   ├── scanner.ts           # From Artifact #3 (codebase-mapper)
│   │   ├── classifier.ts        # Pattern matching + LLM intent
│   │   ├── validator.ts         # From Artifact #4 (post-archive)
│   │   ├── claim-verifier.ts    # From Transcript Insight #4
│   │   ├── scope-validator.ts   # From Transcript Insight #10
│   │   ├── pattern-lock-detector.ts  # From Transcript Insight #10
│   │   └── variable-scope-analyzer.ts # From Transcript Insight #22
│   │
│   ├── memory/
│   │   ├── mcp-server.ts        # MCP protocol implementation
│   │   ├── context-manager.ts   # From Transcript Insight #2
│   │   ├── rag-chunker.ts       # From RAG.md
│   │   └── vector-store.ts      # Embeddings for semantic search
│   │
│   ├── detectors/
│   │   ├── cds-detector.ts      # Context Degradation Syndrome
│   │   ├── anti-patterns.ts     # From Artifact #1 + Transcript
│   │   ├── api-validator.ts     # From Transcript Insight #24
│   │   └── duplicate-detector.ts # From Transcript Insight #23
│   │
│   ├── templates/
│   │   ├── prompts/             # LLM prompts
│   │   │   ├── audit-prompt.md
│   │   │   ├── fix-request.md
│   │   │   └── emergency-recovery.md
│   │   ├── checklists/          # Forcing functions
│   │   │   ├── pre-flight.md
│   │   │   └── weekly-health.md
│   │   └── configs/             # Config templates
│   │       ├── solo-dev.yaml
│   │       └── team-dev.yaml
│   │
│   └── utils/
│       ├── file-utils.ts
│       ├── ast-parser.ts
│       └── report-generator.ts
│
├── templates/                    # User-facing templates
│   ├── system-patterns.yaml.template
│   ├── bug-report.md.template
│   ├── adr-template.md
│   └── fmea-template.md
│
├── docs/
│   ├── README.md                # Main documentation
│   ├── INSTALLATION.md
│   ├── USAGE.md
│   ├── ARCHITECTURE.md
│   ├── DEBUGGING_METHODOLOGY.md # From transcript
│   ├── CONTEXT_COLLAPSE_PREVENTION.md
│   ├── DEVELOPER_PROFILES.md
│   └── ANTI_PATTERNS.md
│
├── scripts/                     # Development scripts
│   ├── build.sh
│   ├── test.sh
│   └── publish.sh
│
├── .delobotomize/              # Example project structure
│   ├── config.yaml
│   ├── memory/
│   │   ├── system-patterns.yaml
│   │   ├── recent-changes.log
│   │   └── vector-db/
│   ├── audit-reports/
│   ├── rules/
│   └── archive/
│
├── package.json
├── tsconfig.json
├── .gitignore
├── LICENSE (MIT)
└── README.md
```

---

## PHASE-BY-PHASE IMPLEMENTATION ROADMAP

### **Week 1-2: Foundation & Core Scanner**

#### Deliverables:
1. ✅ Project scaffolding
2. ✅ CLI framework (Commander.js)
3. ✅ Core scanner (from Artifact #3)
4. ✅ File classifier (pattern matching)

#### Files to Create:

**`src/core/scanner.ts`** (from Artifact #3, lines 1571-2078)
```typescript
// Adapt codebase-mapper.cjs to TypeScript
// Remove DataKiln-specific patterns
// Add multi-language support (Python, Go)

export class CodebaseScanner {
  async scanDirectory(dir: string): Promise<FileInfo[]>
  async analyzeFile(file: string): Promise<FileAnalysis>
  async extractImports(content: string, ext: string): Promise<string[]>
  async extractExports(content: string, ext: string): Promise<Export[]>
  async analyzeImports(): Promise<DependencyGraph>
  async classifyFiles(): Promise<Classification[]>
  async generateReports(): Promise<void>
}
```

**`src/core/classifier.ts`** (new, based on Artifact #3 patterns)
```typescript
export class FileClassifier {
  classifyByPattern(file: FileInfo): Classification
  async classifyByIntent(file: FileInfo): Promise<IntentClassification>
  calculateRisk(file: FileInfo): number
}
```

**`src/cli/commands/init.ts`**
```typescript
export async function initCommand(options: InitOptions) {
  // Create .delobotomize/ structure
  // Generate config.yaml
  // Create forcing function checklist
  // Initialize memory bank
}
```

**`src/cli/commands/audit.ts`**
```typescript
export async function auditCommand(options: AuditOptions) {
  const scanner = new CodebaseScanner(config);
  await scanner.analyze();

  // Generate reports:
  // - summary.md
  // - detailed-analysis.md
  // - dependency-graph.md
  // - archival-plan.md
}
```

#### Testing:
```bash
npm test -- src/core/scanner.test.ts
npm test -- src/core/classifier.test.ts
```

---

### **Week 3-4: Validation & Detection Systems**

#### Deliverables:
1. ✅ Post-archive validator (from Artifact #4)
2. ✅ Context collapse detector (from Transcript)
3. ✅ Pattern lock detector (from Transcript)
4. ✅ API validator (from Transcript)

#### Files to Create:

**`src/core/validator.ts`** (from Artifact #4, lines 2118-2377)
```typescript
export class PostArchiveValidator {
  async testFileStructure(): Promise<TestResult[]>
  async testImports(): Promise<TestResult[]>
  async testBuild(): Promise<TestResult>
  async testServer(): Promise<TestResult>
  async generateReport(): Promise<void>
}
```

**`src/detectors/cds-detector.ts`** (from Transcript Insight #2)
```typescript
export class ContextDegradationDetector {
  detectSymptoms(history: ConversationHistory): CDSSymptoms

  // Symptoms:
  // - Repetitive responses (same fix >2 times)
  // - Scope tunnel vision (locked on single file)
  // - Generic output (no file/line numbers)
}
```

**`src/detectors/pattern-lock-detector.ts`** (from Transcript Insight #10)
```typescript
export class PatternLockDetector {
  detectLock(history: ConversationHistory): LockStatus {
    // Same file modified >3 times?
    // Same error repeated >2 times?
  }
}
```

**`src/detectors/api-validator.ts`** (from Transcript Insight #24)
```typescript
export class APIValidator {
  async verifyAPICompatibility(calls: APICall[]): Promise<Verification[]>
  async testEndpoint(endpoint: string, payload: any): Promise<TestResult>
}
```

**`src/cli/commands/validate.ts`**
```typescript
export async function validateCommand(options: ValidateOptions) {
  const validator = new PostArchiveValidator(config);
  await validator.validate();

  // Output: validation-report.md
}
```

---

### **Week 5-6: Memory Bank & MCP Integration**

#### Deliverables:
1. ✅ Memory Bank system (from Artifact #5)
2. ✅ MCP server (from REVISED_ARCHITECTURE.md)
3. ✅ RAG chunking (from RAG.md)
4. ✅ Context manager (from Transcript)

#### Files to Create:

**`src/memory/mcp-server.ts`**
```typescript
export class DelobotomizeMCPServer {
  async initialize(): Promise<void>
  async getFileContext(path: string): Promise<FileContext>
  async semanticSearch(query: string): Promise<SearchResult[]>
  async getWorkingComponents(): Promise<Component[]>
  async getBrokenComponents(): Promise<Component[]>
  async updateMemory(changes: Change[]): Promise<void>
}
```

**`src/memory/context-manager.ts`** (from Transcript Insight #2)
```typescript
export class ContextManager {
  async buildFixContext(bugReport: BugReport): Promise<FixContext>
  async injectContextIntoPrompt(prompt: string, context: FixContext): Promise<string>

  // Context includes:
  // - Working components (DO NOT MODIFY)
  // - Broken components (NEEDS FIXING)
  // - API verification status
  // - Recent changes
}
```

**`src/memory/rag-chunker.ts`** (from RAG.md)
```typescript
export class RAGChunker {
  async chunkArtifact(artifact: Artifact): Promise<Chunk[]>

  // Strategies:
  // - Fixed-size (for large files)
  // - Sentence-based (for docs)
  // - Semantic (for code)
  // - Recursive hierarchical (for audit results)
}
```

**`src/cli/commands/memory.ts`**
```typescript
export async function memoryCommand(action: string, options: MemoryOptions) {
  // Actions:
  // - build: Create initial memory bank
  // - update: Add recent changes
  // - load: Load memory for session
  // - export: Export to JSON for MCP
}
```

---

### **Week 7-8: Triage & Remediation**

#### Deliverables:
1. ✅ Triage system (interactive classification)
2. ✅ Claim verifier (from Transcript)
3. ✅ Scope validator (from Transcript)
4. ✅ Fix request templates (from Artifact #5)

#### Files to Create:

**`src/core/claim-verifier.ts`** (from Transcript Insight #4)
```typescript
export class ClaimVerifier {
  async verifyClaims(summary: string, code: string): Promise<Verification[]>

  // Checks:
  // - Claimed fix actually in code?
  // - API calls use valid format?
  // - Models exist?
  // - No breaking changes to working components?
}
```

**`src/core/scope-validator.ts`** (from Transcript Insight #10)
```typescript
export class ScopeValidator {
  async validateFixScope(fix: ProposedFix, bug: BugReport): Promise<Validation>

  // Checks:
  // - Scope too narrow (1 file when bug spans multiple)?
  // - Scope too wide (>3x expected files)?
  // - Touching protected components?
}
```

**`src/cli/commands/triage.ts`**
```typescript
export async function triageCommand(options: TriageOptions) {
  // Interactive classification:
  // 1. Show audit results
  // 2. User confirms/overrides classifications
  // 3. Generate triage plan
  // 4. Save to memory bank
}
```

**`src/cli/commands/remediate.ts`**
```typescript
export async function remediateCommand(options: RemediateOptions) {
  // Interactive fix workflow:
  // 1. Load memory (working vs broken)
  // 2. Present broken components
  // 3. Request fix with context
  // 4. Validate scope
  // 5. Verify claims
  // 6. Apply if valid
  // 7. Update memory
}
```

---

### **Week 9-10: Advanced Features & Polish**

#### Deliverables:
1. ✅ Emergency recovery (from Transcript)
2. ✅ Health checks (from Transcript)
3. ✅ Developer profiles (from Transcript)
4. ✅ Progressive depth modes (from Transcript)

#### Files to Create:

**`src/cli/commands/recover.ts`** (from Transcript Insight #11)
```typescript
export async function recoverCommand(options: RecoverOptions) {
  // Emergency circuit breaker:
  // 1. Detect context collapse
  // 2. Close current session
  // 3. Load memory in correct order
  // 4. Generate surgical prompt
  // 5. Ready for fresh attempt
}
```

**`src/cli/commands/health.ts`** (from Transcript Insight #12)
```typescript
export async function healthCommand(options: HealthOptions) {
  // Weekly health check:
  // - Hardcoded paths (cross-platform issues)
  // - Untested dependencies
  // - Orphaned files
  // - Scope creep indicators
  // - Recent iteration counts
}
```

**`src/cli/commands/verify.ts`** (from Transcript Insight #4)
```typescript
export async function verifyCommand(options: VerifyOptions) {
  // Claim verification:
  // - Parse AI summary
  // - Check code for claimed changes
  // - Generate discrepancy report
}
```

---

## CONFIGURATION SYSTEM

### **`.delobotomize/config.yaml`**

```yaml
# Project Configuration
project:
  name: "my-project"
  type: "nodejs"  # nodejs, python, go, rust
  goals:
    - "Build REST API"
    - "Implement auth system"

# Developer Profile
developer:
  type: "solo"  # solo, team, corporate
  process_weight: "lightweight"  # lightweight, standard, heavyweight
  failure_tolerance: "high"  # high (learning), low (production)

# Audit Configuration
audit:
  scan_dirs:
    - "src"
    - "lib"
  ignore_dirs:
    - "node_modules"
    - "dist"
    - ".git"
  include_extensions:
    - ".js"
    - ".ts"
    - ".tsx"

  classification_rules:
    core_patterns:
      - "server\\.(js|ts|cjs)$"
      - "main\\.(js|ts|py|go)$"
    suspicious_patterns:
      - "example/"
      - "demo/"
      - "test/"
      - "backup/"
    stale_threshold_days: 90

# Validation Configuration
validation:
  tests:
    file_structure: true
    import_resolution: true
    build_process: true
    server_startup: false  # Optional

  build_command: "npm run build"
  test_command: "npm test"

# Memory Bank Configuration
memory:
  enabled: true
  auto_update: true  # Update on git commit
  split_at_kb: 50    # Split large files

  components:
    track_working: true
    track_broken: true
    track_api_status: true
    track_recent_changes: true

# Detection Rules
detection:
  context_collapse:
    enabled: true
    repetition_threshold: 2
    file_lock_threshold: 3

  anti_patterns:
    - experimental_models_in_prod
    - assumed_api_compatibility
    - fixed_delays_vs_events
    - reference_before_definition

# Advanced Features
advanced:
  multi_model: false  # Future: Use different models per phase
  agentic_swarm: false  # Future: Parallel execution

  depth_modes:
    quick: 30   # seconds
    standard: 120
    deep: 300
    ultra: 600
```

---

## TEMPLATE SYSTEM

### **Pre-Flight Checklist** (from Transcript Insight #8)

**`templates/pre-flight-checklist.md`**
```markdown
# Pre-Flight Checklist

## Project Definition
- [ ] What problem am I solving? (1 sentence)
- [ ] What is MINIMUM viable version? (3 features max)
- [ ] What is my deadline?

## External Dependencies
- [ ] List every API/service this depends on
- [ ] For each: Do I have an account? Free tier?
- [ ] For each: Have I READ docs or assumed it works?

## Success Criteria
- [ ] How will I know this "works"? (Specific test case)
- [ ] What is acceptable failure rate?
- [ ] What would make me abandon this?

## Risk Assessment
- [ ] What is ONE thing most likely to break?
- [ ] Do I have backup plan?
- [ ] Am I using any experimental/beta APIs?
```

### **System Patterns Template** (from Artifact #5)

**`templates/system-patterns.yaml.template`**
```yaml
metadata:
  generated: "YYYY-MM-DD"
  last_updated: "YYYY-MM-DD"
  project_type: "nodejs"

architecture:
  files:
    - path: "src/server.js"
      purpose: "Express backend"
      dependencies:
        external: ["express", "child_process"]
        internal: ["scripts/orchestrator.js"]
      data_flow: "HTTP → Handler → Process → FS"
      status: WORKING

working_components:
  - path: "src/server.js"
    function: "app.post('/api/endpoint')"
    status: VERIFIED_WORKING
    last_verified: "YYYY-MM-DD"
    protection_level: CRITICAL
    reason: "Core functionality operational"

broken_components:
  - path: "src/client.js"
    function: "apiCall()"
    problem: "Uses wrong parameter format"
    severity: P0
    suggested_fix: "Use correct format per docs"

api_verification:
  - name: "External API"
    endpoint: "https://api.example.com/v1"
    model: "gpt-4"
    verified: false
    issues:
      - "Model name unverified"
    fallback: "Use alternative API"

environmental_requirements:
  filesystem:
    base_path: "/path/to/output/"
    status: HARDCODED
    solution: "Use environment variable"

recent_changes:
  - date: "YYYY-MM-DD"
    file: "src/file.js"
    change: "Fixed variable scoping"
    reason: "Variable undefined"
    status: VERIFIED_WORKING
    side_effects: NONE
```

### **Bug Report Template** (from Artifact #5)

**`templates/bug-report.md.template`**
```markdown
# Bug Report

**Date:** YYYY-MM-DD

## Observed Behavior
- What happened:
- Expected behavior:
- Error message (if any):

## Reproduction Steps
1. Step one
2. Step two
3. ...

## Affected Components
(Reference system-patterns.yaml)
- Primary: [file::function]
- Dependencies: [files involved]

## Context
- What was working before?
- What changed recently?
- Is this blocking other work?

## Initial Hypothesis
- Possible causes:
- Components to investigate:
```

---

## CLI COMMAND SPECIFICATION

### **Core Commands:**

```bash
# Initialize project
delobotomize init [options]
  --profile <solo|team>     Developer profile
  --type <nodejs|python|go> Project type
  --checklist              Generate pre-flight checklist

# Run audit (Phase 1)
delobotomize audit [options]
  --depth <quick|standard|deep|ultra>
  --output <dir>           Output directory
  --format <md|json|yaml>  Report format

# Interactive triage (Phase 2)
delobotomize triage [options]
  --auto                   Auto-classify (no interaction)
  --threshold <number>     Risk threshold for archival

# Archive files (Phase 3)
delobotomize archive [options]
  --plan <file>            Use specific archival plan
  --dry-run                Show what would be archived
  --backup                 Create backup before archiving

# Remediate bugs (Phase 4)
delobotomize remediate [options]
  --interactive            Interactive fix workflow
  --bug <file>             Bug report file
  --verify                 Verify fix scope before applying

# Validate changes (Phase 5)
delobotomize validate [options]
  --full                   Run all validation tests
  --changed-files          Only test changed files

# Memory Bank operations
delobotomize memory <action> [options]
  build                    Create initial memory bank
  update                   Add recent changes
  load                     Load memory for session
  export                   Export to JSON for MCP

# Health checks
delobotomize health [options]
  --weekly                 Run weekly health check
  --report <file>          Save report to file

# Claim verification
delobotomize verify [options]
  --claims <file>          AI summary to verify
  --code <dir>             Code directory to check against

# Emergency recovery
delobotomize recover [options]
  --emergency              Activate circuit breaker
  --reset                  Full context reset
```

---

## TESTING STRATEGY

### **Unit Tests:**

```typescript
// src/core/scanner.test.ts
describe('CodebaseScanner', () => {
  it('should scan directory recursively')
  it('should extract imports from JS files')
  it('should classify files by pattern')
  it('should build dependency graph')
})

// src/core/validator.test.ts
describe('PostArchiveValidator', () => {
  it('should test file structure')
  it('should verify import resolution')
  it('should run build process')
})

// src/detectors/cds-detector.test.ts
describe('ContextDegradationDetector', () => {
  it('should detect repetitive responses')
  it('should detect scope tunnel vision')
  it('should detect generic output')
})
```

### **Integration Tests:**

```bash
# Test full workflow
test-project/
├── src/
│   ├── working.js    # Should be protected
│   ├── broken.js     # Should be flagged
│   └── unused.js     # Should be archived

# Run:
delobotomize init --profile solo
delobotomize audit --depth standard
delobotomize triage --auto
delobotomize archive
delobotomize validate

# Verify:
# - working.js marked as WORKING
# - broken.js identified
# - unused.js archived
# - system still functional
```

---

## DOCUMENTATION PLAN

### **User-Facing Docs:**

1. **README.md**
   - What is Delobotomize?
   - "Stop the Blind Gardener"
   - Quick start guide
   - Installation

2. **INSTALLATION.md**
   - Prerequisites
   - npm install
   - First run setup

3. **USAGE.md**
   - Complete workflow example
   - Command reference
   - Configuration options

4. **ARCHITECTURE.md**
   - System design
   - Phase structure
   - Extension points

5. **DEBUGGING_METHODOLOGY.md** (from transcript)
   - How to identify context collapse
   - Progressive depth analysis
   - Claim verification process
   - Emergency recovery

6. **CONTEXT_COLLAPSE_PREVENTION.md** (from transcript)
   - What is the "Blind Gardener" problem?
   - Context Degradation Syndrome
   - Memory Bank system
   - Forcing functions

7. **DEVELOPER_PROFILES.md** (from transcript)
   - Solo developer (lightweight)
   - Team (standard)
   - Corporate (heavyweight)
   - Customization guide

8. **ANTI_PATTERNS.md** (from transcript + artifacts)
   - Experimental models in production
   - Assumed API compatibility
   - Fixed delays vs events
   - Reference before definition
   - + 16 more patterns

---

## MARKETING & BRANDING

### **Tagline:**
> "Delobotomize: Restore your codebase's memory and cognition"

### **Problem Statement:**
> You ask AI to fix one bug. It "goes to town like a blind gardener" - pruning healthy code, breaking working features, turning a minor issue into catastrophe.

### **Solution Statement:**
> Delobotomize creates a persistent "memory" AI can see before it starts cutting. Stop context collapse. Stop cascade failures. Stop the blind gardener.

### **Key Features:**
1. **Persistent Memory Bank** - AI never forgets what works
2. **Claim Verification** - Don't trust, verify
3. **Emergency Recovery** - Circuit breaker when AI goes blind
4. **Solo Dev Focused** - Lightweight, not corporate
5. **Context Preservation** - 5-phase safety gates

### **Target Audience:**
- Solo developers
- AI-assisted projects (mid-size codebases 10K-400K lines)
- Projects with feature creep
- Anyone experiencing "blind gardener" syndrome

---

## RELEASE PLAN

### **v0.1.0 (MVP) - Week 1-2**
- ✅ Basic CLI scaffolding
- ✅ Audit command (scanner + classifier)
- ✅ Report generation

### **v0.2.0 - Week 3-4**
- ✅ Validation command
- ✅ Archive command
- ✅ Context collapse detection

### **v0.3.0 - Week 5-6**
- ✅ Memory Bank system
- ✅ MCP server integration
- ✅ Triage command

### **v0.4.0 - Week 7-8**
- ✅ Remediate command
- ✅ Claim verification
- ✅ Scope validation

### **v1.0.0 - Week 9-10**
- ✅ All core features complete
- ✅ Emergency recovery
- ✅ Health checks
- ✅ Developer profiles
- ✅ Complete documentation
- ✅ npm publish

### **v1.1.0+ - Future**
- ⏳ Multi-model validation
- ⏳ Agentic swarm (parallel execution)
- ⏳ IDE integrations (VSCode extension)
- ⏳ Web dashboard
- ⏳ Community patterns sharing

---

## SUCCESS METRICS

### **Technical Metrics:**
- [ ] 95%+ code reuse from artifacts
- [ ] <10s audit time for 100-file projects
- [ ] <2s validation time
- [ ] 90%+ accuracy in classification

### **User Experience Metrics:**
- [ ] <5 minutes from install to first audit
- [ ] <10 minutes overhead per bug fix (vs hours of cascade failures)
- [ ] 80%+ user satisfaction (via survey)

### **Adoption Metrics:**
- [ ] 100+ npm downloads in first month
- [ ] 10+ GitHub stars in first month
- [ ] 5+ community contributions in first quarter

---

## NEXT IMMEDIATE STEPS

### **Today (2025-10-19):**
1. ✅ Complete analysis (DONE)
2. ⏳ Initialize git repository
3. ⏳ Create package.json
4. ⏳ Set up TypeScript
5. ⏳ Create directory structure

### **Tomorrow:**
1. ⏳ Implement scanner (from Artifact #3)
2. ⏳ Implement classifier
3. ⏳ Create audit command
4. ⏳ Test on sample project

### **This Week:**
1. ⏳ Complete MVP (v0.1.0)
2. ⏳ Write README
3. ⏳ Create first release

---

## QUESTIONS FOR USER

1. **Package Manager:** npm or pnpm? (You mentioned pnpm earlier)
2. **TypeScript:** Full TypeScript or allow JS? (Recommend TypeScript)
3. **Testing Framework:** Jest, Vitest, or other?
4. **LLM Integration:** Which APIs to support? (OpenAI, Anthropic, Google Gemini, OpenRouter?)
5. **MCP Server:** Deploy separately or bundle with CLI?
6. **First Use Case:** Test on DataKiln project first?

---

*Ready to build! Shall we start with initializing the git repository and package.json?*
