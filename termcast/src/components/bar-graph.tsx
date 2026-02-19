/**
 * BarGraph component for rendering vertical stacked bar charts in the terminal.
 *
 * Pure React/opentui implementation using <box> elements with justifyContent
 * "space-evenly" for bar distribution. Each bar is a column of stacked colored
 * segments sized via flexGrow. Labels sit below each bar, truncated with
 * overflow="hidden" when the bar is narrower than the label text.
 *
 * Legend is a compact row of ■ Title pairs, no border.
 *
 * Color palette (same as Graph and BarChart):
 *   accent, info, success, warning, error, secondary, primary (cycles with %)
 */

import React, { ReactNode, useMemo } from 'react'
import { BoxProps } from '@opentui/react'
import { useTheme, getThemePalette } from 'termcast/src/theme'
import { Color, resolveColor } from 'termcast/src/colors'

// ── Types ────────────────────────────────────────────────────────────

export interface BarGraphSeriesProps {
  /** One value per bar position */
  data: number[]
  /** Override the auto-assigned color */
  color?: Color.ColorLike
  /** Series label shown in legend */
  title?: string
}

export interface BarGraphProps extends BoxProps {
  /** Height of the bar area in terminal rows (default: 15) */
  height?: number
  /** X-axis labels, one per bar position */
  labels?: string[]
  /** Show compact legend below the chart (default: true when any series has a title) */
  showLegend?: boolean
  /** BarGraph.Series children */
  children: ReactNode
}

interface BarGraphType {
  (props: BarGraphProps): any
  Series: (props: BarGraphSeriesProps) => any
}

// ── Internal types ───────────────────────────────────────────────────

interface CollectedSeries {
  data: number[]
  color: string
  title?: string
}

// ── BarGraph.Series (data-only, renders null like Graph.Line) ────────

const BarGraphSeries = (_props: BarGraphSeriesProps): any => {
  return null
}

// ── Main BarGraph component ──────────────────────────────────────────

const BarGraph: BarGraphType = (props) => {
  const theme = useTheme()
  const { height = 15, labels = [], showLegend, children, ...rest } = props

  const palette = getThemePalette(theme)

  // Collect series from children
  const seriesList = useMemo<CollectedSeries[]>(() => {
    const result: CollectedSeries[] = []
    let colorIndex = 0
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) {
        return
      }
      const childProps = child.props as BarGraphSeriesProps
      if (!childProps.data) {
        return
      }
      const color = resolveColor(childProps.color) || palette[colorIndex % palette.length]!
      result.push({
        data: childProps.data,
        color,
        title: childProps.title,
      })
      colorIndex++
    })
    return result
  }, [children, palette])

  // Compute number of bars from max data length across series
  const numBars = useMemo(() => {
    return Math.max(0, ...seriesList.map((s) => s.data.length))
  }, [seriesList])

  // Compute stacked totals per bar position and the global max
  const { stackedTotals, maxTotal } = useMemo(() => {
    const totals: number[] = []
    for (let i = 0; i < numBars; i++) {
      let sum = 0
      for (const series of seriesList) {
        sum += series.data[i] || 0
      }
      totals.push(sum)
    }
    const max = Math.max(0, ...totals)
    return { stackedTotals: totals, maxTotal: max }
  }, [seriesList, numBars])

  // Whether to show legend: explicit prop, or auto when any series has a title
  const legendVisible = showLegend ?? seriesList.some((s) => s.title)

  if (numBars === 0 || maxTotal === 0) {
    return null
  }

  return (
    <box flexDirection="column" {...rest}>
      {/* Bars area: overflow="hidden" clips excess bars when there are too many.
          alignItems="flex-start" left-aligns bars in wide containers. */}
      <box flexDirection="row" height={height} width="100%" alignItems="flex-start" overflow="hidden">
        {Array.from({ length: numBars }, (_, barIdx) => {
          const barTotal = stackedTotals[barIdx]!
          const emptyGrow = maxTotal - barTotal
          const label = labels[barIdx]

          const barElements: any[] = []

          // Min 1-col gap between bars (not before the first bar)
          if (barIdx > 0) {
            barElements.push(
              <box key={`gap-${barIdx}`} width={1} flexShrink={0} />
            )
          }

          barElements.push(
            <box
              key={barIdx}
              flexDirection="column"
              height="100%"
              flexGrow={0}
              flexShrink={0}
              width={3}
            >
              {/* Plot area: spacer on top pushes colored segments to the bottom
                  so all bars are bottom-aligned regardless of total value. */}
              <box flexDirection="column" flexGrow={1} width="100%">
                {emptyGrow > 0 && (
                  <box flexGrow={emptyGrow} />
                )}
                {/* Segments: last series at top, first at bottom.
                    Each segment uses backgroundColor for the visual fill, plus
                    a single █ with matching fg so bars appear in text snapshots.
                    wrapMode="none" prevents text from expanding the segment height. */}
                {[...seriesList].reverse().map((series, reverseIdx) => {
                  const value = series.data[barIdx] || 0
                  if (value <= 0) {
                    return null
                  }
                  return (
                    <box
                      key={reverseIdx}
                      flexGrow={value}
                      backgroundColor={series.color}
                      width="100%"
                      minHeight={1}
                      overflow="hidden"
                    >
                      {/* Absolute-positioned text doesn't affect flex layout.
                          The parent height is purely from flexGrow. The text
                          wraps to fill the area and gets clipped. */}
                      <box position="absolute" width="100%" height="100%" overflow="hidden">
                        <text fg={series.color}>{'█'.repeat(200)}</text>
                      </box>
                    </box>
                  )
                })}
              </box>
              {/* X-axis label */}
              {label !== undefined && (
                <box height={1} width="100%" overflow="hidden" flexShrink={0}>
                  <text wrapMode="none" fg={theme.textMuted}>{label}</text>
                </box>
              )}
            </box>
          )

          return barElements
        })}
      </box>
      {/* Legend: single line, no wrap, clips when too many series */}
      {legendVisible && (
        <box height={1} width="100%" flexShrink={0} overflow="hidden">
          <text wrapMode="none">
            {seriesList.filter((s) => s.title).map((series, i, arr) => {
              const sep = i < arr.length - 1 ? ' ' : ''
              return (
                <React.Fragment key={i}>
                  <span fg={series.color}>■ </span>
                  <span fg={theme.textMuted}>{series.title}{sep}</span>
                </React.Fragment>
              )
            })}
          </text>
        </box>
      )}
    </box>
  )
}

BarGraph.Series = BarGraphSeries

export { BarGraph }
