# Artifact #4 - validate-post-archive.cjs (Post-Archive Validator)

**Source:** ARTIFACTS.md (lines 2098-2377)
**Date:** 2025-10-15 19:45:00 PST
**Version:** 1.0.0
**Tags:** [validation, testing, post-archive, smoke-test, DIRECT-IMPLEMENTATION]

---

## Context Classification

**Primary Context:** **DIRECT IMPLEMENTATION** 🎯

**DataKiln-Specific:** Required files/dirs for Node.js/Vite project
**General Value:** 90% of this code is adaptable to ANY project type
**Delobotomize Use:** **This IS our `delobotomize validate` command**

---

## Executive Summary

**What This Is:**
- Post-archive smoke testing system
- Validates that project still works after archiving files
- 4 test categories: file structure, imports, build, server
- Pass/fail reporting with rollback instructions

**Direct Value:**
- 280 lines of production-ready validation code
- Pattern for testing import resolution
- Pattern for testing build processes
- Pattern for testing server startup

**Adaptation Required:**
- Generalize required files (currently hardcoded for DataKiln)
- Detect project type (Node.js, Python, Go, etc.)
- Make build commands configurable
- Add more generic validation checks (circular deps, type errors, etc.)

---

## CODE STRUCTURE ANALYSIS

### Class: PostArchiveValidator (Lines 2118-2377+)

**Structure:**
```javascript
class PostArchiveValidator {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  async validate() { /* Orchestrator */ }
  async testFileStructure() { /* Check required files exist */ }
  async testImports() { /* Verify imports resolve */ }
  async testBuild() { /* Run build command */ }
  async testServer() { /* Test server startup */ }
  async generateReport() { /* Create markdown report */ }

  // Helpers
  pass(message) { /* Log success */ }
  fail(message) { /* Log failure */ }
  warn(message) { /* Log warning */ }
}
```

---

## VALIDATION TESTS BREAKDOWN

### Test 1: File Structure (Lines 2155-2191)

**Current Implementation:**
```javascript
async testFileStructure() {
  const requiredFiles = [
    'package.json',
    'server.cjs',
    'vite.config.ts',
    'tsconfig.json'
  ];

  for (const file of requiredFiles) {
    try {
      await fs.access(file);
      this.pass(`File exists: ${file}`);
    } catch {
      this.fail(`Missing required file: ${file}`);
    }
  }

  const requiredDirs = ['src', 'scripts'];
  // ... similar checks
}
```

**DataKiln-Specific Elements:**
- ❌ Hardcoded file list (package.json, server.cjs, vite.config.ts, tsconfig.json)
- ❌ Hardcoded directory list (src, scripts)

**Delobotomize Enhancement:**
```javascript
async testFileStructure() {
  // Auto-detect project type
  const projectType = await this.detectProjectType();

  // Get required files based on type
  const requiredFiles = this.getRequiredFiles(projectType);

  for (const file of requiredFiles) {
    try {
      await fs.access(file);
      this.pass(`File exists: ${file}`);
    } catch {
      this.fail(`Missing required file: ${file}`);
    }
  }
}

detectProjectType() {
  const checks = [
    { file: 'package.json', type: 'nodejs' },
    { file: 'pyproject.toml', type: 'python' },
    { file: 'go.mod', type: 'go' },
    { file: 'Cargo.toml', type: 'rust' }
  ];

  for (const { file, type } of checks) {
    if (fs.existsSync(file)) return type;
  }

  return 'unknown';
}

getRequiredFiles(projectType) {
  const requirements = {
    nodejs: [
      'package.json',
      // Detect framework-specific files
      ...(fs.existsSync('vite.config.ts') ? ['vite.config.ts'] : []),
      ...(fs.existsSync('server.cjs') ? ['server.cjs'] : []),
      ...(fs.existsSync('tsconfig.json') ? ['tsconfig.json'] : [])
    ],
    python: ['pyproject.toml', 'requirements.txt', 'setup.py'],
    go: ['go.mod', 'main.go'],
    rust: ['Cargo.toml', 'src/main.rs']
  };

  return requirements[projectType] || [];
}
```

