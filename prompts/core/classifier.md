---
prompt_id: core-classifier
baseline_version: v1.0
author: Delobotomize Phase 0 Extraction
created: 2025-01-20
---

# Code Classification Prompt

## Purpose
Classify code patterns and identify potential context collapse scenarios.

## Context
You are analyzing a codebase for signs of context collapse syndrome where AI has lost track of project intent.

## Classification Categories

### 1. Stable Patterns
- Consistent naming conventions
- Clear separation of concerns
- Proper documentation
- Test coverage present

### 2. At-Risk Patterns
- Mixed architectural styles
- Inconsistent error handling
- Partial implementations
- TODO comments without closure

### 3. Collapse Indicators
- Duplicated functionality
- Contradictory implementations
- Orphaned code sections
- Breaking changes without migration

## Process

1. Scan the provided code
2. Identify patterns from each category
3. Assign confidence scores (0-100)
4. Flag critical issues requiring immediate attention

## Output Format
```json
{
  "classification": "stable|at-risk|collapse",
  "confidence": number,
  "issues": [
    {
      "type": "pattern|architecture|consistency",
      "severity": "low|medium|high|critical",
      "description": "Clear description",
      "location": "file:line"
    }
  ],
  "recommendations": [
    "Actionable recommendation"
  ]
}
```

---
optimization_metadata:
  baseline_version: v1.0
  test_variations:
    - id: v1.1
      hypothesis: "Adding specific examples improves classification accuracy"
      changes: "Add 3 classification examples for each category"
      expected_improvement: "+5% accuracy"
    - id: v1.2
      hypothesis: "Including severity thresholds reduces false positives"
      changes: "Add severity scoring rubric"
      expected_improvement: "-10% false positives"
  performance_metrics:
    accuracy: 0.85
    precision: 0.78
    recall: 0.92
    last_evaluated: "2025-01-20"
---