import childProcess from 'node:child_process'
import { logger } from './logger'

export async function runSwiftFunction(
  binaryPath: string,
  functionName: string,
  ...args: unknown[]
): Promise<unknown> {
  const jsonArgs = args.map((arg) => JSON.stringify(arg))

  logger.log(`Swift: calling ${functionName} with args:`, jsonArgs)

  const proc = childProcess.spawn(binaryPath, [functionName, ...jsonArgs], {
    stdio: ['ignore', 'pipe', 'inherit'],
  })

  const [stdout, exitCode] = await Promise.all([
    new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = []
      proc.stdout!.on('data', (chunk) => { chunks.push(chunk) })
      proc.stdout!.on('error', reject)
      proc.stdout!.on('end', () => { resolve(Buffer.concat(chunks).toString()) })
    }),
    new Promise<number | null>((resolve, reject) => {
      proc.on('error', reject)
      proc.on('close', (code, signal) => {
        if (signal) {
          reject(new Error(`Swift function "${functionName}" was killed by signal ${signal}`))
        } else {
          resolve(code)
        }
      })
    }),
  ])

  if (exitCode !== 0) {
    throw new Error(`Swift function "${functionName}" failed with exit code ${exitCode}`)
  }

  const trimmed = stdout.trim()
  if (!trimmed) {
    return undefined
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    throw new Error(`Swift function "${functionName}" returned invalid JSON: ${trimmed}`)
  }
}
