import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2500,
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        sheet: resolve(import.meta.dirname, 'sheet.html'),
      },
    },
  },
  server: { host: true },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
} as never);
