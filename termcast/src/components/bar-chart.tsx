/**
 * BarChart component for rendering horizontal stacked bar charts in the terminal.
 *
 * Uses opentui <box> elements with backgroundColor for each segment, sized
 * proportionally via flexGrow. Labels are positioned above or below the bar
 * with corner bracket connectors (┌/┐/└/┘).
 *
 * Segments too small to display (< 1 terminal column) are hidden.
 * Labels are hidden when the segment is narrower than the label text.
 *
 * Color palette (assigned by value descending):
 *   primary, accent, info, success, warning, error, secondary (cycles with %)
 */

import React, { ReactNode, useMemo } from 'react'
import { useTheme } from 'termcast/src/theme'
import { Color, resolveColor } from 'termcast/src/colors'
import type { ResolvedTheme } from 'termcast/src/themes'

// ── Theme color palette for auto-assignment ──────────────────────────
// Ordered by visual prominence, assigned to segments sorted by value descending.

function getThemePalette(theme: ResolvedTheme): string[] {
  return [
    theme.accent,
    theme.info,
    theme.success,
    theme.warning,
    theme.error,
    theme.secondary,
    theme.primary,
  ]
}

// ── Types ────────────────────────────────────────────────────────────

export interface BarChartSegmentProps {
  /** Numeric value for this segment (determines proportional width) */
  value: number
  /** Label text shown above/below the segment (e.g. "Spent") */
  label?: string
  /** Override the auto-assigned color */
  color?: Color.ColorLike
}

export interface BarChartProps {
  /** Height of the colored bar in terminal rows (default: 1) */
  height?: number
  /** Show label annotations above/below the bar (default: true) */
  showLabels?: boolean
  /** BarChart.Segment children */
  children: ReactNode
}

interface BarChartType {
  (props: BarChartProps): any
  Segment: (props: BarChartSegmentProps) => any
}

// ── Internal: collected segment data ─────────────────────────────────

interface SegmentData {
  value: number
  label?: string
  color?: string // resolved hex, or undefined for auto
  /** Index in original children order */
  originalIndex: number
}

// ── BarChart.Segment (data-only, renders null like Graph.Line) ───────

const BarChartSegment = (_props: BarChartSegmentProps): any => {
  return null
}

// ── Label positioning ────────────────────────────────────────────────
// Labels use the same flexGrow as segments so they naturally align.
// "above" labels: fit within segment width. "below": overflow-hidden.
// The decision is based on estimated proportional width vs text length.

interface PositionedLabel {
  text: string
  segmentIndex: number
  position: 'above' | 'below'
}

function formatValue(value: number, total: number): string {
  const pct = (value / total) * 100
  if (pct >= 1) {
    return pct % 1 === 0 ? `${pct.toFixed(0)}%` : `${pct.toFixed(1)}%`
  }
  return `${pct.toFixed(1)}%`
}

function buildLabelText(label: string | undefined, value: number, total: number): string {
  const formatted = formatValue(value, total)
  if (label) {
    return `${label}: ${formatted}`
  }
  return formatted
}

function computeLabels({
  segments,
  total,
}: {
  segments: SegmentData[]
  total: number
}): { above: PositionedLabel[]; below: PositionedLabel[] } {
  const above: PositionedLabel[] = []
  const below: PositionedLabel[] = []

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!
    const text = buildLabelText(seg.label, seg.value, total)
    const proportion = seg.value / total

    // Skip labels for small segments - they'd be unreadable noise.
    // 12% threshold ensures at least ~6 cols in a 50-col container,
    // enough for a bracket + 4 chars + bracket.
    if (proportion < 0.12) {
      continue
    }

    const positioned: PositionedLabel = {
      text,
      segmentIndex: i,
      position: 'above',
    }

    // Heuristic for "fits above": text + brackets (2 chars) must fit within
    // estimated segment width. We use proportion * 60 as a conservative
    // estimate (works for containers 50-100 cols wide).
    const estimatedCols = proportion * 60
    if (text.length + 2 <= estimatedCols) {
      above.push(positioned)
    } else if (estimatedCols >= 5) {
      // Only show below if there's enough space for a readable truncation
      // (bracket + at least 3 chars + bracket = 5 cols minimum)
      positioned.position = 'below'
      below.push(positioned)
    }
    // else: segment too narrow for readable label in either position, skip
  }

  return { above, below }
}

