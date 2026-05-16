/**
 * HorizontalBarGraph renders multi-series horizontal stacked bars.
 *
 * Each row is one category, usually a time bucket. The left chart area grows to
 * fill available space while the right legend uses only the width needed for
 * colored series rows and percentages.
 */

import React, { ReactNode, useMemo } from 'react'
import { BoxProps } from '@opentui/react'
import { Color, resolveColor } from 'termcast/src/colors'
import { getThemePalette, useTheme } from 'termcast/src/theme'

export interface HorizontalBarGraphSeriesProps {
  /** One value per row/category position. */
  data: number[]
  /** Series label shown in the legend. */
  title?: string
  /** Override the auto-assigned color. */
  color?: Color.ColorLike
}

export interface HorizontalBarGraphProps extends BoxProps {
  /** Row labels, one per bar position. Usually time buckets. */
  labels?: string[]
  /** Maximum chart rows to render. Defaults to all rows. */
  height?: number
  /** Character used for bar cells. Matches Histogram by default. */
  barCharacter?: string
  /** Show header row. Default true. */
  showHeader?: boolean
  /** Show right-side legend. Default true when any series has a title. */
  showLegend?: boolean
  /** Max display width for labels; longer labels are truncated. Default 16. */
  maxLabelWidth?: number
  /** Header text for the category column. Default "category". */
  categoryTitle?: string
  /** Header text for the bar column. Default "distribution". */
  distributionTitle?: string
  /** Header text for the legend column. Default "legend". */
  legendTitle?: string
  /** HorizontalBarGraph.Series children. */
  children: ReactNode
}

interface HorizontalBarGraphType {
  (props: HorizontalBarGraphProps): any
  Series: (props: HorizontalBarGraphSeriesProps) => any
}

function truncateLabel(label: string, maxLabelWidth: number): string {
  if (label.length <= maxLabelWidth) {
    return label
  }
  return label.slice(0, maxLabelWidth - 1) + '…'
}

function padRight(value: string, width: number): string {
  if (value.length >= width) {
    return value
  }
  return value + ' '.repeat(width - value.length)
}

function padLeft(value: string, width: number): string {
  if (value.length >= width) {
    return value
  }
  return ' '.repeat(width - value.length) + value
}

function formatPercentage(value: number, total: number): string {
  if (total <= 0) {
    return '0%'
  }
  return `${Math.round((value / total) * 100)}%`
}

const HorizontalBarGraphSeries = (_props: HorizontalBarGraphSeriesProps): any => {
  return null
}