---

### Test 2: Import Resolution (Lines 2193-2227)

**Current Implementation:**
```javascript
async testImports() {
  // Test server.cjs imports
  const serverContent = await fs.readFile('server.cjs', 'utf-8');
  const imports = this.extractRequires(serverContent);

  for (const imp of imports) {
    if (imp.startsWith('.')) {
      const resolved = path.resolve(path.dirname('server.cjs'), imp);
      try {
        await fs.access(resolved);
        this.pass(`Import resolves: ${imp}`);
      } catch {
        // Try with extensions
        let found = false;
        for (const ext of ['.js', '.cjs', '.ts']) {
          try {
            await fs.access(resolved + ext);
            this.pass(`Import resolves: ${imp}${ext}`);
            found = true;
            break;
          } catch {}
        }
        if (!found) {
          this.fail(`Import missing: ${imp} (from server.cjs)`);
        }
      }
    }
  }
}
```

**DataKiln-Specific Elements:**
- ❌ Hardcoded to check `server.cjs` only
- ✅ Extension resolution logic is generic

**Delobotomize Enhancement:**
```javascript
async testImports() {
  console.log('\n📦 Testing import resolution...');

  // Get all entry points (not just server.cjs)
  const entryPoints = await this.detectEntryPoints();

  for (const entryPoint of entryPoints) {
    const content = await fs.readFile(entryPoint, 'utf-8');
    const ext = path.extname(entryPoint);

    // Extract imports based on file type
    const imports = this.extractImports(content, ext);

    for (const imp of imports) {
      if (this.isLocalImport(imp)) {
        const resolved = this.resolveImport(imp, entryPoint, ext);

        if (await this.fileExists(resolved)) {
          this.pass(`Import resolves: ${imp} → ${resolved}`);
        } else {
          this.fail(`Import missing: ${imp} (from ${entryPoint})`);
        }
      }
    }
  }
}

async detectEntryPoints() {
  const candidates = [
    'server.cjs', 'server.js', 'app.js', 'index.js', 'main.js', // Node.js
    'main.py', 'app.py', '__init__.py', // Python
    'main.go', 'cmd/*/main.go', // Go
    'src/main.rs', // Rust
  ];

  const entryPoints = [];
  for (const candidate of candidates) {
    if (await this.fileExists(candidate)) {
      entryPoints.push(candidate);
    }
  }

  return entryPoints;
}

extractImports(content, ext) {
  if (['.js', '.cjs', '.ts', '.tsx', '.jsx'].includes(ext)) {
    return this.extractJSImports(content); // ES6 + CJS
  } else if (ext === '.py') {
    return this.extractPythonImports(content);
  } else if (ext === '.go') {
    return this.extractGoImports(content);
  }
  return [];
}

extractJSImports(content) {
  const imports = [];

  // ES6 imports
  const es6Pattern = /import\s+.*?from\s+['"](.+?)['"]/g;
  let match;
  while ((match = es6Pattern.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // CommonJS requires
  const cjsPattern = /require\s*\(['"](.+?)['"]\)/g;
  while ((match = cjsPattern.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

isLocalImport(imp) {
  return imp.startsWith('.') || imp.startsWith('/');
}

async resolveImport(imp, fromFile, ext) {
  const dir = path.dirname(fromFile);
  let resolved = path.normalize(path.join(dir, imp));

  // Try with various extensions
  const extensions = {
    '.js': ['.js', '.cjs', '.mjs', '.ts', '.tsx', '.jsx'],
    '.py': ['.py'],
    '.go': ['.go']
  }[ext] || [ext];

  for (const tryExt of extensions) {
    const withExt = resolved + tryExt;
    if (await this.fileExists(withExt)) {
      return withExt;
    }
  }

  return resolved;
}

async fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
```

