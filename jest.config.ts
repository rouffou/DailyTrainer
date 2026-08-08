import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  // firestore-tests/ and functions/ have their own separate Jest configs (Node, not jsdom;
  // no Angular TestBed) and must not be picked up by this one.
  roots: ['<rootDir>/src']
  // coverageThreshold on ./src/app/core/domain (100%, per STANDARDS.md section 5) is added
  // in issue #13 once the first file lands there — an empty-folder threshold fails Jest outright
  // ("Coverage data ... was not found"), so it can't be enabled before there's anything to cover.
};

export default config;
