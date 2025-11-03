#!/usr/bin/env node

/**
 * Stable test runner that prevents race conditions
 * Usage: node scripts/test-stable.js [--unit|--e2e|--all]
 */

const { execSync } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`  ${title}`, 'bright');
  log(`${'='.repeat(60)}\n`, 'blue');
}

function runTest(command, description) {
  logSection(`Running ${description}`);

  const startTime = Date.now();
  let success = false;

  try {
    // Use runInBand to prevent race conditions
    const output = execSync(`${command} --runInBand --silent=false`, {
      encoding: 'utf-8',
      stdio: 'inherit',
      timeout: 300000 // 5 minutes
    });
    success = true;
  } catch (error) {
    if (error.status) {
      log(`Tests failed with exit code: ${error.status}`, 'red');
    } else {
      log(`Tests failed with error: ${error.message}`, 'red');
    }
    process.exit(error.status || 1);
  }

  const duration = Date.now() - startTime;
  log(`✓ Completed in ${Math.floor(duration / 1000)}s\n`, 'green');

  return success;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    log('Usage: node scripts/test-stable.js [--unit|--e2e|--all]', 'yellow');
    process.exit(1);
  }

  // Clean any existing artifacts
  logSection('Cleaning up test artifacts');
  try {
    execSync('rm -rf coverage .nyc_output temp .delobotomize', {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    log('✓ Cleaned up', 'green');
  } catch {
    log('No artifacts to clean', 'yellow');
  }

  // Install dependencies if needed
  logSection('Checking dependencies');
  try {
    execSync('node --version && npm --version', { stdio: 'pipe' });
    log('✓ Dependencies available', 'green');
  } catch {
    log('✗ Node.js or npm not found', 'red');
    process.exit(1);
  }

  // Determine which tests to run
  const isUnit = args.includes('--unit');
  const isE2E = args.includes('--e2e');
  const isAll = args.includes('--all');

  // Run Unit Tests
  if (isUnit || isAll) {
    runTest(
      'npx jest --testPathPattern=unit --maxWorkers=50%',
      'Unit Tests (Fast Parallel)'
    );
  }

  // Run E2E Tests
  if (isE2E || isAll) {
    // Wait a moment between test runs to prevent file handle conflicts
    log('Waiting 2 seconds to prevent file handle conflicts...', 'yellow');
    setTimeout(() => {}, 2000);

    runTest(
      'npx jest --testPathPattern=e2e --maxWorkers=1',
      'E2E Tests (Sequential for Stability)'
    );
  }

  // Run coverage if all tests
  if (isAll) {
    logSection('Generating Coverage Report');
    runTest(
      'npx jest --coverage --coverageReporters=lcov',
      'Coverage Report'
    );

    log('\nCoverage report generated in coverage/lcov.info', 'blue');
    log('View HTML report: open coverage/lcov-report/index.html', 'yellow');
  }

  logSection('Summary');
  log('✓ All tests completed successfully', 'green');
  log('🚀 Ready for deployment', 'magenta');
}

// Kill process on SIGINT to prevent orphaned processes
process.on('SIGINT', () => {
  log('\n⚡ Received SIGINT, exiting...', 'yellow');
  process.exit(130);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`\n💥 Uncaught exception: ${error.message}`, 'red');
  process.exit(1);
});

main();