---

### Test 3: Build Process (Lines 2229-2255)

**Current Implementation:**
```javascript
async testBuild() {
  console.log('\n🔨 Testing build process...');

  try {
    console.log('   Running: pnpm build');
    const buildResult = await this.runCommand('pnpm', ['build']);

    if (buildResult.code === 0) {
      this.pass('Build completed successfully');

      // Check if dist exists
      try {
        const distStat = await fs.stat('dist');
        if (distStat.isDirectory()) {
          this.pass('dist/ directory created');
        }
      } catch {
        this.warn('dist/ directory not found after build');
      }
    } else {
      this.fail(`Build failed with code ${buildResult.code}`);
      console.log('   Build errors:', buildResult.stderr);
    }
  } catch (error) {
    this.fail(`Build test failed: ${error.message}`);
  }
}
```

**DataKiln-Specific Elements:**
- ❌ Hardcoded to `pnpm build`
- ❌ Hardcoded expectation of `dist/` directory

**Delobotomize Enhancement:**
```javascript
async testBuild() {
  console.log('\n🔨 Testing build process...');

  const buildConfig = await this.detectBuildConfig();

  if (!buildConfig) {
    this.warn('No build command detected - skipping build test');
    return;
  }

  try {
    console.log(`   Running: ${buildConfig.command} ${buildConfig.args.join(' ')}`);
    const buildResult = await this.runCommand(buildConfig.command, buildConfig.args);

    if (buildResult.code === 0) {
      this.pass('Build completed successfully');

      // Check output directory
      if (buildConfig.outputDir) {
        try {
          const stat = await fs.stat(buildConfig.outputDir);
          if (stat.isDirectory()) {
            this.pass(`${buildConfig.outputDir}/ directory created`);
          }
        } catch {
          this.warn(`${buildConfig.outputDir}/ directory not found after build`);
        }
      }
    } else {
      this.fail(`Build failed with code ${buildResult.code}`);
      if (buildResult.stderr) {
        console.log('   Build errors:', buildResult.stderr);
      }
    }
  } catch (error) {
    this.fail(`Build test failed: ${error.message}`);
  }
}

async detectBuildConfig() {
  // Node.js projects
  if (await this.fileExists('package.json')) {
    const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));

    if (pkg.scripts?.build) {
      const packageManager = await this.detectPackageManager();
      return {
        command: packageManager,
        args: ['build'],
        outputDir: 'dist' // Common default
      };
    }
  }

  // Python projects
  if (await this.fileExists('setup.py')) {
    return {
      command: 'python',
      args: ['setup.py', 'build'],
      outputDir: 'build'
    };
  }

  // Go projects
  if (await this.fileExists('go.mod')) {
    return {
      command: 'go',
      args: ['build', './...'],
      outputDir: null // Go builds binaries, not dirs
    };
  }

  // Rust projects
  if (await this.fileExists('Cargo.toml')) {
    return {
      command: 'cargo',
      args: ['build'],
      outputDir: 'target'
    };
  }

  return null;
}

async detectPackageManager() {
  if (await this.fileExists('pnpm-lock.yaml')) return 'pnpm';
  if (await this.fileExists('yarn.lock')) return 'yarn';
  if (await this.fileExists('package-lock.json')) return 'npm';
  return 'npm'; // Default
}
```

---

### Test 4: Server Startup (Lines 2257-2296)

