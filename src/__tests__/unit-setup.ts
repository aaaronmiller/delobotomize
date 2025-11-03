// Unit tests can use shared test directory
import path from 'path';
import fs from 'fs/promises';

// Shared temp directory for unit tests
export const unitTestDir = path.join(__dirname, '..', 'temp');

beforeAll(async () => {
  // Ensure test temp directory exists
  await fs.mkdir(unitTestDir, { recursive: true });
});

afterEach(async () => {
  // Cleanup unit test artifacts
  try {
    const files = await fs.readdir(unitTestDir);
    await Promise.all(
      files.map(async file => {
        await fs.unlink(path.join(unitTestDir, file));
      })
    );
  } catch {
    // Ignore cleanup errors
  }
});