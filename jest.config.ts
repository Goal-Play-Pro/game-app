import type { Config } from 'jest';
import os from 'node:os';

// Cap Jest workers to keep memory usage bounded in heavier suites.
const availableParallelism =
  typeof (os as any).availableParallelism === 'function'
    ? (os as any).availableParallelism()
    : os.cpus().length;
const MAX_WORKERS = Math.max(1, Math.floor(availableParallelism / 2));

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.spec.(ts|tsx)', '**/?(*.)+(spec|test).(ts|tsx)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        diagnostics: false,
      },
    ],
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  maxWorkers: MAX_WORKERS,
  workerIdleMemoryLimit: '1GB',
};

export default config;