**Current Implementation:**
```javascript
async testServer() {
  console.log('\n🚀 Testing server startup...');

  try {
    console.log('   Attempting to start server (will auto-kill after 5s)');

    const serverProc = spawn('node', ['server.cjs'], {
      stdio: 'pipe',
      env: { ...process.env, PORT: '3001' } // Use different port for testing
    });

    let serverOutput = '';
    let serverError = '';

    serverProc.stdout.on('data', data => {
      serverOutput += data.toString();
    });

    serverProc.stderr.on('data', data => {
      serverError += data.toString();
    });

    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Kill server
    serverProc.kill();

    if (serverOutput.includes('Server running') || serverOutput.includes('listening')) {
      this.pass('Server started successfully');
    } else if (serverError) {
      this.fail(`Server startup error: ${serverError}`);
    } else {
      this.warn('Server startup unclear - no explicit success message');
    }

  } catch (error) {
    this.fail(`Server test failed: ${error.message}`);
  }
}
```

**DataKiln-Specific Elements:**
- ❌ Hardcoded to `node server.cjs`
- ❌ Hardcoded success patterns ('Server running', 'listening')
- ✅ Port override (PORT=3001) is smart
- ✅ 5-second timeout is reasonable

**Delobotomize Enhancement:**
```javascript
async testServer() {
  console.log('\n🚀 Testing server startup...');

  const serverConfig = await this.detectServerConfig();

  if (!serverConfig) {
    this.warn('No server entry point detected - skipping server test');
    return;
  }

  try {
    console.log(`   Attempting to start server (will auto-kill after ${serverConfig.timeout}ms)`);

    const serverProc = spawn(serverConfig.command, serverConfig.args, {
      stdio: 'pipe',
      env: { ...process.env, ...serverConfig.env }
    });

    let serverOutput = '';
    let serverError = '';

    serverProc.stdout.on('data', data => {
      serverOutput += data.toString();
    });

    serverProc.stderr.on('data', data => {
      serverError += data.toString();
    });

    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, serverConfig.timeout));

    // Kill server gracefully
    serverProc.kill('SIGTERM');

    // Check output for success patterns
    const success = serverConfig.successPatterns.some(pattern =>
      pattern.test(serverOutput)
    );

    if (success) {
      this.pass('Server started successfully');
    } else if (serverError) {
      this.fail(`Server startup error: ${serverError}`);
    } else {
      this.warn('Server startup unclear - no explicit success message');
    }

  } catch (error) {
    this.fail(`Server test failed: ${error.message}`);
  }
}

async detectServerConfig() {
  // Node.js server
  const nodeServers = ['server.cjs', 'server.js', 'app.js', 'index.js'];
  for (const server of nodeServers) {
    if (await this.fileExists(server)) {
      return {
        command: 'node',
        args: [server],
        env: { PORT: '3001' }, // Use test port
        timeout: 5000,
        successPatterns: [
          /server.*running/i,
          /listening.*port/i,
          /started.*port/i
        ]
      };
    }
  }

  // Python server
  if (await this.fileExists('app.py')) {
    return {
      command: 'python',
      args: ['app.py'],
      env: { PORT: '3001' },
      timeout: 5000,
      successPatterns: [/running/i, /serving/i]
    };
  }

  // Go server
  if (await this.fileExists('main.go')) {
    return {
      command: 'go',
      args: ['run', 'main.go'],
      env: { PORT: '3001' },
      timeout: 7000, // Go builds before running
      successPatterns: [/listening/i, /serving/i]
    };
  }

  return null;
}
```

---

## REPORT GENERATION (Lines 2298-2361)

**Current Implementation:**
```javascript
async generateReport() {
  const report = `# Post-Archive Validation Report
*Generated: ${new Date().toISOString()}*

## Summary

- **Total Tests:** ${this.results.passed.length + this.results.failed.length}
- **Passed:** ${this.results.passed.length}
- **Failed:** ${this.results.failed.length}
- **Warnings:** ${this.results.warnings.length}
- **Pass Rate:** ${passRate}%

## Results

### ✅ Passed Tests (${this.results.passed.length})
${this.results.passed.map(t => `- ✅ ${t}`).join('\n')}

### ❌ Failed Tests (${this.results.failed.length})
${this.results.failed.length > 0 ? this.results.failed.map(t => `- ❌ ${t}`).join('\n') : '*None*'}

