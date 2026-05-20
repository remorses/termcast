/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { holocron } from '@holocron.so/vite'

export default defineConfig({
  plugins: [
    holocron({ entry: './src/server.tsx', pagesDir: './src/pages' }),
  ],
})
