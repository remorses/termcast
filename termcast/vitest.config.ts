import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Only run tests with .vitest.ts or .vitest.tsx suffix
    include: ['**/*.vitest.{ts,tsx}'],
    globals: true,
    environment: 'node',
  },
})
