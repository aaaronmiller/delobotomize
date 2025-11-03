'use strict';

import { AuditNarrator } from '../services/audit-narrator';
import { OperationLogger } from '../services/operation-logger';
import { CrossFileAnalyzer } from '../services/cross-file-analyzer';
import { SpecGenerator } from '../services/spec-generator-simple';
import path from 'path';

describe('System Integration - Living Document Persistence', () => {
  let testProject: string;
  let auditNarrator: AuditNarrator;
  let operationLogger: OperationLogger;

  beforeEach(async () => {
    // Create test project
    testProject = path.join(__dirname, '..', 'temp', 'integration-test');
    await fs.promises.rm(testProject, { recursive: true, force: true });
    await fs.promises.mkdir(testProject, { recursive: true });

    // Initialize components
    auditNarrator = new AuditNarrator(testProject, 'test-session');
    operationLogger = new OperationLogger(testProject, 'test-session');
    const analyzer = new CrossFileAnalyzer(null); // Mock LLM
    const specGen = new SpecGenerator(null);

    // Create test files
    await fs.promises.writeFile(
      path.join(testProject, 'package.json'),
      JSON.stringify({ name: 'test-project', files: ['src'] }, null, 2)
    );

    await fs.promises.mkdir(path.join(testProject, 'src'));
  });

  afterEach(async () => {
    // Cleanup
    await auditNarrator.cleanup();
    await operationLogger.cleanup();
    await fs.promises.rm(testProject, { recursive: true, force: true });
  });

  test('should persist narrative across instances', async () => {
    // Add chunk to first instance
    await auditNarrator.addChunk({
      type: 'issue_found',
      content: 'Test issue persistence',
      data: { issue: 'memory-leak', severity: 'high' }
    });

    // Get current narrative
    const narrative1 = auditNarrator.getCurrentNarrative();

    // Create new instance and load
    const auditNarrator2 = new AuditNarrator(testProject, 'test-session');
    const narrative2 = auditNarrator2.getCurrentNarrative();

    // Both should have the test issue
    expect(narrative1.sections.issueFound).toContainEqual(
      expect.objectContaining({ type: 'memory-leak', severity: 'high', status: 'identified' })
    );
    expect(narrative2.sections.issueFound).toContainEqual(
      expect.objectContaining({ type: 'memory-leak', severity: 'high', status: 'identified' })
    );
  });

  test('should track operations for undo capability', async () => {
    // Log a file operation
    await operationLogger.logFile({
      operation: 'file.write',
      target: 'test.txt',
      before: 'original content',
      after: 'modified content',
      result: 'success'
    });

    // Get operation history
    const history = await operationLogger.getOperationHistory('test-session');

    // Should have the operation with undoable=true
    expect(history.some(op => op.operation === 'file.write' && op.undoable)).toBe(true);
  });

  test('should generate valid context.md specification', async () => {
    await specGen.generateSpecs(testProject, [], {});

    const specs = await specGen.detectExistingSpecs(testProject);
    expect(specs.format).toBe('speckit');
  });

  test('should handle cross-file dependencies', async () => {
    const mockAnalysis = {
      'file1.ts': { issues: [{ type: 'missing_import', file: 'file2.ts' }] },
      'file2.ts': { issues: [{ type: 'missing-export', file: 'file1.ts' }] }
    };

    const result = await analyzer.analyze(Object.values(mockAnalysis), {});

    expect(result.rootCauses).toContainEqual(
      expect.objectContaining({
        type: 'incomplete_refactor',
        affectedFiles: ['file1.ts', 'file2.ts'],
        description: expect.stringContaining('import statements need updating')
      })
    );
  });
});