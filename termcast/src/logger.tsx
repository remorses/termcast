import * as fs from 'fs'
import * as path from 'path'
import { useEffect } from 'react'

const LOG_FILE = path.join(process.cwd(), 'app.log')

// Delete log file on process start
if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE)
}

export const logger = {
    log: (...messages: any[]) => {
        const timestamp = new Date().toISOString()
        const formattedMessages = messages.map(msg =>
            typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2)
        ).join(' ')
        const logEntry = `[${timestamp}] ${formattedMessages}\n`
        fs.appendFileSync(LOG_FILE, logEntry)
    },
    error: (...messages: any[]) => {
        const timestamp = new Date().toISOString()
        const formattedMessages = messages.map(msg =>
            typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2)
        ).join(' ')
        const logEntry = `[${timestamp}] ERROR: ${formattedMessages}\n`
        fs.appendFileSync(LOG_FILE, logEntry)
    },
    warn: (...messages: any[]) => {
        const timestamp = new Date().toISOString()
        const formattedMessages = messages.map(msg =>
            typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2)
        ).join(' ')
        const logEntry = `[${timestamp}] WARN: ${formattedMessages}\n`
        fs.appendFileSync(LOG_FILE, logEntry)
    },
}

// Catch unhandled errors and exceptions
process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error.message, error.stack)
    process.exit(1)
})

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
})