const HorizontalBarGraph: HorizontalBarGraphType = (props) => {
  const theme = useTheme()
  const {
    labels = [],
    height,
    barCharacter = '╻',
    showHeader = true,
    showLegend,
    maxLabelWidth = 16,
    categoryTitle = 'category',
    distributionTitle = 'distribution',
    legendTitle = 'legend',
    children,
    ...rest
  } = props

  const palette = getThemePalette(theme)

  const seriesList = useMemo<Array<{ data: number[]; color: string; title?: string }>>(() => {
    const childArray = React.Children.toArray(children)
    return childArray
      .filter(React.isValidElement)
      .map((child, index) => {
        const childProps = child.props as HorizontalBarGraphSeriesProps
        return {
          data: childProps.data,
          title: childProps.title,
          color: resolveColor(childProps.color) || palette[index % palette.length]!,
        }
      })
      .filter((series) => {
        return Array.isArray(series.data)
      })
  }, [children, palette])

  const rowCount = useMemo(() => {
    return Math.max(labels.length, ...seriesList.map((series) => series.data.length), 0)
  }, [labels, seriesList])

  const rows = useMemo<Array<{ label: string; total: number; values: number[] }>>(() => {
    return Array.from({ length: rowCount }, (_, rowIndex) => {
      const values = seriesList.map((series) => {
        return series.data[rowIndex] || 0
      })
      const total = values.reduce((sum, value) => {
        return sum + value
      }, 0)
      return {
        label: labels[rowIndex] ?? String(rowIndex + 1),
        total,
        values,
      }
    })
  }, [labels, rowCount, seriesList])

  const visibleRows = useMemo(() => {
    return rows.slice(0, height ?? rows.length)
  }, [height, rows])

  const maxTotal = useMemo(() => {
    return Math.max(0, ...rows.map((row) => row.total))
  }, [rows])

  const legendRows = useMemo<Array<{ title: string; color: string; percentage: string; total: number }>>(() => {
    const grandTotal = rows.reduce((sum, row) => {
      return sum + row.total
    }, 0)
    return seriesList
      .map((series, seriesIndex) => {
        const seriesTotal = series.data.reduce((sum, value) => {
          return sum + value
        }, 0)
        return {
          title: series.title ?? `Series ${seriesIndex + 1}`,
          color: series.color,
          percentage: formatPercentage(seriesTotal, grandTotal),
          total: seriesTotal,
        }
      })
      .filter((row) => {
        return row.title.length > 0
      })
      .sort((a, b) => {
        return b.total - a.total
      })
  }, [rows, seriesList])

  const legendVisible = showLegend ?? seriesList.some((series) => {
    return Boolean(series.title)
  })

  if (seriesList.length === 0 || visibleRows.length === 0 || maxTotal === 0) {
    return null
  }

  const displayLabels = visibleRows.map((row) => {
    return truncateLabel(row.label, maxLabelWidth)
  })
  const displayCategoryTitle = truncateLabel(categoryTitle, maxLabelWidth)
  const labelWidth = Math.max(5, displayCategoryTitle.length, ...displayLabels.map((label) => label.length))

  const legendGap = 2
  const legendTitleWidth = Math.max(6, ...legendRows.map((row) => row.title.length))
  const legendPercentageWidth = Math.max(3, ...legendRows.map((row) => row.percentage.length))
  const legendWidth = legendVisible ? legendGap + 2 + legendTitleWidth + 2 + legendPercentageWidth : 0
  const headerHeight = showHeader ? 2 : 0
  const chartHeight = headerHeight + visibleRows.length

  return (
    <box flexDirection="column" width="100%" flexShrink={0} {...rest}>
      {showHeader && (
        <>
          <box flexDirection="row" height={1} flexShrink={0}>
            <box width={labelWidth + 2} flexShrink={0} overflow="hidden">
              <text fg={theme.textMuted} wrapMode="none">{padRight(displayCategoryTitle, labelWidth)}  </text>
            </box>
            <box flexGrow={1} flexShrink={1} overflow="hidden">
              <text fg={theme.textMuted} wrapMode="none">{distributionTitle}</text>
            </box>
            {legendVisible && (
              <box width={legendWidth} flexShrink={0} overflow="hidden">
                <text fg={theme.textMuted} wrapMode="none">{' '.repeat(legendGap)}{legendTitle}</text>
              </box>
            )}
          </box>
          <box flexDirection="row" height={1} flexShrink={0}>
            <box width={labelWidth + 2} flexShrink={0} overflow="hidden">
              <text fg={theme.borderSubtle} wrapMode="none">{'─'.repeat(labelWidth)}  </text>
            </box>
            <box flexGrow={1} flexShrink={1} overflow="hidden">
              <text fg={theme.borderSubtle} wrapMode="none">{'─'.repeat(200)}</text>
            </box>
            {legendVisible && (
              <box width={legendWidth} flexShrink={0} overflow="hidden">
                <text fg={theme.borderSubtle} wrapMode="none">{' '.repeat(legendGap)}{'─'.repeat(legendWidth - legendGap)}</text>
              </box>
            )}
          </box>
        </>
      )}

      <box flexDirection="row" height={chartHeight - headerHeight} flexShrink={0}>
        <box flexDirection="column" flexGrow={1} flexShrink={1} overflow="hidden">
          {visibleRows.map((row, rowIndex) => {
            return (
              <box key={row.label} flexDirection="row" height={1} flexShrink={0} overflow="hidden">
                <box width={labelWidth + 2} flexShrink={0} overflow="hidden">
                  <text fg={theme.text} wrapMode="none">
                    {padRight(displayLabels[rowIndex]!, labelWidth)}  
                  </text>
                </box>
                <box flexDirection="row" flexGrow={1} flexShrink={1} overflow="hidden">
                  {row.values.map((value, seriesIndex) => {
                    if (value <= 0) {
                      return null
                    }
                    const series = seriesList[seriesIndex]!
                    return (
                      <box key={seriesIndex} flexGrow={value} flexBasis={0} flexShrink={1} overflow="hidden">
                        <box position="absolute" width="100%" height="100%" overflow="hidden">
                          <text fg={series.color} wrapMode="none">{barCharacter.repeat(200)}</text>
                        </box>
                      </box>
                    )
                  })}
                  {maxTotal > row.total && (
                    <box flexGrow={maxTotal - row.total} flexBasis={0} flexShrink={1} />
                  )}
                </box>
              </box>
            )
          })}
        </box>

        {legendVisible && (
          <box flexDirection="column" width={legendWidth} flexShrink={0} overflow="hidden">
            {legendRows.map((row) => {
              return (
                <box key={row.title} height={1} flexShrink={0} flexDirection="row" overflow="hidden">
                  <box width={legendGap} flexShrink={0} />
                  <text fg={row.color} wrapMode="none">● </text>
                  <text fg={theme.textMuted} wrapMode="none">
                    {padRight(row.title, legendTitleWidth)}  {padLeft(row.percentage, legendPercentageWidth)}
                  </text>
                </box>
              )
            })}
          </box>
        )}
      </box>
    </box>
  )
}

HorizontalBarGraph.Series = HorizontalBarGraphSeries

export { HorizontalBarGraph }
