import { logger } from 'termcast/src/logger'

/**
 * @deprecated Use `useAI` from `@raycast/utils`
 *
 * This hook was an unstable AI interface that has been deprecated.
 * Users should use the `useAI` hook from `@raycast/utils` instead.
 * This implementation returns undefined to match the Raycast API behavior.
 */
export const useUnstableAI = (): undefined => {
  logger.warn(
    'useUnstableAI is deprecated. Use useAI from @raycast/utils instead',
  )
  return undefined
}
