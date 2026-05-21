// React component profiler for termcast.
//
// Captures React 19.2+ PerformanceMeasure entries emitted by the development
// reconciler (react-reconciler/cjs/react-reconciler.development.js) and writes
// a .cpuprofile file on process exit. Analyze with profano:
//
//   TERMCAST_REACT_PROFILE=1 termcast dev ./my-extension
//   bunx profano ./tmp/react-profile-*.cpuprofile --sort self
//   bunx profano ./tmp/react-profile-*.cpuprofile --sort total
//
// The reconciler emits performance.measure() calls with:
//   - name: "\u200b" + componentName (component renders)
//   - name: trigger string like "Mount", "Cascading Update", etc.
//   - detail.devtools.track: "Components ⚛" for component renders
//
// NOTE: React also emits some entries via console.timeStamp() which are not
// captured by PerformanceObserver. This profiler captures a useful subset of
// React's performance track data, not every component render.
//
// The profile builds a best-effort call tree from time containment: if measure
// A fully contains measure B in time, B becomes a child of A. Partially
// overlapping measures are attached to the nearest containing ancestor.
// This gives meaningful self vs total times in profano output:
//   - total time = all time inside a measure (including children)
//   - self time = time not attributed to any child measure
//
// Requirements:
//   - React 19.2+ in development mode (NODE_ENV !== 'production')
//   - PerformanceObserver available (Node.js 16+, Bun)

import fs from 'node:fs'
import path from 'node:path'
import { logger } from './logger'
import { useStore } from './state'

interface ReactMeasure {
  name: string
  duration: number
  startTime: number
  track: string
}

const measures: ReactMeasure[] = []
let observerInstalled = false
let profileWritten = false
let perfObserver: PerformanceObserver | null = null

function writeProfileOnce(): void {
  if (profileWritten) {
    return
  }
  profileWritten = true
  // Drain any queued records not yet delivered by the observer callback,
  // so the last measures before exit are captured.
  if (perfObserver) {
    for (const entry of perfObserver.takeRecords()) {
      const detail = (entry as any).detail
      if (!detail?.devtools?.track) {
        continue
      }
      measures.push({
        name: entry.name,
        duration: entry.duration,
        startTime: entry.startTime,
        track: detail.devtools.track,
      })
    }
  }
  writeProfile()
}

export function installProfiler(): void {
  if (observerInstalled) {
    return
  }
  if (typeof PerformanceObserver === 'undefined') {
    logger.error('PerformanceObserver not available, profiling disabled')
    return
  }

  observerInstalled = true

  perfObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const detail = (entry as any).detail
      if (!detail?.devtools?.track) {
        continue
      }
      measures.push({
        name: entry.name,
        duration: entry.duration,
        startTime: entry.startTime,
        track: detail.devtools.track,
      })
    }
  })

  perfObserver.observe({ type: 'measure', buffered: true })

  // Write profile on exit signals. The named function reference is used so
  // removeListener actually removes the correct handler, preventing recursion
  // when process.kill re-raises the signal.
  const handleSignal = (signal: NodeJS.Signals) => {
    writeProfileOnce()
    process.removeListener(signal, handleSignal)
    process.kill(process.pid, signal)
  }

  process.on('SIGINT', handleSignal)
  process.on('SIGTERM', handleSignal)
  process.on('exit', writeProfileOnce)

  logger.log('React profiler installed. Profile will be written on exit.')
}

interface CallFrame {
  functionName: string
  scriptId: string
  url: string
  lineNumber: number
  columnNumber: number
}

interface ProfileNode {
  id: number
  callFrame: CallFrame
  children: number[]
}

interface Span {
  startUs: number
  endUs: number
  name: string
  track: string
}

