/// <reference types="vitest/config" />
import spiceflow from 'spiceflow/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  clearScreen: false,
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    pool: 'threads',
    exclude: ['**/dist/**', '**/esm/**', '**/node_modules/**', '**/e2e/**'],
    poolOptions: {
      threads: {
        isolate: false,
      },
    },
  },
  plugins: [
    spiceflow({
      entry: './src/main.tsx',
    }),
    react(),
    tailwindcss(),
  ],
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
