import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // REQUIRED by the NexDrop Theme Spec: themes are served from /t/<theme>/<version>/ and /s/<store>/
  base: './',
  resolve: {
    alias: {
      // In your own theme: `npm i @nexdrop/theme-sdk` and drop this alias.
      '@nexdrop/theme-sdk': fileURLToPath(new URL('../../packages/theme-sdk/src/index.tsx', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: { fs: { allow: ['..', '../..'] } },
  build: { outDir: 'dist', emptyOutDir: true, sourcemap: false },
})
