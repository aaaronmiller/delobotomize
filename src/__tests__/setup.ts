import 'jest';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  // Suppress console.log in tests unless specifically needed
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore console
  Object.assign(console, originalConsole);
});

// Cleanup utilities
afterEach(async () => {
  // Clear all mocks
  jest.clearAllMocks();

  // Wait for any pending promises
  await new Promise(resolve => setTimeout(resolve, 100));
});

// Global test helpers
global.testUtils = {
  // Create temporary directory
  async createTempDir(): Promise<string> {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    const tempDir = path.join(os.tmpdir(), `delobotomize-test-${Date.now()}`);
    await fs.promises.mkdir(tempDir, { recursive: true });
    return tempDir;
  },

  // Cleanup temporary directory
  async cleanupTempDir(dir: string): Promise<void> {
    const fs = require('fs');
    try {
      await fs.promises.rm(dir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  },

  // Wait for async operations
  async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Create test file with content
  async createTestFile(dir: string, name: string, content: string): Promise<string> {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(dir, name);
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return filePath;
  },

  // Read JSON file safely
  async readJSON(filePath: string): Promise<any> {
    const fs = require('fs');
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }
};

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidLogFile(): R;
      toBeValidBackup(): R;
      toProduceValidNarrative(): R;
    }
  }
}

// Custom matchers
expect.extend({
  toBeValidLogFile(received) {
    try {
      expect(received).toBeInstanceOf(Array);
      expect(received.length).toBeGreaterThan(0);

      // Check log entry structure
      const entry = received[0];
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('operation');

      return {
        pass: true,
        message: () => 'Log file is valid'
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Invalid log file: ${error}`
      };
    }
  },

  toBeValidBackup(received) {
    try {
      expect(received).toHaveProperty('id');
      expect(received).toHaveProperty('timestamp');
      expect(received).toHaveProperty('files');
      expect(Array.isArray(received.files)).toBe(true);

      return {
        pass: true,
        message: () => 'Backup is valid'
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Invalid backup: ${error}`
      };
    }
  },

  toProduceValidNarrative(received) {
    try {
      expect(received).toHaveProperty('sections');
      expect(received).toHaveProperty('operations');
      expect(received).toHaveProperty('metrics');
      expect(received.sections).toHaveProperty('overview');
      expect(received.sections).toHaveProperty('issuesFound');

      return {
        pass: true,
        message: () => 'Narrative is valid'
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Invalid narrative: ${error}`
      };
    }
  }
});