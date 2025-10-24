# Delobotomize - Project Build Instructions for Claude Code

## Project Overview
Build a CLI tool called "delobotomize" that restores context and memory to codebases suffering from feature creep, scope drift, and context collapse during AI-assisted development.

## Core Functionality (from conversation artifacts)

### 1. Codebase Mapper (`src/audit.js`)
**Source:** Artifact "codebase-mapper.cjs - Automated Analysis Script"
**Purpose:** Scan codebase, analyze imports, classify files
**Features:**
- File scanning with configurable ignore patterns
- Import/dependency graph construction
- File classification (core/active/suspicious/orphaned/stale)
- Statistical analysis and reporting

### 2. Archive System (`src/archive.js`)
**Source:** Generated from codebase-mapper archival-plan.md output
**Purpose:** Safe file archival with rollback capability
**Features:**
- Generate archive script from audit results
- Timestamped archive directories
- Manifest generation
- Restore capability

### 3. Post-Archive Validator (`src/validate.js`)
**Source:** Artifact "validate-post-archive.cjs - Verify System Still Works"
**Purpose:** Smoke tests after archival
**Features:**
- File structure validation
- Import resolution checking
- Build process testing
- Server startup validation

### 4. Memory Bank Generator (`src/membank.js`)
**Source:** systemPatterns.md template from conversation
**Purpose:** Generate Kilo Code Memory Bank structure
**Features:**
- Initialize .kilocode/rules/memory-bank/ structure
- Generate systemPatterns.md from audit results
- Populate working/broken component registries
- API verification tracking

### 5. CLI Interface (`src/cli.js`)
**Purpose:** Command-line interface using commander.js or similar
**Commands:**
```
delobotomize init              # Initialize in existing project
delobotomize audit             # Run full codebase audit
delobotomize archive           # Execute safe archival
delobotomize validate          # Run post-change validation
delobotomize membank           # Generate Memory Bank
delobotomize recover           # Emergency recovery mode
```

## Technical Specifications

### Dependencies (package.json)
- Node.js >= 20.0.0
- commander (CLI framework)
- chalk (colored output)
- ora (spinners)
- inquirer (interactive prompts)
- fs-extra (enhanced file operations)

### Configuration File
**File:** `delobotomize.config.json` (optional, created by init)
```json
{
  "scanDirs": ["src", "scripts"],
  "ignoreDirs": ["node_modules", "dist", ".git"],
  "includeExtensions": [".js", ".ts", ".jsx", ".tsx"],
  "projectGoals": []
}
```

### Output Structure
```
project/
├── delobotomize.config.json
├── audit-reports/
│   ├── summary.md
│   ├── detailed-analysis.md
│   ├── archival-plan.md
│   └── dependency-graph.md
├── archive/
│   └── YYYYMMDD-HHMMSS/
└── .kilocode/rules/memory-bank/
    └── systemPatterns.md
```

## Implementation Requirements

1. **Modularity:** Each command is a separate module in src/
2. **Error Handling:** Comprehensive try-catch with helpful messages
3. **Interactive Mode:** Prompt for confirmation before destructive operations
4. **Dry Run:** All commands support --dry-run flag
5. **Verbose Mode:** --verbose flag for detailed output
6. **Progress Indicators:** Use ora spinners for long operations

## Quality Standards

- ✅ No hardcoded paths (use process.cwd())
- ✅ Cross-platform (Windows/Mac/Linux)
- ✅ Zero dependencies on external AI APIs for core functionality
- ✅ Comprehensive README with examples
- ✅ MIT License
- ✅ Clean, commented code

## Build Order

1. package.json and dependencies
2. src/cli.js (command structure)
3. src/audit.js (codebase mapper)
4. src/archive.js (archival system)
5. src/validate.js (validation tests)
6. src/membank.js (Memory Bank generator)
7. templates/systemPatterns.md
8. README.md
9. LICENSE (MIT)
10. .gitignore

## Testing Checklist

After build:
- [ ] npm install works
- [ ] delobotomize --help shows all commands
- [ ] delobotomize init creates config
- [ ] delobotomize audit generates reports
- [ ] delobotomize membank creates .kilocode structure
- [ ] All commands work with --dry-run

## Reference Conversation
The complete conversation context that led to this project is attached as CONVERSATION_TRANSCRIPT.md
