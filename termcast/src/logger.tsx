import {
  joinPath,
  cwd,
  unlinkIfExists,
  appendToFile,
  inspectValue,
  getEnv,
  exit,
  setupErrorHandlers,
} from '#platform/runtime'
import { useEffect } from 'react'

const LOG_FILE = joinPath(cwd(), 'app.log')

// Delete log file on process start
unlinkIfExists(LOG_FILE)

function serialize(msg: any): string {
  if (msg instanceof Error) {
    return `${msg.message}\n${msg.stack}`
  }
  if (typeof msg === 'string') {
    return msg
  }
  return inspectValue(msg, 3)
}

export const logger = {
  log: (...messages: any[]) => {
    const timestamp = new Date().toISOString()
    const formattedMessages = messages.map(serialize).join(' ')
    const logEntry = `[${timestamp}] ${formattedMessages}\n`
    appendToFile(LOG_FILE, logEntry)
    console.log(...messages)
  },
  error: (...messages: any[]) => {
    const timestamp = new Date().toISOString()
    const formattedMessages = messages.map(serialize).join(' ')
    const logEntry = `[${timestamp}] ERROR: ${formattedMessages}\n`
    appendToFile(LOG_FILE, logEntry)
    console.error(...messages)
  },
  warn: (...messages: any[]) => {
    const timestamp = new Date().toISOString()
    const formattedMessages = messages.map(serialize).join(' ')
    const logEntry = `[${timestamp}] WARN: ${formattedMessages}\n`
    appendToFile(LOG_FILE, logEntry)
    console.warn(...messages)
  },
  trace: (...messages: any[]) => {
    const timestamp = new Date().toISOString()
    let stack: string = ''
    try {
      throw new Error()
    } catch (err: any) {
      if (err instanceof Error && err.stack) {
        stack = err.stack.split('\n').slice(2).join('\n')
      }
    }
    const formattedMessages = messages.map(serialize).join(' ')
    const logEntry = `[${timestamp}] TRACE: ${formattedMessages}\n${stack}\n`
    appendToFile(LOG_FILE, logEntry)
    console.trace(...messages)
  },
}

// Catch unhandled errors and exceptions
setupErrorHandlers((error, type) => {
  if (type === 'uncaughtException') {
    if (error instanceof Error) {
      logger.error('Uncaught Exception:', error.message, error.stack)
    } else {
      logger.error('Uncaught Exception:', serialize(error))
    }
    // In app mode, don't exit on uncaught exceptions — the error boundary
    // will catch React errors, and crashing the whole app is worse than
    // a broken screen the user can recover from.
    if (getEnv('TERMCAST_APP_MODE') !== '1') {
      exit(1)
    }
  } else if (type === 'unhandledRejection') {
    if (error instanceof Error) {
      logger.error('Unhandled Rejection:', error.message, error.stack)
    } else {
      logger.error('Unhandled Rejection:', serialize(error))
    }
  } else {
    // uncaughtExceptionMonitor
    logger.error(`Uncaught exception from ${type}:`, error)
  }
})
