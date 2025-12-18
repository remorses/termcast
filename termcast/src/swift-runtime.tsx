import { logger } from './logger'

export async function runSwiftFunction(
  binaryPath: string,
  functionName: string,
  ...args: unknown[]
): Promise<unknown> {
  const jsonArgs = args.map((arg) => JSON.stringify(arg))

  logger.log(`Swift: calling ${functionName} with args:`, jsonArgs)

  const proc = Bun.spawn([binaryPath, functionName, ...jsonArgs], {
    stdout: 'pipe',
    stderr: 'inherit',
  })

  const [stdout, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    proc.exited,
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
