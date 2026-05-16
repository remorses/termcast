/**
 * BarGraph component for rendering vertical stacked bar charts in the terminal.
 *
 * Pure React/opentui implementation using <box> elements with justifyContent
 * "space-evenly" for bar distribution. Each bar is a column of stacked colored
 * segments sized via flexGrow. Segments render with a thin lower-block glyph
 * instead of painted backgrounds, which keeps the chart airy like Histogram.
 * Y-axis labels render on the left. X-axis labels sit below each bar, truncated with
 * overflow="hidden" when the bar is narrower than the label text.
 *
 * Legend is a compact bottom row by default. Use legendPosition="right"
 * for a right-side column.
 *
 * Color palette comes from getThemePalette() and cycles with %.
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
  /** Width of each bar in terminal columns (default: 3) */
  barWidth?: number
  /** Gap between bars in terminal columns (default: 1) */
  barGap?: number
  /** Character used for bar cells (default: "▃") */
  barCharacter?: string
  /** Show Y-axis labels and separator (default: true) */
  showYAxis?: boolean
  /** Number of Y-axis tick labels (default: 5) */
  yTicks?: number
  /** Custom Y-axis label formatter */
  yFormat?: (value: number) => string
  /** Show compact legend (default: true when any series has a title) */
  showLegend?: boolean
  /** Legend placement (default: "bottom") */
  legendPosition?: 'bottom' | 'right'
  /** BarGraph.Series children */
  children: ReactNode
}

// ── Internal types ───────────────────────────────────────────────────

// ── BarGraph.Series (data-only, renders null like Graph.Line) ────────

const BarGraphSeries = (_props: BarGraphSeriesProps): any => {
  return null
}

// ── Main BarGraph component ──────────────────────────────────────────

