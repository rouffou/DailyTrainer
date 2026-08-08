module.exports = {
  'src/**/*.ts': (files) => [
    `eslint --fix ${files.join(' ')}`,
    `prettier --write ${files.join(' ')}`,
    // ng test wants a comma-separated list, not one CLI arg per file (Angular CLI limitation)
    `ng test --watch=false --pass-with-no-tests --find-related-tests ${files.join(',')}`
  ],
  'src/**/*.html': (files) => `prettier --write ${files.join(' ')}`,
  '*.{css,scss,json,md}': (files) => `prettier --write ${files.join(' ')}`
};
