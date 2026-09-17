import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['shared/**/*.test.ts', 'server/src/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@postforge/core': path.resolve(__dirname, 'shared/index.ts'),
    },
  },
});
