/**
 * DottedLineGraph renders metric-style dotted line charts with braille subcells.
 *
 * Each terminal cell contains a 2×4 braille grid, so diagonal and step changes
 * can move by half columns and quarter rows instead of snapping to full cells.
 */

import React, { ReactNode, useMemo, useRef } from 'react'
import { Renderable, RGBA } from '@opentui/core'
import type { OptimizedBuffer, RenderableOptions, RenderContext, MouseEvent as OpenTUIMouseEvent } from '@opentui/core'
import { extend } from '@opentui/react'
import { Color, resolveColor } from 'termcast/src/colors'
import { getThemePalette, useTheme } from 'termcast/src/theme'
import { ChartTooltip, useChartTooltip, computeDataIndexFromMouseX, interpolateXLabel, formatTooltipLine } from 'termcast/src/components/chart-tooltip'

const BRAILLE_BITS: number[][] = [
  [1, 8],
  [2, 16],
  [4, 32],
  [64, 128],
]

export interface DottedLineGraphSeriesData {
  data: number[]
  color: string
}

export interface DottedLineGraphPlotOptions extends RenderableOptions {
  series?: DottedLineGraphSeriesData[]
  xLabels?: string[]
  yMin?: number
  yMax?: number
  yTicks?: number
  yFormat?: (value: number) => string
  axisColor?: string
  dotSpacing?: number
}

class DottedLineGraphPlotRenderable extends Renderable {
  private _series: DottedLineGraphSeriesData[] = []
  private _xLabels: string[] = []
  private _yMin = 0
  private _yMax = 100
  private _yTicks = 5
  private _yFormat: (value: number) => string = (value) => {
    return value >= 1000 ? value.toFixed(0) : value.toFixed(1)
  }
  private _axisColor = '#666666'
  private _dotSpacing = 2

  constructor(ctx: RenderContext, options: DottedLineGraphPlotOptions) {
    super(ctx, options)
    if (options.series) this._series = options.series
    if (options.xLabels) this._xLabels = options.xLabels
    if (options.yMin !== undefined) this._yMin = options.yMin
    if (options.yMax !== undefined) this._yMax = options.yMax
    if (options.yTicks !== undefined) this._yTicks = options.yTicks
    if (options.yFormat) this._yFormat = options.yFormat
    if (options.axisColor) this._axisColor = options.axisColor
    if (options.dotSpacing !== undefined) this._dotSpacing = options.dotSpacing

    this.computeLayout = this.computeLayout.bind(this)
    this.drawAxes = this.drawAxes.bind(this)
    this.drawSeries = this.drawSeries.bind(this)
    this.setDot = this.setDot.bind(this)
  }

  set series(value: DottedLineGraphSeriesData[]) { this._series = value; this.requestRender() }
  set xLabels(value: string[]) { this._xLabels = value; this.requestRender() }
  set yMin(value: number) { this._yMin = value; this.requestRender() }
  set yMax(value: number) { this._yMax = value; this.requestRender() }
  set yTicks(value: number) { this._yTicks = value; this.requestRender() }
  set yFormat(value: (value: number) => string) { this._yFormat = value; this.requestRender() }
  set axisColor(value: string) { this._axisColor = value; this.requestRender() }
  set dotSpacing(value: number) { this._dotSpacing = value; this.requestRender() }

  /** Public accessor for tooltip coordinate mapping */
  getPlotLayout() { return this.computeLayout() }

  /** Current series data for tooltip value lookup */
  getSeries() { return this._series }

  private computeLayout(): {
    plotX: number
    plotY: number
    plotW: number
    plotH: number
    yAxisWidth: number
    yLabels: string[]
  } | null {
    if (this.width <= 0 || this.height <= 0) return null

    const safeTicks = Math.max(2, Math.floor(this._yTicks))
    const yLabels = Array.from({ length: safeTicks }, (_, index) => {
      const value = this._yMin + (this._yMax - this._yMin) * (1 - index / (safeTicks - 1))
      return this._yFormat(value)
    })
    const yAxisWidth = Math.max(...yLabels.map((label) => {
      return label.length
    }))
    const plotX = this.x + yAxisWidth + 1
    const plotY = this.y
    const plotW = this.width - yAxisWidth - 1
    const plotH = this.height - 1

    if (plotW <= 0 || plotH <= 0) return null
    return { plotX, plotY, plotW, plotH, yAxisWidth, yLabels }
  }

