import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  coverageThreshold: {
    './src/app/core/domain/**/*.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
};

export default config;