### ⚠️ Warnings (${this.results.warnings.length})
${this.results.warnings.length > 0 ? this.results.warnings.map(t => `- ⚠️ ${t}`).join('\n') : '*None*'}

---

## Next Steps
...rollback instructions...
  `;

  await fs.writeFile(
    path.join('audit-reports', 'validation-report.md'),
    report
  );
}
```

**Generic Elements (KEEP):**
- ✅ Summary stats (total, passed, failed, warnings, pass rate)
- ✅ Categorized results with emoji markers
- ✅ Next steps based on pass/fail status
- ✅ Rollback instructions for failed validation

**Delobotomize Enhancement:**
```javascript
async generateReport() {
  // ... existing markdown report ...

  // NEW: Also generate JSON for MCP integration
  await this.generateMCPExport();
}

async generateMCPExport() {
  const mcpData = {
    timestamp: new Date().toISOString(),
    validation: {
      totalTests: this.results.passed.length + this.results.failed.length,
      passed: this.results.passed.length,
      failed: this.results.failed.length,
      warnings: this.results.warnings.length,
      passRate: (this.results.passed.length / (this.results.passed.length + this.results.failed.length) * 100).toFixed(1)
    },
    results: {
      passed: this.results.passed,
      failed: this.results.failed,
      warnings: this.results.warnings
    },
    status: this.results.failed.length === 0 ? 'PASS' : 'FAIL'
  };

  await fs.writeFile(
    path.join('.delobotomize', 'validation-results.json'),
    JSON.stringify(mcpData, null, 2)
  );
  console.log('✅ MCP export saved to: .delobotomize/validation-results.json');
}
```

---

## HELPER METHODS (Lines 2363-2377+)

**Implemented:**
```javascript
pass(message) {
  console.log(`   ✅ ${message}`);
  this.results.passed.push(message);
}

fail(message) {
  console.log(`   ❌ ${message}`);
  this.results.failed.push(message);
}

warn(message) {
  console.log(`   ⚠️  ${message}`);
  this.results.warnings.push(message);
}
```

**Missing (likely in original):**
```javascript
extractRequires(content) {
  const requires = [];
  const pattern = /require\s*\(['"](.+?)['"]\)/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    requires.push(match[1]);
  }
  return requires;
}

runCommand(command, args) {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { stdio: 'pipe' });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', data => stdout += data.toString());
    proc.stderr.on('data', data => stderr += data.toString());

    proc.on('close', code => {
      resolve({ code, stdout, stderr });
    });
  });
}
```

---

## DELOBOTOMIZE INTEGRATION PLAN

### Phase 1: Direct Adoption (Week 6)
1. Copy `PostArchiveValidator` class to `src/core/validator.ts`
2. Convert from CommonJS to ESM
3. Add TypeScript types
4. Remove DataKiln hardcoded values

### Phase 2: Generalization (Week 7)
1. Add project type detection
2. Make build commands configurable
3. Add multi-language support
4. Add customizable validation rules

### Phase 3: Enhanced Validation (Week 8)
1. Add circular dependency detection
2. Add type error checking
3. Add security vulnerability scanning
4. Add performance regression tests

---

## VALIDATION RULES FOR DELOBOTOMIZE

```yaml
# .delobotomize/validation.yaml

validation_tests:
  file_structure:
    enabled: true
    auto_detect_required_files: true

  import_resolution:
    enabled: true
    check_all_files: true # Not just entry points
    fail_on_missing: true

  build_process:
    enabled: true
    auto_detect_build_command: true
    timeout_ms: 120000 # 2 minutes
    fail_on_warnings: false # Only fail on errors

  server_startup:
    enabled: false # Optional test
    timeout_ms: 5000
    test_port: 3001

  custom_tests:
    - name: "Circular dependency check"
      command: "madge --circular src/"
      expect_exit_code: 0

    - name: "TypeScript type check"
      command: "tsc --noEmit"
      expect_exit_code: 0

    - name: "Security audit"
      command: "npm audit --audit-level=high"
      expect_exit_code: 0
```