  private drawAxes(buffer: OptimizedBuffer, layout: {
    plotX: number
    plotY: number
    plotW: number
    plotH: number
    yAxisWidth: number
    yLabels: string[]
  }): void {
    const { plotX, plotY, plotW, plotH, yAxisWidth, yLabels } = layout
    const axisColor = RGBA.fromHex(this._axisColor)
    const labelRows = new Set<number>()

    yLabels.forEach((label, index) => {
      const row = Math.round(plotY + (index / Math.max(1, yLabels.length - 1)) * (plotH - 1))
      labelRows.add(row)
      buffer.drawText(label, this.x + yAxisWidth - label.length, row, axisColor)
      buffer.drawText('│', this.x + yAxisWidth, row, axisColor)
    })

    for (let row = plotY; row < plotY + plotH; row++) {
      if (!labelRows.has(row)) {
        buffer.drawText('│', this.x + yAxisWidth, row, axisColor)
      }
    }

    // X-axis labels (skip labels that would overlap the previous one)
    let occupiedEnd = -1
    this._xLabels.forEach((label, index) => {
      if (!label) return
      const labelX = plotX + Math.round((index / Math.max(1, this._xLabels.length - 1)) * (plotW - 1))
      const centeredX = Math.max(plotX, Math.min(labelX - Math.floor(label.length / 2), plotX + plotW - label.length))
      if (centeredX <= occupiedEnd) return
      buffer.drawText(label, centeredX, plotY + plotH, axisColor)
      occupiedEnd = centeredX + label.length
    })
  }

  private setDot({
    px,
    py,
    plotW,
    plotH,
    cellBits,
    cellColors,
    color,
  }: {
    px: number
    py: number
    plotW: number
    plotH: number
    cellBits: Uint8Array
    cellColors: RGBA[]
    color: RGBA
  }): void {
    if (px < 0 || py < 0 || px >= plotW * 2 || py >= plotH * 4) return

    const cellX = Math.floor(px / 2)
    const cellY = Math.floor(py / 4)
    const cellIndex = cellY * plotW + cellX
    cellBits[cellIndex] = cellBits[cellIndex]! | BRAILLE_BITS[py % 4]![px % 2]!
    cellColors[cellIndex] = color
  }

  private drawSeries({
    series,
    plotW,
    plotH,
    cellBits,
    cellColors,
  }: {
    series: DottedLineGraphSeriesData
    plotW: number
    plotH: number
    cellBits: Uint8Array
    cellColors: RGBA[]
  }): void {
    const yRange = this._yMax - this._yMin
    if (series.data.length === 0 || yRange === 0) return

    const color = RGBA.fromHex(series.color)
    const virtualW = plotW * 2
    const virtualH = plotH * 4
    const dotSpacing = Math.max(1, Math.floor(this._dotSpacing))
    const toPoint = (value: number, index: number) => {
      const normalized = (value - this._yMin) / yRange
      return {
        x: Math.round((index / Math.max(1, series.data.length - 1)) * (virtualW - 1)),
        y: Math.round((1 - normalized) * (virtualH - 1)),
      }
    }

    if (series.data.length === 1) {
      const point = toPoint(series.data[0]!, 0)
      this.setDot({ px: point.x, py: point.y, plotW, plotH, cellBits, cellColors, color })
      return
    }

    series.data.slice(0, -1).forEach((value, index) => {
      const start = toPoint(value, index)
      const end = toPoint(series.data[index + 1]!, index + 1)
      const dx = Math.abs(end.x - start.x)
      const dy = Math.abs(end.y - start.y)
      const sx = start.x < end.x ? 1 : -1
      const sy = start.y < end.y ? 1 : -1
      let error = dx - dy
      let x = start.x
      let y = start.y
      let step = index === 0 ? 0 : 1

      while (true) {
        if (step % dotSpacing === 0 || (x === end.x && y === end.y)) {
          this.setDot({ px: x, py: y, plotW, plotH, cellBits, cellColors, color })
        }
        if (x === end.x && y === end.y) break

        const error2 = error * 2
        if (error2 > -dy) { error -= dy; x += sx }
        if (error2 < dx) { error += dx; y += sy }
        step++
      }
    })
  }

