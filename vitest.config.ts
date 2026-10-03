import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: [
      'shared/**/*.test.ts',
      'server/src/**/*.test.ts',
      'src/**/*.test.{ts,tsx}',
    ],
    // Node for the core + backend, a DOM for the React studio.
    environmentMatchGlobs: [
      ['src/**', 'happy-dom'],
      ['shared/**', 'node'],
      ['server/**', 'node'],
    ],
    setupFiles: ['src/test-setup.ts'],
  },
  resolve: {
    alias: {
      '@postforge/core': path.resolve(__dirname, 'shared/index.ts'),
    },
  },
});