// Build a call tree from time containment: if span A fully contains span B,
// B is a child of A. Each unique (track, name) pair can appear at multiple
// tree positions when it occurs inside different parent spans.
//
// The algorithm: sort spans longest-first so parents come before children.
// For each span, walk the tree from root finding the deepest ancestor that
// contains it, then attach a new node there. Each tree node gets a unique ID
// even if the same component name appears multiple times (different call sites).
function buildCallTree({ spans, sourceMap }: { spans: Span[]; sourceMap: Map<string, string> }): {
  nodes: ProfileNode[]
  spanToLeafId: Map<number, number>
} {
  const ROOT_ID = 1
  const IDLE_ID = 2
  const nodes: ProfileNode[] = [
    {
      id: ROOT_ID,
      callFrame: { functionName: '(root)', scriptId: '0', url: '', lineNumber: -1, columnNumber: -1 },
      children: [IDLE_ID],
    },
    {
      id: IDLE_ID,
      callFrame: { functionName: '(idle)', scriptId: '0', url: '', lineNumber: -1, columnNumber: -1 },
      children: [],
    },
  ]

  let nextId = 3

  // Track which tree node each span maps to, plus its time range
  interface TreeEntry {
    nodeId: number
    startUs: number
    endUs: number
    children: TreeEntry[]
  }

  const rootEntry: TreeEntry = {
    nodeId: ROOT_ID,
    startUs: -Infinity,
    endUs: Infinity,
    children: [],
  }

  // Sort spans by duration descending so parents (longer) are inserted first
  const indexed = spans.map((s, i) => ({ ...s, originalIndex: i }))
  indexed.sort((a, b) => (b.endUs - b.startUs) - (a.endUs - a.startUs))

  // Map from original span index to the leaf node ID for sampling
  const spanToLeafId = new Map<number, number>()

  for (const span of indexed) {
    // Find deepest ancestor in the tree that fully contains this span
    const parent = findDeepestContainer(rootEntry, span.startUs, span.endUs)

    const id = nextId++
    const newEntry: TreeEntry = {
      nodeId: id,
      startUs: span.startUs,
      endUs: span.endUs,
      children: [],
    }

    // Resolve source file path from the component name.
    // Falls back to the React track name (e.g. "Components ⚛") for scheduler
    // events and components not found in source.
    // scriptId is stable per source identity so profano aggregates repeated
    // renders of the same component into one row.
    const sourcePath = sourceMap.get(span.name)
    const sourceMatch = sourcePath ? /^(.*):(\d+)$/.exec(sourcePath) : null
    const url = sourceMatch ? sourceMatch[1] : (sourcePath || span.track)
    const lineNumber = sourceMatch ? Number(sourceMatch[2]) : -1
    const scriptId = sourcePath || `${span.track}:${span.name}`

    nodes.push({
      id,
      callFrame: {
        functionName: span.name,
        scriptId,
        url,
        lineNumber,
        columnNumber: -1,
      },
      children: [],
    })

    // Add as child of parent in both the tree and the profile nodes
    parent.children.push(newEntry)
    const parentNode = nodes.find((n) => n.id === parent.nodeId)!
    if (!parentNode.children.includes(id)) {
      parentNode.children.push(id)
    }

    spanToLeafId.set(span.originalIndex, id)
  }

  return { nodes, spanToLeafId }
}

function findDeepestContainer(
  entry: { nodeId: number; startUs: number; endUs: number; children: Array<{ nodeId: number; startUs: number; endUs: number; children: any[] }> },
  startUs: number,
  endUs: number,
): { nodeId: number; startUs: number; endUs: number; children: any[] } {
  // Check children for a tighter fit
  for (const child of entry.children) {
    if (child.startUs <= startUs && child.endUs >= endUs) {
      return findDeepestContainer(child, startUs, endUs)
    }
  }
  return entry
}

// Build a component name → file path mapping by scanning source files.
// Looks for function declarations, const arrows, and export patterns that
// define React components (PascalCase names). Scans both the extension's
// src directory and termcast's own src directory for internal components.
function buildComponentSourceMap(): Map<string, string> {
  const map = new Map<string, string>()

  // Patterns that define a component:
  //   function ComponentName(              — function declaration
  //   const ComponentName =                — const arrow/assignment
  //   export function ComponentName(       — exported function
  //   export default function ComponentName( — default exported function
  //   export const ComponentName =         — exported const
  //   ComponentName = (props)              — compound component assignment
  const componentPattern =
    /(?:export\s+(?:default\s+)?)?(?:(?:function|const)\s+)([A-Z][A-Za-z0-9_]*)\s*(?:[:=(])/gm
  // Also match compound component patterns: Name.Sub = (props) =>
  const compoundPattern =
    /([A-Z][A-Za-z0-9_]*(?:\.[A-Z][A-Za-z0-9_]*)+)\s*=\s*\(/gm

  const SKIP_DIRS = new Set(['node_modules', '.termcast-bundle', 'dist', '.git'])

  // Manual recursion to skip node_modules/dist directories before descending,
  // instead of fs.readdirSync({ recursive: true }) which eagerly traverses everything.
  const scanDirectory = (dir: string, basePath: string) => {
    if (!fs.existsSync(dir)) {
      return
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          scanDirectory(path.join(dir, entry.name), basePath)
        }
        continue
      }
      if (!entry.isFile()) {
        continue
      }
      const name = entry.name
      if (!name.endsWith('.tsx') && !name.endsWith('.ts') && !name.endsWith('.jsx')) {
        continue
      }
      const fullPath = path.join(dir, name)
      const relativePath = path.relative(basePath, fullPath)
      try {
        const content = fs.readFileSync(fullPath, 'utf-8')

        // Find function/const component definitions
        let match: RegExpExecArray | null = null
        componentPattern.lastIndex = 0
        while ((match = componentPattern.exec(content)) !== null) {
          const componentName = match[1]
          // Only set if not already mapped (first definition wins)
          if (!map.has(componentName)) {
            const line = content.slice(0, match.index).split('\n').length
            map.set(componentName, `${relativePath}:${line}`)
          }
        }

        // Find compound component patterns (List.Item, Form.TextField, etc.)
        compoundPattern.lastIndex = 0
        while ((match = compoundPattern.exec(content)) !== null) {
          const fullName = match[1]
          // Extract the last part as the component name (e.g., "Item" from "List.Item")
          const parts = fullName.split('.')
          const lastPart = parts[parts.length - 1]
          if (!map.has(lastPart)) {
            const line = content.slice(0, match.index).split('\n').length
            map.set(lastPart, `${relativePath}:${line}`)
          }
        }
      } catch {
        // Skip files that can't be read
      }
    }
  }

  // Scan extension source directory
  const extensionPath = useStore.getState().extensionPath
  if (extensionPath) {
    const srcDir = path.join(extensionPath, 'src')
    if (fs.existsSync(srcDir)) {
      scanDirectory(srcDir, extensionPath)
    }
    // Also scan root level .tsx files
    scanDirectory(extensionPath, extensionPath)
  }

  // Scan termcast's own src directory for internal components
  const termcastSrc = path.resolve(__dirname)
  scanDirectory(termcastSrc, path.resolve(termcastSrc, '..'))

  return map
}

