import { showFailureToast } from 'termcast/src/apis/toast'
import { logger } from 'termcast/src/logger'
import { setupErrorHandlers } from '#platform/runtime'

let initialized = false

export function initializeErrorHandlers(): void {
  if (initialized) return
  initialized = true

  setupErrorHandlers((err, type) => {
    if (type === 'unhandledRejection') {
      logger.error('Unhandled rejection:', err)
      showFailureToast(err, {
        title: 'Unhandled Promise Rejection',
      }).catch((toastErr) => {
        logger.error('Failed to show toast for unhandled rejection:', toastErr)
      })
    } else if (type === 'uncaughtException') {
      logger.error('Uncaught exception:', err)
      showFailureToast(err, {
        title: 'Uncaught Exception',
      }).catch((toastErr) => {
        logger.error('Failed to show toast for uncaught exception:', toastErr)
      })
    } else {
      logger.error(`Uncaught exception from ${type}:`, err)
    }
  })
}
