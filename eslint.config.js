import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

const API_SRC = 'apps/api/src';

// Enforces the Clean Architecture dependency rule at lint time, so a wrong import
// fails CI instead of relying on code review to catch it.
const layerBoundaries = [
  {
    files: [`${API_SRC}/domain/**/*.ts`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['express', '@prisma/client', 'zod'],
          patterns: [
            {
              group: ['**/application/**', '**/infra/**', '**/config/**'],
              message: 'domain must not depend on outer layers.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [`${API_SRC}/application/**/*.ts`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['express', '@prisma/client'],
          patterns: [
            {
              group: ['**/infra/**', '**/config/**'],
              message: 'application may depend only on domain; declare a port instead.',
            },
          ],
        },
      ],
    },
  },
];

export default defineConfig(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      'apps/api/src/infra/database/generated/**',
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  ...layerBoundaries,
  {
    // Supertest response bodies are untyped by nature; in tests the assertions
    // themselves validate their shape, so these rules would only add casts.
    files: ['**/tests/**/*.ts', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  prettierConfig,
);
