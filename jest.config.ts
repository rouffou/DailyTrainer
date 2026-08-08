import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  // firestore-tests/ and functions/ have their own separate Jest configs (Node, not jsdom;
  // no Angular TestBed) and must not be picked up by this one.
  roots: ['<rootDir>/src'],
  // 100% coverage on core/domain, per STANDARDS.md section 5.
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
