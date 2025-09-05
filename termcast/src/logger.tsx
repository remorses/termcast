import * as fs from 'fs'
import * as path from 'path'
import { useEffect } from 'react'

const LOG_FILE = path.join(process.cwd(), 'app.log')

// Delete log file on process start
if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE)
}

function serialize(msg: any): string {
    if (msg instanceof Error) {
        return `${msg.message}\n${msg.stack}`
    }
    if (typeof msg === 'string') {
        return msg
    }
    return Bun.inspect(msg, { depth: 3 })
}

export const logger = {
    log: (...messages: any[]) => {
        const timestamp = new Date().toISOString()
        const formattedMessages = messages.map(serialize).join(' ')
        const logEntry = `[${timestamp}] ${formattedMessages}\n`
        fs.appendFileSync(LOG_FILE, logEntry)
    },
    error: (...messages: any[]) => {
        const timestamp = new Date().toISOString()
        const formattedMessages = messages.map(serialize).join(' ')
        const logEntry = `[${timestamp}] ERROR: ${formattedMessages}\n`
        fs.appendFileSync(LOG_FILE, logEntry)
    },
    warn: (...messages: any[]) => {
        const timestamp = new Date().toISOString()
        const formattedMessages = messages.map(serialize).join(' ')
        const logEntry = `[${timestamp}] WARN: ${formattedMessages}\n`
        fs.appendFileSync(LOG_FILE, logEntry)
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
        fs.appendFileSync(LOG_FILE, logEntry)
    },
}

// Catch unhandled errors and exceptions
process.on('uncaughtException', (error: Error) => {
    if (error instanceof Error) {
        logger.error('Uncaught Exception:', error.message, error.stack)
    } else {
        logger.error('Uncaught Exception:', serialize(error))
    }
    process.exit(1)
})

process.on('unhandledRejection', async (reason: any, promise: Promise<any>) => {
    if (reason instanceof Error) {
        logger.error(
            'Unhandled Rejection at:',
            promise,
            'reason:',
            reason.message,
            reason.stack,
        )
    } else {
        logger.error(
            'Unhandled Rejection at:',
            promise,
            'reason:',
            serialize(reason),
        )
    }
})
