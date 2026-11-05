import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Same origin for the browser: the dev server forwards API calls, so the API needs no CORS.
    proxy: { '/api': 'http://localhost:3333' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    unstubGlobals: true,
  },
});
