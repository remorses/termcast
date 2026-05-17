/**
 * Interactive install command button with clipboard copy.
 * Client component because it uses useState for the copy feedback.
 */
'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function InstallCommand() {
  const [copied, setCopied] = useState(false)
  const command = 'bun install -g termcast'

  return (
    <button
      className='flex items-center gap-3 mt-7 sm:mt-8 px-5 py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors group cursor-pointer'
      onClick={() => {
        navigator.clipboard.writeText(command)
        setCopied(true)
        globalThis.setTimeout(() => {
          setCopied(false)
        }, 2000)
      }}
    >
      <span className='bu-font-mono text-sm text-zinc-400'>
        <span className='text-pumpkin-500'>$</span> {command}
      </span>
      {copied
        ? <Check size={14} className='text-emerald-400' />
        : <Copy size={14} className='text-zinc-600 group-hover:text-zinc-400 transition-colors' />
      }
    </button>
  )
}