function writeProfile(): void {
  if (measures.length === 0) {
    logger.log('No React performance measures captured, skipping profile write')
    return
  }

  const TICK = 1000 // microseconds per sample (1ms resolution)

  // Build component name → source file mapping
  const sourceMap = buildComponentSourceMap()

  const sorted = [...measures].sort((a, b) => a.startTime - b.startTime)
  const t0 = sorted[0].startTime
  const endUs = Math.round(
    (Math.max(...sorted.map((m) => m.startTime + m.duration)) - t0) * 1000,
  )

  // Convert measures to spans with microsecond timestamps
  const spans: Span[] = sorted.map((m) => ({
    startUs: Math.round((m.startTime - t0) * 1000),
    endUs: Math.round((m.startTime + m.duration - t0) * 1000),
    name: m.name.replace('\u200b', ''),
    track: m.track,
  }))

  // Build call tree from time containment, passing sourceMap for file paths
  const { nodes, spanToLeafId } = buildCallTree({ spans, sourceMap })

  // Generate samples only over active span windows and compress idle gaps.
  // Instead of iterating every tick across the full timeline (which is O(ticks * spans)
  // and can hang for long sessions), collect all span boundaries, sort them, and only
  // sample within active windows. Idle gaps between windows become a single idle sample
  // with a large timeDelta.
  const samples: number[] = []
  const timeDeltas: number[] = []

  const IDLE_ID = 2

  // Collect unique boundary times from all spans
  const boundaries = new Set<number>()
  for (const span of spans) {
    boundaries.add(span.startUs)
    boundaries.add(span.endUs)
  }
  // Add timeline start/end
  boundaries.add(0)
  boundaries.add(endUs)

  const sortedBoundaries = [...boundaries].sort((a, b) => a - b)

  // Sort spans narrowest-first for fast deepest-leaf lookup
  const spansByNarrowest = spans
    .map((s, i) => ({ ...s, idx: i }))
    .sort((a, b) => (a.endUs - a.startUs) - (b.endUs - b.startUs))

  // For each window between consecutive boundaries, determine if any span is
  // active. If yes, sample at TICK resolution. If no, emit one idle sample.
  for (let w = 0; w < sortedBoundaries.length - 1; w++) {
    const windowStart = sortedBoundaries[w]
    const windowEnd = sortedBoundaries[w + 1]
    if (windowStart >= windowEnd) {
      continue
    }

    // Check if any span is active at the midpoint of this window
    const mid = windowStart + Math.floor((windowEnd - windowStart) / 2)
    let hasActiveSpan = false
    for (const span of spansByNarrowest) {
      if (mid >= span.startUs && mid < span.endUs) {
        hasActiveSpan = true
        break
      }
    }

    if (!hasActiveSpan) {
      // Compress idle window into a single sample
      samples.push(IDLE_ID)
      timeDeltas.push(windowEnd - windowStart)
      continue
    }

    // Sample at TICK resolution within this active window.
    // Use Math.min so the last sample's timeDelta covers only the remainder,
    // preventing inflation when the window is shorter than TICK or not divisible.
    for (let t = windowStart; t < windowEnd; t += TICK) {
      const nextT = Math.min(t + TICK, windowEnd)
      let leafId = IDLE_ID
      for (const span of spansByNarrowest) {
        if (t >= span.startUs && t < span.endUs) {
          leafId = spanToLeafId.get(span.idx) ?? IDLE_ID
          break
        }
      }
      samples.push(leafId)
      timeDeltas.push(nextT - t)
    }
  }

  const profile = {
    nodes,
    samples,
    startTime: 0,
    endTime: endUs,
    timeDeltas,
  }

  // Write to ./tmp/react-profile.cpuprofile relative to cwd
  const outDir = path.join(process.cwd(), 'tmp')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `react-profile-${Date.now()}.cpuprofile`)
  fs.writeFileSync(outPath, JSON.stringify(profile))

  const activeSamples = samples.filter((s) => s !== 2).length
  logger.log(
    `Wrote React profile: ${outPath} (${measures.length} measures, ${nodes.length} nodes, ${activeSamples} active / ${samples.length} total samples)`,
  )
  console.error(
    `\nReact profile written: ${outPath}\nAnalyze with: npx profano ${outPath} --sort self`,
  )
}
