/**
 * Shared tooltip component for all chart/graph components.
 *
 * Renders an absolute-positioned box near the cursor showing the x-axis label
 * and y-axis value for the hovered data point. Used by BarGraph, Graph,
 * DottedLineGraph, HorizontalBarGraph, BarChart, and CandleChart.
 *
 * Each chart wraps its plot area with a container that handles mouse events
 * and converts cursor coordinates to tooltip content via `useChartTooltip()`.
 */

import React, { useState, useRef } from 'react'
import type { MouseEvent as OpenTUIMouseEvent } from '@opentui/core'
import { useTheme } from 'termcast/src/theme'

// ── Tooltip state ────────────────────────────────────────────────────

export interface TooltipData {
  /** Absolute terminal X where the tooltip should appear */
  x: number
  /** Absolute terminal Y where the tooltip should appear */
  y: number
  /** Lines of text to show in the tooltip */
  lines: string[]
}

export interface ChartTooltipState {
  tooltip: TooltipData | null
  show: (data: TooltipData) => void
  hide: () => void
}

/**
 * Hook to manage tooltip state. Each chart component calls this once
 * and passes `show`/`hide` to mouse event handlers.
 */
export function useChartTooltip(): ChartTooltipState {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const showRef = useRef((data: TooltipData) => {
    setTooltip(data)
  })
  const hideRef = useRef(() => {
    setTooltip(null)
  })
  return { tooltip, show: showRef.current, hide: hideRef.current }
}

// ── Tooltip component ────────────────────────────────────────────────

interface ChartTooltipProps {
  tooltip: TooltipData | null
  /** The ref of the chart container box, used to compute relative position */
  containerRef: React.RefObject<{ x: number; y: number; width: number; height: number } | null>
}

/**
 * Absolute-positioned tooltip that floats near the hovered data point.
 * Must be rendered inside the chart's outermost `<box>` container.
 *
 * Position is computed relative to the container. The tooltip shifts
 * left when it would overflow the right edge, and shifts above the
 * cursor when it would overflow the bottom.
 */
export function ChartTooltip({ tooltip, containerRef }: ChartTooltipProps): any {
  const theme = useTheme()

  if (!tooltip || !containerRef.current) {
    return null
  }

  const container = containerRef.current
  const maxWidth = Math.max(...tooltip.lines.map((line) => line.length)) + 2
  const tooltipHeight = tooltip.lines.length

  // Convert absolute terminal coordinates to relative container coordinates
  let relX = tooltip.x - container.x + 2
  let relY = tooltip.y - container.y - tooltipHeight

  // Shift left if tooltip would overflow the right edge
  if (relX + maxWidth > container.width) {
    relX = Math.max(0, container.width - maxWidth)
  }

  // Shift below cursor if tooltip would overflow the top
  if (relY < 0) {
    relY = tooltip.y - container.y + 1
  }

  return (
    <box
      position="absolute"
      left={relX}
      top={relY}
      height={tooltipHeight}
      overflow="hidden"
      flexShrink={0}
      backgroundColor={theme.backgroundPanel}
    >
      {tooltip.lines.map((line, i) => {
        return (
          <text key={i} fg={theme.text} wrapMode="none"> {line} </text>
        )
      })}
    </box>
  )
}

// ── Helpers for renderable-based charts ──────────────────────────────

/**
 * For renderable-based charts (Graph, DottedLineGraph, CandleChart), compute
 * which data index the cursor is hovering over based on the mouse X coordinate
 * relative to the plot area.
 */
export function computeDataIndexFromMouseX({
  mouseX,
  plotX,
  plotW,
  dataLength,
}: {
  mouseX: number
  plotX: number
  plotW: number
  dataLength: number
}): number {
  if (dataLength <= 0 || plotW <= 0) return -1
  const relX = mouseX - plotX
  if (relX < 0 || relX >= plotW) return -1
  return Math.round((relX / Math.max(1, plotW - 1)) * (dataLength - 1))
}

/**
 * Resolve the x-axis label for a given data index.
 *
 * When xLabels has the same length as the data (1:1 mapping, typical for
 * BarGraph), the label is looked up directly by index.
 *
 * When xLabels is shorter (typical for line charts where a few tick labels
 * are spread across many data points), the label is interpolated by mapping
 * the data position to the nearest label.
 *
 * Falls back to the stringified index only if no labels are provided at all.
 */
export function interpolateXLabel({
  dataIndex,
  dataLength,
  xLabels,
}: {
  dataIndex: number
  dataLength: number
  xLabels: string[]
}): string {
  if (xLabels.length === 0) return `${dataIndex}`

  // Direct lookup: xLabels covers this index
  if (dataIndex < xLabels.length && xLabels[dataIndex] !== undefined && xLabels[dataIndex] !== '') {
    return xLabels[dataIndex]
  }

  // Interpolate: find nearest label by position
  if (dataLength <= 1) return xLabels[0] || `${dataIndex}`
  const t = dataIndex / (dataLength - 1)
  const labelIdx = Math.round(t * (xLabels.length - 1))
  const resolved = xLabels[labelIdx]
  if (resolved !== undefined && resolved !== '') return resolved

  // Last resort: scan for nearest non-empty label
  let bestIdx = -1
  let bestDist = Infinity
  for (let i = 0; i < xLabels.length; i++) {
    if (xLabels[i] === undefined || xLabels[i] === '') continue
    const dist = Math.abs(i - labelIdx)
    if (dist < bestDist) {
      bestDist = dist
      bestIdx = i
    }
  }
  if (bestIdx >= 0) return xLabels[bestIdx]!
  return `${dataIndex}`
}

/**
 * Format a single tooltip line from a label and numeric value.
 */
export function formatTooltipLine(label: string, value: number | string): string {
  return `${label}: ${value}`
}