  protected renderSelf(buffer: OptimizedBuffer): void {
    const layout = this.computeLayout()
    if (!layout) return

    this.drawAxes(buffer, layout)
    if (this._series.length === 0 || this._yMax === this._yMin) return

    const transparent = RGBA.fromValues(0, 0, 0, 0)
    const cellCount = layout.plotW * layout.plotH
    const cellBits = new Uint8Array(cellCount)
    const cellColors = Array.from({ length: cellCount }, () => {
      return transparent
    })

    this._series.forEach((series) => {
      this.drawSeries({ series, plotW: layout.plotW, plotH: layout.plotH, cellBits, cellColors })
    })

    for (let y = 0; y < layout.plotH; y++) {
      for (let x = 0; x < layout.plotW; x++) {
        const cellIndex = y * layout.plotW + x
        const bits = cellBits[cellIndex]!
        if (bits === 0) continue
        buffer.setCell(layout.plotX + x, layout.plotY + y, String.fromCharCode(0x2800 + bits), cellColors[cellIndex]!, transparent)
      }
    }
  }
}

extend({ 'dotted-line-graph-plot': DottedLineGraphPlotRenderable })

declare module '@opentui/react' {
  interface OpenTUIComponents {
    'dotted-line-graph-plot': typeof DottedLineGraphPlotRenderable
  }
}

export interface DottedLineGraphSeriesProps {
  /** Y-values for this metric line */
  data: number[]
  /** Override the auto-assigned color */
  color?: Color.ColorLike
  /** Series label shown in the legend */
  title?: string
}

export interface DottedLineGraphProps {
  /** Height of the plot area in terminal rows (default: 10) */
  height?: number
  /** X-axis labels */
  xLabels?: string[]
  /** Manual Y-axis range [min, max] (default: auto from data) */
  yRange?: [number, number]
  /** Number of Y-axis tick labels (default: 4) */
  yTicks?: number
  /** Custom Y-axis label formatter */
  yFormat?: (value: number) => string
  /** Gap between dots in virtual braille pixels (default: 2) */
  dotSpacing?: number
  /** Show compact legend (default: true when any series has a title) */
  showLegend?: boolean
  /** DottedLineGraph.Series children */
  children: ReactNode
}

interface DottedLineGraphType {
  (props: DottedLineGraphProps): any
  Series: (props: DottedLineGraphSeriesProps) => any
}

const DottedLineGraphSeries = (_props: DottedLineGraphSeriesProps): any => {
  return null
}

function formatDefaultTick(value: number): string {
  return value >= 1000 ? value.toFixed(0) : value.toFixed(1)
}

