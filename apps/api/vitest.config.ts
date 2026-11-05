import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          globalSetup: ['tests/integration/global-setup.ts'],
          setupFiles: ['tests/integration/setup.ts'],
          env: parseEnv(readFileSync('.env.test', 'utf8')),
          // All files share one database, so running them in parallel would let one
          // file's cleanup wipe data another file is still asserting on.
          fileParallelism: false,
        },
      },
    ],
  },
});
