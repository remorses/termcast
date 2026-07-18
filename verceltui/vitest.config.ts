import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.vitest.{ts,tsx}'],
    globals: true,
    environment: 'node',
    fileParallelism: true,
    hookTimeout: 20000,
    testTimeout: 30000,
  },
})
