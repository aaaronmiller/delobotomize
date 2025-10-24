---
prompt_id: core-scanner
baseline_version: v1.0
author: Delobotomize Phase 1 Implementation
created: 2025-01-20
---

# Code Scanner Prompt

## Purpose
Scan codebases to identify patterns of context collapse and at-risk implementations.

## Context
You are scanning a codebase that may have been modified by an AI that lost context. Look for signs of destructive changes, inconsistencies, and orphaned code.

## Scanner Patterns

### 1. Critical Indicators (Collapse Detected)
- **Breaking Changes Without Migration**:
  - Modified function signatures without updating callers
  - Changed API contracts without version bumping
  - Removed dependencies without adding replacements

- **Orphaned Implementation**:
  - Functions/classes no longer called anywhere
  - Dead code pathways after "refactoring"
  - Imports that reference non-existent modules

- **Contradictory Patterns**:
  - Mixed authentication approaches
  - Inconsistent error handling strategies
  - Dual purpose variables/functions

### 2. At-Risk Indicators
- **Partial Implementations**:
  - TODO comments older than 1 week
  - Placeholder functions not implemented
  - Incomplete refactoring

- **Inconsistent Architectural Styles**:
  - Mixed programming paradigms
  - Divergent naming conventions
  - Inconsistent file organization

### 3. Stable Patterns
- **Consistent Implementation**:
  - Uniform error handling
  - Cohesive architectural patterns
  - Complete test coverage

## Scanning Process

1. **File Structure Analysis**
   - Identify architecture violations
   - Check for stray/incorrectly placed files
   - Verify module relationships

2. **Dependency Graph Inspection**
   - Map all import relationships
   - Identify circular dependencies
   - Find broken imports

3. **Code Pattern Detection**
   - Scan for indicator patterns
   - Verify function signature consistency
   - Check for abandoned code

4. **Context Validation**
   - Cross-reference with git history
   - Verify intent-implementation alignment
   - Check for test coverage gaps

## Output Format
```json
{
  "scan_result": {
    "status": "stable|at-risk|collapse",
    "confidence": number,
    "summary": "Brief summary of findings"
  },
  "indicators": {
    "critical": [
      {
        "type": "broken_contract|orphaned_code|contradiction",
        "file": "path/to/file.ts",
        "line": number,
        "description": "Clear description",
        "impact": "severity"
      }
    ],
    "at_risk": [...],
    "observations": [...]
  },
  "recommendations": [
    {
      "priority": "immediate|soon|later",
      "action": "Specific action to take",
      "rationale": "Why this is important"
    }
  ],
  "context_health_score": {
    "overall": number,
    "architecture": number,
    "consistency": number,
    "completeness": number
  }
}
```

---
optimization_metadata:
  baseline_version: v1.0
  test_variations:
    - id: v1.1
      hypothesis: "Adding specific file patterns improves detection"
      changes: "Include file signature patterns for common frameworks"
      expected_improvement: "+10% detection rate"
    - id: v1.2
      hypothesis: "Weighting severity by git recency reduces noise"
      changes: "Add time-based severity weighting"
      expected_improvement: "-20% false positives"
  performance_metrics:
    accuracy: 0.87
    false_positives: 0.12
    last_evaluated: "2025-01-20"
---