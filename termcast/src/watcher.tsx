// Dynamic watcher loader - only initializes when first called
// Following opencode's approach for bundling native modules in compiled binaries
// @ts-ignore - wrapper.js exists but types don't export it
import { createWrapper } from '@parcel/watcher/wrapper'
import type ParcelWatcher from '@parcel/watcher'

let _watcher: typeof ParcelWatcher | undefined

function getWatcherPackageName(): string {
  const suffix = process.platform === 'linux' ? '-glibc' : ''
  return `@parcel/watcher-${process.platform}-${process.arch}${suffix}`
}

export function getWatcher(): typeof ParcelWatcher {
  if (_watcher) return _watcher
  const watcherPackageName = getWatcherPackageName()
  let binding: unknown
  try {
    // Use require with template literal so Bun can analyze and bundle the native module
    binding = require(watcherPackageName)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      [
        `Failed to load native watcher package \"${watcherPackageName}\".`,
        `Current platform: ${process.platform}-${process.arch}.`,
        '',
        'This usually means Bun blocked install scripts for watcher packages.',
        'Fix with:',
        '  bun pm trust @parcel/watcher @parcel/watcher-linux-x64-glibc',
        '  bun install',
        '',
        `Original error: ${message}`,
      ].join('\n'),
    )
  }
  _watcher = createWrapper(binding)
  return _watcher!
}
