/**
 * Histogram component for rendering horizontal distribution tables in the terminal.
 *
 * Each row displays a colored dot, label, count, percentage, and a horizontal
 * bar made of repeated characters. Includes optional header and totals footer.
 *
 * Colors can be set per-item via props, or auto-assigned from the theme palette
 * in row order (cycling when there are more items than palette colors).
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
  /** Max display width for labels; longer labels are truncated (default: 24) */
  maxLabelWidth?: number
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
  /** Display label (possibly truncated) */
  displayLabel: string
  value: number
  color?: string
}

// ── Collect children recursively (handles fragments) ─────────────────

function collectItems(children: ReactNode, maxLabelWidth: number): ItemData[] {
  const result: ItemData[] = []
  const flatten = (node: ReactNode) => {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) return
      // Traverse fragments
      if (child.type === React.Fragment) {
        flatten(child.props.children)
        return
      }
      const p = child.props as HistogramItemProps
      if (p.label === undefined || p.value === undefined) return
      const displayLabel = p.label.length > maxLabelWidth
        ? p.label.slice(0, maxLabelWidth - 1) + '…'
        : p.label
      result.push({
        label: p.label,
        displayLabel,
        value: p.value,
        color: resolveColor(p.color),
      })
    })
  }
  flatten(children)
  return result
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
    maxLabelWidth = 24,
    children,
  } = props

  const palette = getThemePalette(theme)

  // Collect item data from children (traverses fragments)
  const items = useMemo<ItemData[]>(() => {
    return collectItems(children, maxLabelWidth)
  }, [children, maxLabelWidth])

  // Resolve colors: explicit prop > row-order palette assignment
  const coloredItems = useMemo(() => {
    return items.map((item, index) => ({
      ...item,
      resolvedColor: item.color || palette[index % palette.length]!,
    }))
  }, [items, palette])

  const total = useMemo(() => {
    return coloredItems.reduce((sum, item) => sum + item.value, 0)
  }, [coloredItems])

  const maxValue = useMemo(() => {
    return Math.max(...coloredItems.map((item) => item.value))
  }, [coloredItems])

  if (coloredItems.length === 0 || total === 0) return null

  // Compute column widths from data
  const labelWidth = Math.max(...coloredItems.map((item) => item.displayLabel.length), 5)
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
    if (value <= 0 || maxValue <= 0) return ''
    const barLen = Math.max(1, Math.round((value / maxValue) * maxBarWidth))
    return barCharacter.repeat(barLen)
  }

  // ── Separator line ───────────────────────────────────────────────

  const percentageWidth = showPercentage ? 2 + pctWidth : 0
  const separatorWidth = 2 + labelWidth + 2 + countWidth + percentageWidth + 2 + maxBarWidth
  const separator = '─'.repeat(separatorWidth)

  // Build header text as a single string
  const headerText = `  ${padRight('category', labelWidth)}  ${padLeft('count', countWidth)}${showPercentage ? `  ${padLeft('%', pctWidth)}` : ''}  distribution`

  // Build total text as a single string
  const totalText = `  ${padRight('total', labelWidth)}  ${padLeft(String(total), countWidth)}${showPercentage ? `  ${padLeft('100%', pctWidth)}` : ''}`

  // Build each data row as a single line string (without dot and bar)
  function buildRowMiddle(item: ItemData & { resolvedColor: string }): string {
    return `${padRight(item.displayLabel, labelWidth)}  ${padLeft(String(item.value), countWidth)}${showPercentage ? `  ${padLeft(formatPct(item.value), pctWidth)}` : ''}  `
  }

  return (
    <box flexDirection="column" flexShrink={0}>
      {/* Header row */}
      {showHeader && (
        <>
          <box height={1} flexShrink={0}>
            <text fg={theme.textMuted} wrapMode="none">{headerText}</text>
          </box>
          <box height={1} flexShrink={0}>
            <text fg={theme.borderSubtle} wrapMode="none">{separator}</text>
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
              <text fg={item.resolvedColor} wrapMode="none">{'● '}</text>
              <text fg={theme.text} wrapMode="none">{middle}</text>
            </box>
            {bar && <text fg={item.resolvedColor} wrapMode="none">{bar}</text>}
          </box>
        )
      })}

      {/* Footer: separator + total */}
      {showTotal && (
        <>
          <box height={1} flexShrink={0}>
            <text fg={theme.borderSubtle} wrapMode="none">{separator}</text>
          </box>
          <box height={1} flexShrink={0}>
            <text fg={theme.textMuted} wrapMode="none">{totalText}</text>
          </box>
        </>
      )}
    </box>
  )
}

Histogram.Item = HistogramItem

export { Histogram }