// ── Render a label row using flexbox ─────────────────────────────────
// Each segment gets a box with the same flexGrow so labels align with the bar.
// overflow="hidden" and wrapMode="none" ensure long labels clip rather than wrap.

function LabelRow({ segments, labelMap, position, color }: {
  segments: Array<SegmentData & { resolvedColor: string }>
  labelMap: Map<number, PositionedLabel>
  position: 'above' | 'below'
  color: string
}): any {
  const hasAnyLabel = segments.some((_, i) => labelMap.has(i))
  if (!hasAnyLabel) {
    return null
  }

  const openBracket = position === 'above' ? '┌' : '└'
  const closeBracket = position === 'above' ? '┐' : '┘'

  return (
    <box flexDirection="row" width="100%" height={1} flexShrink={0}>
      {segments.map((seg, i) => {
        const label = labelMap.get(i)
        if (!label) {
          // Empty spacer: uses flexGrow to maintain alignment but no height
          return <box key={i} flexGrow={seg.value} flexShrink={1} flexBasis={0} />
        }
        return (
          <box key={i} flexGrow={seg.value} flexShrink={1} flexBasis={0} overflow="hidden">
            <text fg={color} wrapMode="none" flexShrink={0}>
              {openBracket}{label.text}{closeBracket}
            </text>
          </box>
        )
      })}
    </box>
  )
}

// ── Main BarChart component ──────────────────────────────────────────

const BarChart: BarChartType = (props) => {
  const theme = useTheme()
  const { height = 1, showLabels = true, children } = props

  // Collect segment data from BarChart.Segment children
  const segments = useMemo<SegmentData[]>(() => {
    const result: SegmentData[] = []
    let idx = 0
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) {
        return
      }
      const childProps = child.props as BarChartSegmentProps
      if (childProps.value === undefined) {
        return
      }
      result.push({
        value: childProps.value,
        label: childProps.label,
        color: resolveColor(childProps.color),
        originalIndex: idx,
      })
      idx++
    })
    return result
  }, [children])

  // Sort by value descending for color assignment, then restore original order
  const palette = getThemePalette(theme)
  const coloredSegments = useMemo<Array<SegmentData & { resolvedColor: string }>>(() => {
    // Create index mapping: sort by value desc, assign colors
    const sortedIndices = segments
      .map((_, i) => i)
      .sort((a, b) => segments[b]!.value - segments[a]!.value)

    const colorMap = new Map<number, string>()
    sortedIndices.forEach((origIdx, rank) => {
      const seg = segments[origIdx]!
      const color = seg.color || palette[rank % palette.length]!
      colorMap.set(origIdx, color)
    })

    return segments.map((seg, i) => ({
      ...seg,
      resolvedColor: colorMap.get(i) || palette[0]!,
    }))
  }, [segments, palette])

  const total = useMemo(() => {
    return coloredSegments.reduce((sum, s) => sum + s.value, 0)
  }, [coloredSegments])

  if (total === 0 || coloredSegments.length === 0) {
    return null
  }

  // Filter out segments too small to render (proportion < 0.5%)
  const visibleSegments = coloredSegments.filter((seg) => {
    const proportion = seg.value / total
    return proportion >= 0.005
  })

  // Compute labels
  const { above, below } = showLabels
    ? computeLabels({ segments: visibleSegments, total })
    : { above: [], below: [] }

  // Build lookup maps: segmentIndex -> label
  const aboveMap = new Map(above.map((l) => [l.segmentIndex, l]))
  const belowMap = new Map(below.map((l) => [l.segmentIndex, l]))

  return (
    <box flexDirection="column" width="100%" flexShrink={0}>
      <LabelRow
        segments={visibleSegments}
        labelMap={aboveMap}
        position="above"
        color={theme.textMuted}
      />
      <box flexDirection="row" height={height} width="100%" flexShrink={0}>
        {visibleSegments.map((seg, i) => {
          return (
            <box key={i} flexGrow={seg.value} flexShrink={0} backgroundColor={seg.resolvedColor} height={height} />
          )
        })}
      </box>
      <LabelRow
        segments={visibleSegments}
        labelMap={belowMap}
        position="below"
        color={theme.textMuted}
      />
    </box>
  )
}

BarChart.Segment = BarChartSegment

export { BarChart }
