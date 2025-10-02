import { showFailureToast } from 'termcast/src/apis/toast'
import { logger } from 'termcast/src/logger'

let initialized = false

export function initializeErrorHandlers(): void {
  if (initialized) return
  initialized = true

  process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason))
    logger.error('Unhandled rejection:', err)
    showFailureToast(err, {
      title: 'Unhandled Promise Rejection',
    }).catch((toastErr) => {
      logger.error('Failed to show toast for unhandled rejection:', toastErr)
    })
  })

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err)
    showFailureToast(err, {
      title: 'Uncaught Exception',
    }).catch((toastErr) => {
      logger.error('Failed to show toast for uncaught exception:', toastErr)
    })
  })

  process.on('uncaughtExceptionMonitor', (err, origin) => {
    logger.error(`Uncaught exception from ${origin}:`, err)
  })
}
