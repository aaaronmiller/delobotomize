module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    '${rootDir}/src/**/*.ts',
    '!${rootDir}/src/**/__tests__/**/*',
    '!${rootDir}/src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
  setupFilesAfterEnv: [['<rootDir>/src/__tests__/setup.ts']],
  maxWorkers: '50%',
  testTimeout: 30000,
  verbose: true,
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/__tests__/*.test.ts', '!<rootDir>/src/**/__tests__/*.e2e.test.ts'],
      setupFilesAfterEnv: [['<rootDir>/src/__tests__/unit-setup.ts']]
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/src/**/__tests__/*.e2e.test.ts'],
      setupFilesAfterEnv: [['<rootDir>/src/__tests__/e2e-setup.ts']],
      maxWorkers: 1
    }
  ]
};