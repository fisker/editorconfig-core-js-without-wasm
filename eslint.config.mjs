import base from '@cto.af/eslint-config';
import ts from '@cto.af/eslint-config/ts.js';

export default [
  {
    ignores: [
      'lib/**',
      '**/*.d.ts',
      'src/ini-simple-parser/**',
    ],
  },
  ...base,
  ...ts,
  {
    files: [
      'src/index.ts',
    ],
    rules: {
      // We are extra-careful with some inputs.
      '@typescript-eslint/no-unnecessary-type-conversion': 'off',
    },
  },
  {
    rules: {
      'n/no-unsupported-features/node-builtins': 'off',
      'n/file-extension-in-import': 'off',
    },
  },
];
