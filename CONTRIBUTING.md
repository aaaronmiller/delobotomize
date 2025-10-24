# Contributing to Delobotomize

First off, thank you for considering contributing to Delobotomize! It's people like you that make this tool better for everyone dealing with AI-assisted development challenges.

## Code of Conduct

This project and everyone participating in it is governed by common sense and mutual respect. We expect all contributors to:

- Be respectful and inclusive
- Focus on what's best for the community
- Show empathy towards other community members
- Accept constructive criticism gracefully

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

**Bug Report Template:**

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Run command '...'
2. With these options '...'
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Environment:**
 - OS: [e.g. macOS 14.0]
 - Node version: [e.g. 18.17.0]
 - Delobotomize version: [e.g. 0.1.0]
 - LLM Provider: [e.g. OpenRouter, Anthropic]

**Additional context**
- Output of `delobotomize scan .`
- Relevant error logs
- Memory statistics if applicable
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful** to most Delobotomize users
- **List some examples** of where this enhancement could be applied

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Simple issues perfect for newcomers
- `help wanted` - Issues where we'd appreciate community help
- `documentation` - Improvements to docs always welcome

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Add tests** if you've added code that should be tested
4. **Update documentation** if you've changed APIs or behavior
5. **Ensure the build passes** (`npm run build`)
6. **Ensure tests pass** (`npm test`)
7. **Write a clear PR description** explaining what and why

**Pull Request Template:**

```markdown
## Description
Brief description of what this PR does.

## Motivation and Context
Why is this change needed? What problem does it solve?

## Related Issues
Fixes #(issue number)

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran to verify your changes.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
```

## Development Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- Git
- At least one LLM provider API key (OpenRouter, Anthropic, Gemini, OpenAI, or Cohere)

### Setup Steps

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR-USERNAME/delobotomize.git
cd delobotomize

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 4. Build the project
npm run build

# 5. Link for local testing
npm link

# 6. Verify installation
delobotomize --help
```

### Development Workflow

```bash
# Watch mode for TypeScript compilation
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Test locally
delobotomize self-test
```

## Project Structure

```
delobotomize/
├── src/
│   ├── cli/              # CLI commands
│   ├── core/             # Core functionality (scanner, detector)
│   ├── extractors/       # Phase 0 extraction logic
│   ├── analyzers/        # Analysis and pattern detection
│   ├── orchestration/    # Triage narrator, orchestrator
│   ├── workflows/        # Remediation workflows
│   ├── iteration/        # ROI scoring and optimization
│   ├── memory/           # Knowledge graph, vector store, MCP
│   └── llm/              # LLM provider abstraction
├── prompts/              # Externalized prompt library
├── config/               # Workflow configurations
├── tests/                # Test files
└── docs/                 # Documentation
```

## Coding Standards

### TypeScript Style Guide

- Use **TypeScript strict mode**
- Use **explicit types** for public APIs
- Use **interfaces** for object shapes
- Use **async/await** over callbacks
- Use **descriptive variable names**

**Example:**

```typescript
// Good
interface ScanResult {
  status: 'healthy' | 'at_risk' | 'collapsed';
  confidence: number;
  indicators: Indicator[];
}

async function scanProject(path: string): Promise<ScanResult> {
  // Implementation
}

// Avoid
async function scan(p: string): Promise<any> {
  // Implementation
}
```

### Naming Conventions

- **Classes:** PascalCase (`ContextManager`, `TriageNarrator`)
- **Interfaces:** PascalCase with 'I' prefix for core interfaces (`ILLMProvider`)
- **Functions:** camelCase (`scanProject`, `generateReport`)
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_MODELS`, `MAX_RETRIES`)
- **Files:** kebab-case (`context-manager.ts`, `triage-narrator.ts`)

### Comments and Documentation

- Use **JSDoc** for public APIs
- Explain **WHY**, not WHAT
- Document **edge cases** and **gotchas**
- Keep comments **up to date**

**Example:**

```typescript
/**
 * Generate embeddings using the configured LLM provider
 *
 * Falls back to deterministic pseudo-embedding if provider unavailable
 * or doesn't support embeddings (e.g., Anthropic).
 *
 * @param text - Text to embed
 * @returns Normalized embedding vector (dimension: 384)
 */
private async generateEmbedding(text: string): Promise<number[]> {
  // ...
}
```

### Error Handling

- Use **custom error classes** for domain errors
- Provide **helpful error messages**
- Don't swallow errors silently
- Log errors with context

**Example:**

```typescript
// Good
if (status === 401) {
  throw new AuthenticationError(
    `Authentication failed for ${provider}. Check your API key.`
  );
}

// Avoid
if (status === 401) {
  throw new Error('Auth failed');
}
```

## Testing Guidelines

### Writing Tests

- Write tests for **all new features**
- Write tests for **all bug fixes**
- Use **descriptive test names**
- Follow **AAA pattern** (Arrange, Act, Assert)

**Example:**

```typescript
describe('ContextManager', () => {
  describe('searchMemory', () => {
    it('should return top-K results sorted by similarity', async () => {
      // Arrange
      const manager = new ContextManager({ projectPath: '/test' });
      await manager.addToMemory({
        id: 'test-1',
        type: 'symptom',
        text: 'undefined variable error',
        metadata: { source: 'test' }
      });

      // Act
      const results = await manager.searchMemory('undefined error', { topK: 5 });

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].similarity).toBeGreaterThan(0.7);
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- context-manager.test.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Adding a New LLM Provider

To add support for a new LLM provider:

1. Create `src/llm/providers/your-provider.ts`
2. Implement the `ILLMProvider` interface
3. Handle both `complete()` and `embed()` methods
4. Add provider to factory in `src/llm/provider-interface.ts`
5. Update README.md with provider documentation
6. Add tests in `tests/llm/providers/your-provider.test.ts`

**Example:**

```typescript
export class YourProvider implements ILLMProvider {
  readonly name = 'your-provider';
  readonly supportsEmbeddings = true;

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    // Implementation
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    // Implementation
  }

  async testConnection(): Promise<boolean> {
    // Implementation
  }

  async getAvailableModels(): Promise<string[]> {
    // Implementation
  }
}
```

## Documentation

- Update **README.md** for user-facing changes
- Update **ARCHITECTURE.md** for architectural changes
- Add **examples** for new features
- Keep **inline documentation** current

## Git Commit Messages

- Use the **present tense** ("Add feature" not "Added feature")
- Use the **imperative mood** ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to **72 characters** or less
- Reference **issues and PRs** liberally

**Format:**

```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat: add Gemini provider support

Implement Google Gemini as a new LLM provider with both
completion and embedding capabilities. Includes API key
authentication and proper error handling.

Closes #42
```

```
fix: handle missing embeddings in Anthropic provider

Anthropic doesn't provide embeddings API. Updated to throw
helpful error message and suggest using OpenRouter as fallback.

Fixes #58
```

## Release Process

(For maintainers)

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release commit: `chore: release v0.2.0`
4. Tag release: `git tag v0.2.0`
5. Push tags: `git push --tags`
6. Publish to npm: `npm publish`
7. Create GitHub release with changelog

## Questions?

- **GitHub Discussions:** For questions and general discussion
- **GitHub Issues:** For bugs and feature requests
- **Documentation:** Check the [docs/](docs/) directory

## Recognition

Contributors are recognized in:
- GitHub contributors page
- CHANGELOG.md for significant contributions
- README.md acknowledgments section

---

Thank you for contributing to Delobotomize! Your efforts help developers everywhere maintain context and avoid AI-assisted disasters.