const DottedLineGraph: DottedLineGraphType = (props) => {
  const theme = useTheme()
  const {
    height = 10,
    xLabels = [],
    yRange,
    yTicks = 4,
    yFormat,
    dotSpacing = 2,
    showLegend,
    children,
  } = props
  const palette = getThemePalette(theme)
  const containerRef = useRef<any>(null)
  const plotRef = useRef<DottedLineGraphPlotRenderable>(null)
  const { tooltip, show: showTooltip, hide: hideTooltip } = useChartTooltip()

  const series = useMemo<Array<DottedLineGraphSeriesData & { title?: string }>>(() => {
    return React.Children.toArray(children)
      .filter(React.isValidElement)
      .map((child, index) => {
        const childProps = child.props as DottedLineGraphSeriesProps
        return {
          data: childProps.data,
          color: resolveColor(childProps.color) || palette[index % palette.length]!,
          title: childProps.title,
        }
      })
      .filter((item) => {
        return Array.isArray(item.data)
      })
  }, [children, palette])

  const computedYRange = useMemo<[number, number]>(() => {
    if (yRange) return yRange

    const values = series.flatMap((item) => {
      return item.data
    })
    if (values.length === 0) return [0, 100]

    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = max === min ? Math.max(1, Math.abs(max) * 0.1) : (max - min) * 0.08
    return [min - padding, max + padding]
  }, [series, yRange])

  const legendRows = series.filter((item) => {
    return Boolean(item.title)
  })
  const legendVisible = showLegend ?? legendRows.length > 0
  const plotSeries = series.map((item) => {
    return { data: item.data, color: item.color }
  })
  const legendPaddingLeft = useMemo(() => {
    const safeTicks = Math.max(2, Math.floor(yTicks))
    const tickFormat = yFormat || formatDefaultTick
    const yLabels = Array.from({ length: safeTicks }, (_, index) => {
      const value = computedYRange[0] + (computedYRange[1] - computedYRange[0]) * (1 - index / (safeTicks - 1))
      return tickFormat(value)
    })
    return Math.max(...yLabels.map((label) => {
      return label.length
    })) + 1
  }, [computedYRange, yFormat, yTicks])

  const handleMouseMove = (evt: OpenTUIMouseEvent) => {
    const plot = plotRef.current
    if (!plot) return
    const layout = plot.getPlotLayout()
    if (!layout) return

    const allSeries = plot.getSeries()
    const maxDataLen = Math.max(0, ...allSeries.map((s) => s.data.length))
    const idx = computeDataIndexFromMouseX({
      mouseX: evt.x,
      plotX: layout.plotX,
      plotW: layout.plotW,
      dataLength: maxDataLen,
    })
    if (idx < 0) {
      hideTooltip()
      return
    }

    const label = interpolateXLabel({ dataIndex: idx, dataLength: maxDataLen, xLabels })
    const lines = series
      .filter((s) => idx < s.data.length)
      .map((s) => {
        const value = s.data[idx] ?? 0
        const prefix = s.title ? `${s.title}` : label
        return formatTooltipLine(prefix, Number(value.toFixed(2)))
      })
    // Prepend x-axis label when multiple series
    if (series.length > 1 && lines.length > 0) {
      lines.unshift(label)
    }
    if (lines.length > 0) {
      showTooltip({ x: evt.x, y: evt.y, lines })
    }
  }

  if (series.length === 0) return null

  return (
    <box ref={containerRef} flexDirection="column" width="100%" flexShrink={0} onMouseOut={hideTooltip}>
      <ChartTooltip tooltip={tooltip} containerRef={containerRef} />
      <dotted-line-graph-plot
        ref={plotRef}
        width="100%"
        height={height + (xLabels.length > 0 ? 1 : 0)}
        series={plotSeries}
        xLabels={xLabels}
        yMin={computedYRange[0]}
        yMax={computedYRange[1]}
        yTicks={yTicks}
        yFormat={yFormat}
        axisColor={theme.textMuted}
        dotSpacing={dotSpacing}
        onMouseMove={handleMouseMove}
      />
      {legendVisible ? (
        <box height={1} width="100%" flexShrink={0} overflow="hidden" flexDirection="row">
          <box width={legendPaddingLeft} flexShrink={0} />
          <box flexGrow={1} flexShrink={1} overflow="hidden">
            <text wrapMode="none">
              {legendRows.map((item, index) => {
                const separator = index < legendRows.length - 1 ? '  ' : ''
                return (
                  <React.Fragment key={index}>
                    <span fg={item.color}>●</span>
                    <span fg={theme.textMuted}> {item.title}{separator}</span>
                  </React.Fragment>
                )
              })}
            </text>
          </box>
        </box>
      ) : null}
    </box>
  )
}

DottedLineGraph.Series = DottedLineGraphSeries

export { DottedLineGraph }
