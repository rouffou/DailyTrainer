import type { Config } from 'jest';

// Separate from the root jest.config.ts (jest-preset-angular, jsdom): these tests talk
// to a real local Firestore emulator over the network and have nothing to do with Angular.
const config: Config = {
  displayName: 'firestore-rules',
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  testMatch: ['<rootDir>/**/*.spec.ts']
};

export default config;