---

## TEMPLATES FOR DIRECT USE

### Template 1: Minimal Validator
```javascript
// scripts/validate.js - Minimal post-archive validation

import { PostArchiveValidator } from '../src/core/validator.js';

async function validate() {
  const validator = new PostArchiveValidator({
    projectType: await detectProjectType(),
    strictMode: false // Warnings don't fail validation
  });

  await validator.validate();
}

validate();
```

---

### Template 2: Custom Validation Test
```javascript
// Add custom test to validator

validator.addCustomTest({
  name: 'API endpoints respond',
  async test() {
    const response = await fetch('http://localhost:3000/health');
    if (response.ok) {
      this.pass('API health check passed');
    } else {
      this.fail(`API returned ${response.status}`);
    }
  }
});
```

---

### Template 3: CI Integration
```yaml
# .github/workflows/validate.yml

name: Post-Archive Validation

on:
  push:
    branches: [archive-*]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: node scripts/validate-post-archive.cjs
      - name: Upload validation report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: validation-report
          path: audit-reports/validation-report.md
```

---

## RAG/MCP CHUNKING STRATEGY

```json
{
  "chunks": [
    {
      "id": "validator-overview",
      "content": "PostArchiveValidator class for smoke testing after archival",
      "metadata": {
        "artifact": "artifact-04",
        "type": "DIRECT_IMPLEMENTATION",
        "tests": ["file_structure", "imports", "build", "server"]
      }
    },
    {
      "id": "import-resolution-test",
      "content": "Validate all local imports resolve to existing files",
      "metadata": {
        "artifact": "artifact-04",
        "type": "VALIDATION_PATTERN",
        "applicable_to": "ANY_PROJECT"
      }
    },
    {
      "id": "build-validation-test",
      "content": "Run build command and verify success",
      "metadata": {
        "artifact": "artifact-04",
        "type": "VALIDATION_PATTERN",
        "detects": "broken_builds"
      }
    },
    {
      "id": "server-startup-test",
      "content": "Start server, check for success patterns, kill after timeout",
      "metadata": {
        "artifact": "artifact-04",
        "type": "VALIDATION_PATTERN",
        "safety": "uses test port, kills after timeout"
      }
    }
  ]
}
```

---

## KEY TAKEAWAYS

### What to Keep (90% of the code)
1. ✅ **All validation test structure** - 4 test categories
2. ✅ **Import resolution logic** - extension resolution
3. ✅ **Build testing pattern** - run command, check exit code
4. ✅ **Server startup pattern** - spawn, timeout, kill
5. ✅ **Report generation** - markdown with pass/fail/warn
6. ✅ **Helper methods** - pass(), fail(), warn()

### What to Remove (10%)
1. ❌ Hardcoded file list (package.json, server.cjs, etc.)
2. ❌ Hardcoded `pnpm build` command
3. ❌ Hardcoded server patterns

### What to Add
1. ➕ Project type detection (Node.js, Python, Go, Rust)
2. ➕ Auto-detect build commands
3. ➕ Auto-detect entry points
4. ➕ Custom validation rules (circular deps, type errors)
5. ➕ MCP JSON export format
6. ➕ CI integration templates

---

## NEXT STEPS

1. Extract Artifact #5 (Implementation Checklist) - recovery phases
2. Extract Artifact #6 (Project Codification) - workflow
3. Update ARTIFACTS_ASSESSMENT_TRACKER.md
4. Create integration plan for artifacts #3 and #4

---

*End of Artifact #4 Analysis*
*Key Takeaway: 90% of this code is production-ready for validation phase!*
*Next: Artifact #5 (Implementation Checklist - Mixed Context)*
