import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@postforge/core': path.resolve(__dirname, './shared/index.ts'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
