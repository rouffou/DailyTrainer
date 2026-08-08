import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  // firestore-tests/ and functions/ have their own separate Jest configs (Node, not jsdom;
  // no Angular TestBed) and must not be picked up by this one.
  roots: ['<rootDir>/src'],
  // jest-preset-angular's own default (which this necessarily replaces, not merges — Jest takes
  // the last transformIgnorePatterns wholesale) already carves out `*.mjs` and Angular's locale
  // files; @swimlane/ngx-charts and its d3-*/internmap dependencies ship ESM-only `.js` (not
  // `.mjs`) with no CJS build, so they need their own carve-out added alongside the original two.
  transformIgnorePatterns: [
    'node_modules/(?!(?:.*\\.mjs$|@angular/common/locales/.*\\.js$|@swimlane/.*|d3-.*|internmap/.*))',
  ],
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
