/**
 * Histogram component for rendering horizontal distribution tables in the terminal.
 *
 * Each row displays a colored dot, label, count, percentage, and a horizontal
 * bar made of repeated characters. Includes optional header and totals footer.
 *
 * Colors can be set per-item via props, or auto-assigned by hashing the label
 * string against the theme palette for deterministic coloring without manual config.
 */

import React, { ReactNode, useMemo } from 'react'
import { useTheme, getThemePalette } from 'termcast/src/theme'
import { Color, resolveColor } from 'termcast/src/colors'

// ── Types ────────────────────────────────────────────────────────────

export interface HistogramItemProps {
  /** Row label (e.g. "user", "bash", "edit") */
  label: string
  /** Numeric count for this row */
  value: number
  /** Override the auto-assigned color for the dot and bar */
  color?: Color.ColorLike
}

export interface HistogramProps {
  /** Max columns for the distribution bar (default: 30) */
  maxBarWidth?: number
  /** Character used for bar segments (default: "│") */
  barCharacter?: string
  /** Show column header row (default: true) */
  showHeader?: boolean
  /** Show totals footer row (default: true) */
  showTotal?: boolean
  /** Show the percentage column (default: true) */
  showPercentage?: boolean
  /** Histogram.Item children */
  children: ReactNode
}

interface HistogramType {
  (props: HistogramProps): any
  Item: (props: HistogramItemProps) => any
}

// ── Internal data ────────────────────────────────────────────────────

interface ItemData {
  label: string
  value: number
  color?: string
}

// ── Hash function for deterministic color from label ─────────────────

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash)
}

// ── Histogram.Item (data-only, renders null like BarChart.Segment) ───

const HistogramItem = (_props: HistogramItemProps): any => {
  return null
}

// ── Main Histogram component ─────────────────────────────────────────

const Histogram: HistogramType = (props) => {
  const theme = useTheme()
  const {
    maxBarWidth = 30,
    barCharacter = '│',
    showHeader = true,
    showTotal = true,
    showPercentage = true,
    children,
  } = props

  const palette = getThemePalette(theme)

  // Collect item data from children
  const items = useMemo<ItemData[]>(() => {
    const result: ItemData[] = []
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return
      const p = child.props as HistogramItemProps
      if (p.label === undefined || p.value === undefined) return
      result.push({
        label: p.label,
        value: p.value,
        color: resolveColor(p.color),
      })
    })
    return result
  }, [children])

  // Resolve colors: explicit prop > hash-based palette assignment
  const coloredItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      resolvedColor: item.color || palette[hashString(item.label) % palette.length]!,
    }))
  }, [items, palette])

  const total = useMemo(() => {
    return coloredItems.reduce((sum, item) => sum + item.value, 0)
  }, [coloredItems])

  const maxValue = useMemo(() => {
    return Math.max(...coloredItems.map((item) => item.value), 1)
  }, [coloredItems])

  if (coloredItems.length === 0 || total === 0) return null

  // Compute column widths from data
  const labelWidth = Math.max(...coloredItems.map((item) => item.label.length), 5)
  const countWidth = Math.max(
    ...coloredItems.map((item) => String(item.value).length),
    String(total).length,
    5,
  )
  const pctWidth = 4 // "100%" = 4 chars

  // ── Formatting helpers ───────────────────────────────────────────

  function padLeft(str: string, width: number): string {
    return str.length >= width ? str : ' '.repeat(width - str.length) + str
  }

  function padRight(str: string, width: number): string {
    return str.length >= width ? str : str + ' '.repeat(width - str.length)
  }

  function formatPct(value: number): string {
    const pct = Math.round((value / total) * 100)
    return `${pct}%`
  }

  function makeBar(value: number): string {
    const barLen = Math.max(1, Math.round((value / maxValue) * maxBarWidth))
    return barCharacter.repeat(barLen)
  }

  // ── Separator line ───────────────────────────────────────────────

  // dot(2) + label + gap(2) + count + gap(2) + pct + gap(2) + some bar
  const separatorWidth = 2 + labelWidth + 2 + countWidth + 2 + pctWidth + 2 + maxBarWidth
  const separator = '─'.repeat(separatorWidth)

  // Build header text as a single string
  const headerText = `  ${padRight('category', labelWidth)}  ${padLeft('count', countWidth)}${showPercentage ? `  ${padLeft('%', pctWidth)}` : ''}  distribution`

  // Build total text as a single string
  const totalText = `  ${padRight('total', labelWidth)}  ${padLeft(String(total), countWidth)}${showPercentage ? `  ${padLeft('100%', pctWidth)}` : ''}`

  // Build each data row as a single line string (without dot and bar)
  function buildRowMiddle(item: ItemData & { resolvedColor: string }): string {
    return `${padRight(item.label, labelWidth)}  ${padLeft(String(item.value), countWidth)}${showPercentage ? `  ${padLeft(formatPct(item.value), pctWidth)}` : ''}  `
  }

  // Each row rendered as a single <text> with the bar appended.
  // We use a single text per row to avoid flex splitting issues.
  // The dot color is the only part that differs, so we render:
  // <box><text colored>● </text><text>label count % bar</text></box>
  // But that had alignment issues. Instead, render each row as a single line
  // where the prefix is plain text and we just put the colored bar in a box after.

  return (
    <box flexDirection="column" flexShrink={0}>
      {/* Header row */}
      {showHeader && (
        <>
          <box height={1} flexShrink={0}>
            <text fg={theme.textMuted}>{headerText}</text>
          </box>
          <box height={1} flexShrink={0}>
            <text fg={theme.borderSubtle}>{separator}</text>
          </box>
        </>
      )}

      {/* Data rows: each row is a single <box> with fixed-width prefix + colored bar */}
      {coloredItems.map((item, i) => {
        const middle = buildRowMiddle(item)
        const bar = makeBar(item.value)
        // Prefix width: dot(2) + middle text length
        const prefixWidth = 2 + middle.length
        return (
          <box key={i} flexDirection="row" height={1} flexShrink={0}>
            <box width={prefixWidth} flexShrink={0} flexDirection="row">
              <text fg={item.resolvedColor}>{'● '}</text>
              <text fg={theme.text}>{middle}</text>
            </box>
            <text fg={item.resolvedColor}>{bar}</text>
          </box>
        )
      })}

      {/* Footer: separator + total */}
      {showTotal && (
        <>
          <box height={1} flexShrink={0}>
            <text fg={theme.borderSubtle}>{separator}</text>
          </box>
          <box height={1} flexShrink={0}>
            <text fg={theme.textMuted}>{totalText}</text>
          </box>
        </>
      )}
    </box>
  )
}

Histogram.Item = HistogramItem

export { Histogram }