const BarGraph: {
  (props: BarGraphProps): any
  Series: (props: BarGraphSeriesProps) => any
} = (props) => {
  const theme = useTheme()
  const {
    height = 15,
    labels = [],
    barWidth = 3,
    barGap = 1,
    barCharacter = '▃',
    showYAxis = true,
    yTicks = 5,
    yFormat,
    showLegend,
    legendPosition = 'bottom',
    children,
    ...rest
  } = props

  const palette = getThemePalette(theme)

  // Collect series from children
  const seriesList = useMemo<Array<{ data: number[]; color: string; title?: string }>>(() => {
    return React.Children.toArray(children)
      .filter(React.isValidElement)
      .map((child, index) => {
        const childProps = child.props as BarGraphSeriesProps
        return {
          data: childProps.data,
          color: resolveColor(childProps.color) || palette[index % palette.length]!,
          title: childProps.title,
        }
      })
      .filter((series) => {
        return Array.isArray(series.data)
      })
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
  const legendRows = seriesList.filter((series) => {
    return Boolean(series.title)
  })
  const legendTitleWidth = Math.max(0, ...legendRows.map((series) => {
    return series.title?.length || 0
  }))
  const legendGap = 1
  const legendWidth = legendVisible ? legendGap + 2 + legendTitleWidth : 0
  const legendOnRight = legendVisible && legendPosition === 'right'
  const legendOnBottom = legendVisible && legendPosition === 'bottom'
  const hasLabels = labels.length > 0
  const plotHeight = Math.max(1, height - (hasLabels ? 1 : 0))
  const safeBarWidth = Math.max(1, Math.floor(barWidth))
  const safeBarGap = Math.max(0, Math.floor(barGap))
  const safeYTicks = Math.max(2, Math.floor(yTicks))
  const formatYValue = yFormat || ((value: number) => {
    return value >= 1000 ? value.toFixed(0) : value.toFixed(1)
  })
  const yAxisLabels = Array.from({ length: safeYTicks }, (_, index) => {
    const value = maxTotal * (1 - index / (safeYTicks - 1))
    return formatYValue(value)
  })
  const yAxisWidth = showYAxis ? Math.max(...yAxisLabels.map((label) => label.length)) : 0
  const yAxisLabelByRow = new Map(yAxisLabels.map((label, index) => {
    const row = Math.round((index / (safeYTicks - 1)) * (plotHeight - 1))
    return [row, label] as const
  }))
  const xAxisWidth = numBars * safeBarWidth + Math.max(0, numBars - 1) * safeBarGap
  const xAxisLabelLine = (() => {
    const chars = Array.from({ length: xAxisWidth }, () => ' ')
    let occupiedEnd = -1

    labels.forEach((label, index) => {
      if (!label) {
        return
      }
      const visibleLabel = label.slice(0, xAxisWidth)
      const barStart = index * (safeBarWidth + safeBarGap)
      const barCenter = barStart + Math.floor(safeBarWidth / 2)
      const labelStart = Math.max(0, Math.min(
        barCenter - Math.floor(visibleLabel.length / 2),
        xAxisWidth - visibleLabel.length,
      ))

      if (labelStart <= occupiedEnd) {
        return
      }

      Array.from(visibleLabel).forEach((char, charIndex) => {
        chars[labelStart + charIndex] = char
      })
      occupiedEnd = labelStart + visibleLabel.length - 1
    })

    return chars.join('')
  })()

  if (numBars === 0 || maxTotal === 0) {
    return null
  }

  return (
    <box flexDirection={legendOnRight ? 'row' : 'column'} {...rest}>
      <box flexDirection="column" flexGrow={1} flexShrink={1} overflow="hidden">
        <box flexDirection="row" height={height} width="100%" alignItems="flex-start" overflow="hidden">
          {showYAxis ? (
            <box flexDirection="column" width={yAxisWidth + 1} height={height} flexShrink={0} overflow="hidden">
              {Array.from({ length: plotHeight }, (_, row) => {
                const label = yAxisLabelByRow.get(row) || ''
                return (
                  <box key={row} flexDirection="row" height={1} flexShrink={0} overflow="hidden">
                    <box width={yAxisWidth} overflow="hidden" flexShrink={0}>
                      <text wrapMode="none" fg={theme.textMuted}>{label.padStart(yAxisWidth)}</text>
                    </box>
                    <text wrapMode="none" fg={theme.textMuted}>│</text>
                  </box>
                )
              })}
              {hasLabels ? <box height={1} flexShrink={0} /> : null}
            </box>
          ) : null}

          <box flexDirection="column" height={height} flexGrow={1} flexShrink={1} overflow="hidden">
            {/* Bars area: overflow="hidden" clips excess bars when there are too many.
                alignItems="flex-start" left-aligns bars in wide containers. */}
            <box flexDirection="row" height={plotHeight} width="100%" alignItems="flex-start" overflow="hidden">
              {Array.from({ length: numBars }, (_, barIdx) => {
                const barTotal = stackedTotals[barIdx]!
                const emptyGrow = maxTotal - barTotal

                return (
                  <React.Fragment key={barIdx}>
                    {barIdx > 0 && safeBarGap > 0 ? <box width={safeBarGap} flexShrink={0} /> : null}
                    <box
                      flexDirection="column"
                      height="100%"
                      flexGrow={0}
                      flexShrink={0}
                      width={safeBarWidth}
                    >
                      {/* Plot area: spacer on top pushes colored segments to the bottom
                          so all bars are bottom-aligned regardless of total value. */}
                      <box flexDirection="column" flexGrow={1} width="100%">
                        {emptyGrow > 0 && (
                          <box flexGrow={emptyGrow} />
                        )}
                        {/* Segments: last series at top, first at bottom. The repeated
                            lower-block glyph wraps inside the fixed-width segment, so it
                            stays visible in snapshots without filling the whole cell. */}
                        {[...seriesList].reverse().map((series, reverseIdx) => {
                          const value = series.data[barIdx] || 0
                          if (value <= 0) {
                            return null
                          }
                          return (
                            <box
                              key={reverseIdx}
                              flexGrow={value}
                              width="100%"
                              minHeight={1}
                              overflow="hidden"
                            >
                              {/* Absolute-positioned text doesn't affect flex layout.
                                  The parent height is purely from flexGrow. The text
                                  wraps to fill the area and gets clipped. */}
                              <box position="absolute" width="100%" height="100%" overflow="hidden">
                                <text fg={series.color}>{barCharacter.repeat(200)}</text>
                              </box>
                            </box>
                          )
                        })}
                      </box>
                    </box>
                  </React.Fragment>
                )
              })}
            </box>
            {hasLabels ? (
              <box height={1} width="100%" overflow="hidden" flexShrink={0}>
                <text wrapMode="none" fg={theme.textMuted}>{xAxisLabelLine}</text>
              </box>
            ) : null}
          </box>
        </box>
      </box>

      {/* Legend: right side. Labels stay left-aligned, color swatches sit on the right. */}
      {legendOnRight && (
        <box
          flexDirection="column"
          width={legendWidth}
          height={height}
          flexShrink={0}
          overflow="hidden"
        >
          <box flexDirection="column" height={height} justifyContent="flex-end" overflow="hidden">
            {legendRows.map((series, index) => {
              return (
                <box key={index} flexDirection="row" height={1} flexShrink={0} overflow="hidden">
                  <box width={legendGap} flexShrink={0} />
                  <box width={legendTitleWidth} overflow="hidden" flexShrink={0}>
                    <text fg={theme.textMuted} wrapMode="none">{series.title}</text>
                  </box>
                  <text fg={series.color} wrapMode="none"> ■</text>
                </box>
              )
            })}
          </box>
        </box>
      )}
      {legendOnBottom && (
        <box height={1} width="100%" flexShrink={0} overflow="hidden">
          <text wrapMode="none">
            {legendRows.map((series, index) => {
              const separator = index < legendRows.length - 1 ? '  ' : ''
              return (
                <React.Fragment key={index}>
                  <span fg={theme.textMuted}>{series.title} </span>
                  <span fg={series.color}>■</span>
                  <span fg={theme.textMuted}>{separator}</span>
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
