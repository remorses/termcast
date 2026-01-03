import { test, expect, afterEach, beforeEach } from 'vitest'

import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/list-with-sections.tsx'],
    cols: 70,
    rows: 20,
  })
})

afterEach(() => {
  session?.close()
})

test('actions dialog layout shift when opening with ctrl+k', async () => {
  // Wait for list to fully render
  await session.text({
    waitFor: (text) => /search/i.test(text) && /Apple/.test(text),
  })

  // Capture multiple frames when pressing ctrl+k to verify no layout shift
  // Previously, the dialog would shift position as content mounted incrementally.
  // Now with fixed height on ScrollBox, the dialog appears at stable position immediately.
  const frames = await session.captureFrames(['ctrl', 'k'], {
    frameCount: 10,
    intervalMs: 5,
  })

  // Filter frames that show the dialog border
  const dialogFrames = frames.filter((frame) => frame.includes('╭'))

  // Find the line number where dialog border (╭) appears in each frame
  const dialogPositions = dialogFrames.map((frame) => {
    const lines = frame.split('\n')
    return lines.findIndex((line) => line.includes('╭'))
  })

  console.log('Dialog border positions across frames:', dialogPositions)

  // Check if all positions are the same (no layout shift)
  const uniquePositions = [...new Set(dialogPositions)]
  const hasLayoutShift = uniquePositions.length > 1

  if (hasLayoutShift) {
    console.log('LAYOUT SHIFT DETECTED!')
    console.log(`Dialog moves from line ${Math.min(...dialogPositions)} to line ${Math.max(...dialogPositions)}`)
  }

  // Capture first and last dialog frames to show the shift
  const firstDialogFrame = dialogFrames[0]
  const lastDialogFrame = dialogFrames[dialogFrames.length - 1]

  // First frame: dialog appears at stable position (same as last frame)
  expect(firstDialogFrame).toMatchInlineSnapshot(`
    "


       Simple List Example ────────────────────────────────────────────

      ╭────────────────────────────────────────────────────────────────╮
      │                                                                │
      │   Actions                                                esc   │
      │                                                                │
      │   > Search actions...                                          │
      │                                                                │
      │  ›View Details                                                 │
      │   Add to Cart                                                  │
      │                                                                │
      │   Settings                                                     │
      │   Change Theme...                                              │
      │                                                                │
      │                                                                │
      │                                                                │
      │   ↵ select   ↑↓ navigate                                       │
      │                                                                │"
  `)

  // Last frame: dialog at same position as first frame (no shift)
  expect(lastDialogFrame).toMatchInlineSnapshot(`
    "


       Simple List Example ────────────────────────────────────────────

      ╭────────────────────────────────────────────────────────────────╮
      │                                                                │
      │   Actions                                                esc   │
      │                                                                │
      │   > Search actions...                                          │
      │                                                                │
      │  ›View Details                                                 │
      │   Add to Cart                                                  │
      │                                                                │
      │   Settings                                                     │
      │   Change Theme...                                              │
      │                                                                │
      │                                                                │
      │                                                                │
      │   ↵ select   ↑↓ navigate                                       │
      │                                                                │"
  `)

  // The dialog should appear at a stable position immediately.
  // Fixed by using a fixed height on the ScrollBox instead of maxHeight,
  // so the dialog has consistent dimensions from the first render.
  expect(hasLayoutShift).toBe(false)
}, 15000)
