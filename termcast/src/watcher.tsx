// Dynamic watcher loader - only initializes when first called
// Following opencode's approach for bundling native modules in compiled binaries
// @ts-ignore - wrapper.js exists but types don't export it
import { createWrapper } from '@parcel/watcher/wrapper'
import type ParcelWatcher from '@parcel/watcher'

let _watcher: typeof ParcelWatcher | undefined

export function getWatcher(): typeof ParcelWatcher {
  if (_watcher) return _watcher
  // Use require with template literal so Bun can analyze and bundle the native module
  // Linux requires -glibc suffix for the native binding
  const suffix = process.platform === 'linux' ? '-glibc' : ''
  const binding = require(
    `@parcel/watcher-${process.platform}-${process.arch}${suffix}`,
  )
  _watcher = createWrapper(binding)
  return _watcher
}
