// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const boundaries = require('eslint-plugin-boundaries');
const prettierConfig = require('eslint-config-prettier');

module.exports = tseslint.config(
  {
    // functions/ is a separate npm package with its own eslint.config.js, tsconfig.json, and
    // `npm run lint` (added in #17) — it must stay out of this config's file glob entirely.
    // Leaving it in only excludes functions/lib/** (build output) let typescript-eslint's
    // project service see two candidate tsconfigRootDirs (root and functions/) once functions/
    // had enough real files for the ambiguity to actually surface as a parsing error.
    ignores: ['dist/**', 'coverage/**', '.angular/**', 'functions/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
      prettierConfig,
    ],
    processor: angular.processInlineTemplates,
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        { type: 'shared', pattern: 'src/app/shared/**' },
        { type: 'core', pattern: 'src/app/core/**' },
        { type: 'features', pattern: 'src/app/features/*/**', capture: ['feature'] },
      ],
      'import/resolver': {
        typescript: { project: './tsconfig.app.json' },
      },
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'dt', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'dt', style: 'kebab-case' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            // shared/core may freely import within their own type (e.g. shared/ui -> shared/pipes)
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { type: 'shared' } } },
            },
            { from: { element: { type: 'core' } }, allow: { to: { element: { type: 'core' } } } },
            // a feature may use core, shared, and its own files, never another feature
            {
              from: { element: { type: 'features' } },
              allow: { to: { element: { types: { anyOf: ['core', 'shared'] } } } },
            },
            {
              from: { element: { type: 'features' } },
              allow: {
                to: { element: { type: 'features', captured: { feature: '{{from.feature}}' } } },
              },
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
);
