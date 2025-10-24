---
prompt_id: pattern-context-preservation
baseline_version: v1.0
author: Delobotomize Pattern Library
created: 2025-01-20
---

# Context Preservation Pattern

## Purpose
Maintain project intent and context across AI sessions to prevent context collapse.

## Problem Statement
AI models often lose track of project intent between sessions, leading to:
- Destructive "fixes" that break existing functionality
- Inconsistent architectural decisions
- Drift from original requirements

## Solution Pattern

### 1. Context Anchoring
```typescript
// Always include context anchors at the top of files
/**
 * @context This module handles user authentication
 * @intent Never store plain text passwords
 * @constraint Must use bcrypt for hashing
 * @dependency auth.service.ts
 */
```

### 2. Intent Preservation
```yaml
# project-intent.yaml
project:
  name: "User Management System"
  core_principles:
    - "Security first"
    - "Never expose user data"
    - "Audit all changes"
  anti_patterns:
    - "Direct database access"
    - "Plain text secrets"
    - "Skipping validation"
```

### 3. Session Memory
```typescript
// context-memory.ts
export const ContextMemory = {
  lastSession: {
    intent: "Add OAuth support",
    constraints: ["Don't break existing auth"],
    decisions: ["Use passport.js", "Maintain session compatibility"]
  },
  currentSession: {
    goal: "",
    constraints: [],
    decisions: []
  }
};
```

### 4. Change Validation
```typescript
// validate-change.ts
export function validateChange(
  change: CodeChange,
  context: ProjectContext
): ValidationResult {
  // Check against intent
  if (violatesIntent(change, context.intent)) {
    return { valid: false, reason: "Violates project intent" };
  }

  // Check constraints
  for (const constraint of context.constraints) {
    if (violatesConstraint(change, constraint)) {
      return { valid: false, reason: `Violates constraint: ${constraint}` };
    }
  }

  return { valid: true };
}
```

## Implementation Steps

1. **Create Context Anchors**
   - Add @context comments to all modules
   - Document intent and constraints
   - Link related modules

2. **Establish Intent Registry**
   - Create project-intent.yaml
   - Define core principles
   - List anti-patterns

3. **Build Session Memory**
   - Track decisions across sessions
   - Maintain change log
   - Preserve rationale

4. **Implement Validation Layer**
   - Check changes against intent
   - Validate constraints
   - Prevent destructive modifications

## Usage Examples

### Before (Context Collapse Risk)
```typescript
// auth.ts - No context
export function login(email: string, password: string) {
  // Direct DB query - security risk!
  const user = db.query(`SELECT * FROM users WHERE email = '${email}'`);
  return user;
}
```

### After (Context Preserved)
```typescript
/**
 * @context Handles user authentication
 * @intent Never expose user data, always use secure auth
 * @constraint Must use auth.service.ts, no direct DB access
 * @dependency auth.service.ts
 */
export async function login(email: string, password: string): Promise<User> {
  // Use auth service as required by context
  return authService.authenticate(email, password);
}
```

## Validation Checklist

- [ ] Context anchors present on all modules
- [ ] Intent documented and accessible
- [ ] Constraints clearly defined
- [ ] Session memory maintained
- [ ] Changes validated against context
- [ ] Anti-patterns flagged and prevented

## Anti-Patterns to Avoid

1. **Context Loss**
   ```typescript
   // Bad: No context, can drift
   export function fixAuth() { /* ... */ }
   ```

2. **Intent Violation**
   ```typescript
   // Bad: Violates "security first" principle
   export function bypassAuth() { /* ... */ }
   ```

3. **Constraint Ignoring**
   ```typescript
   // Bad: Direct DB when constraint says "use service"
   export function getUser(id: string) {
     return db.query(`SELECT * FROM users WHERE id = ${id}`);
   }
   ```

---
optimization_metadata:
  baseline_version: v1.0
  test_variations:
    - id: v1.1
      hypothesis: "Structured context format improves AI adherence"
      changes: "Add JSON schema for context anchors"
      expected_improvement: "+15% context preservation"
    - id: v1.2
      hypothesis: "Automated validation reduces violations"
      changes: "Add pre-commit hook for context validation"
      expected_improvement: "-90% context violations"
  performance_metrics:
    adherence_rate: 0.94
    violation_prevention: 0.89
    last_evaluated: "2025-01-20"
---