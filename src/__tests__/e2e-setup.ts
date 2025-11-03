import fs from 'fs/promises';
import path from 'path';

// E2E tests require careful cleanup to avoid race conditions
let e2eDirs: string[] = [];

beforeAll(async () => {
  // Increase timeout for E2E tests
  jest.setTimeout(60000); // 1 minute
});

afterEach(async () => {
  // Cleanup all created directories
  await Promise.all(
    e2eDirs.map(async dir => {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    })
  );
  e2eDirs = [];
});

afterAll(async () => {
  // Final cleanup
  for (const dir of e2eDirs) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});

// E2E specific utilities
export const e2eUtils = {
  // Register directory for cleanup
  async registerDir(dir: string): Promise<string> {
    e2eDirs.push(dir);
    return dir;
  },

  // Create E2E test environment
  async createProject(structure: { [file: string]: string }): Promise<{
    dir: string;
    cleanup: () => Promise<void>;
  }> {
    const os = require('os');
    const tempDir = path.join(os.tmpdir(), `delobotomize-e2e-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Create file structure
    for (const [filePath, content] of Object.entries(structure)) {
      const fullPath = path.join(tempDir, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
    }

    // Create .delobotomize directory
    await fs.mkdir(path.join(tempDir, '.delobotomize'), { recursive: true });

    return {
      dir: tempDir,
      cleanup: async () => {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch {
          // Ignore
        }
      }
    };
  },

  // Wait for file to appear
  async waitForFile(filePath: string, timeout: number = 5000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const stat = await fs.stat(filePath);
        if (stat.isFile()) return;
      } catch {
        // File doesn't exist yet
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`File ${filePath} did not appear within ${timeout}ms`);
  },

  // Wait for log entry to appear
  async waitForLog(
    logFile: string,
    predicate: (entry: any) => boolean,
    timeout: number = 10000
  ): Promise<any> {
    const start = Date.now();
    let lastLine = 0;

    while (Date.now() - start < timeout) {
      try {
        const content = await fs.readFile(logFile, 'utf-8');
        const logs = content.split('\n').slice(lastLine);
        const entries = logs.filter(line => line.trim()).map(line => JSON.parse(line));

        for (const entry of entries) {
          if (predicate(entry)) {
            return entry;
          }
          lastLine++;
        }
      } catch {
        // Log file not ready
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error('Log entry not found within timeout');
  }
};