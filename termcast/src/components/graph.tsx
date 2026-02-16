/**
 * Graph component for rendering line charts in the terminal using braille characters.
 *
 * Uses a custom opentui Renderable (GraphPlotRenderable) for the actual plot drawing,
 * registered via extend() so it can be used as <graph-plot> in JSX. The plot renderable
 * draws directly to OptimizedBuffer using setCell() with braille Unicode characters
 * (U+2800-U+28FF), giving 2x horizontal and 4x vertical sub-pixel resolution per
 * terminal character cell.
 *
 * The React <Graph> component is a thin wrapper that collects series data from
 * <Graph.Line> children, computes axis ranges, and passes everything to the renderable.
 *
 * Braille dot layout per cell:
 *   col0  col1
 *   1     8      row0
 *   2     16     row1
 *   4     32     row2
 *   64    128    row3
 *
 * For a plot of W cols x H rows we get W*2 x H*4 virtual pixels.
 */

import React, { ReactNode, useMemo } from 'react'
import { Renderable, RGBA } from '@opentui/core'
import type { RenderableOptions, RenderContext } from '@opentui/core'
import type { OptimizedBuffer } from '@opentui/core'
import { extend } from '@opentui/react'
import { useTheme } from 'termcast/src/theme'
import { Color, resolveColor } from 'termcast/src/colors'

// ── Braille bit map ──────────────────────────────────────────────────
// Maps (subCol, subRow) to the braille bit for that dot position.
// subCol is 0 or 1, subRow is 0..3.
const BRAILLE_BITS: number[][] = [
  // col 0       col 1
  [1, 8],      // row 0
  [2, 16],     // row 1
  [4, 32],     // row 2
  [64, 128],   // row 3
]

function brailleBit(subCol: number, subRow: number): number {
  return BRAILLE_BITS[subRow]![subCol]!
}

// ── Series data passed to the renderable ─────────────────────────────

interface SeriesData {
  data: number[]
  color: string // hex color
}

// ── GraphPlotRenderable ──────────────────────────────────────────────

interface GraphPlotOptions extends RenderableOptions {
  series?: SeriesData[]
  xLabels?: string[]
  yMin?: number
  yMax?: number
  yTicks?: number
  yFormat?: (v: number) => string
  axisColor?: string
}

class GraphPlotRenderable extends Renderable {
  private _series: SeriesData[] = []
  private _xLabels: string[] = []
  private _yMin = 0
  private _yMax = 100
  private _yTicks = 5
  private _yFormat: (v: number) => string = (v) => {
    return v >= 1000 ? v.toFixed(0) : v.toFixed(1)
  }
  private _axisColor: string = '#666666'

  constructor(ctx: RenderContext, options: GraphPlotOptions) {
    super(ctx, options)
    if (options.series) this._series = options.series
    if (options.xLabels) this._xLabels = options.xLabels
    if (options.yMin !== undefined) this._yMin = options.yMin
    if (options.yMax !== undefined) this._yMax = options.yMax
    if (options.yTicks !== undefined) this._yTicks = options.yTicks
    if (options.yFormat) this._yFormat = options.yFormat
    if (options.axisColor) this._axisColor = options.axisColor
  }

  set series(value: SeriesData[]) { this._series = value; this.requestRender() }
  set xLabels(value: string[]) { this._xLabels = value; this.requestRender() }
  set yMin(value: number) { this._yMin = value; this.requestRender() }
  set yMax(value: number) { this._yMax = value; this.requestRender() }
  set yTicks(value: number) { this._yTicks = value; this.requestRender() }
  set yFormat(value: (v: number) => string) { this._yFormat = value; this.requestRender() }
  set axisColor(value: string) { this._axisColor = value; this.requestRender() }

  protected renderSelf(buffer: OptimizedBuffer): void {
    const totalW = this.width
    const totalH = this.height
    if (totalW <= 0 || totalH <= 0) return

    const axisRgba = RGBA.fromHex(this._axisColor)
    const transparent = RGBA.fromValues(0, 0, 0, 0)

    // ── Compute Y-axis labels ──────────────────────────────────
    const yLabels: string[] = []
    for (let i = 0; i < this._yTicks; i++) {
      const value = this._yMin + (this._yMax - this._yMin) * (1 - i / (this._yTicks - 1))
      yLabels.push(this._yFormat(value))
    }
    const yAxisWidth = Math.max(...yLabels.map((l) => l.length))

    // Plot area dimensions (1 col for the │ separator)
    const plotX = this.x + yAxisWidth + 1
    const plotY = this.y
    // Reserve 1 row for x-axis labels at bottom
    const plotH = totalH - 1
    const plotW = totalW - yAxisWidth - 1
    if (plotW <= 0 || plotH <= 0) return

    // ── Draw Y-axis labels ─────────────────────────────────────
    for (let i = 0; i < this._yTicks; i++) {
      const row = Math.round(plotY + (i / (this._yTicks - 1)) * (plotH - 1))
      const label = yLabels[i]!
      const labelX = this.x + yAxisWidth - label.length
      buffer.drawText(label, labelX, row, axisRgba)
      // Draw the │ separator
      buffer.drawText('│', this.x + yAxisWidth, row, axisRgba)
    }

    // Fill in │ for rows without labels
    for (let row = plotY; row < plotY + plotH; row++) {
      // Check if this row already has a label separator
      const hasLabel = Array.from({ length: this._yTicks }, (_, i) => {
        return Math.round(plotY + (i / (this._yTicks - 1)) * (plotH - 1))
      }).includes(row)
      if (!hasLabel) {
        buffer.drawText('│', this.x + yAxisWidth, row, axisRgba)
      }
    }

    // ── Build braille grid ─────────────────────────────────────
    // Virtual pixel dimensions
    const pixW = plotW * 2
    const pixH = plotH * 4

    // Per-cell: braille bits + color of last series to contribute
    const cellCount = plotW * plotH
    const cellBits = new Uint8Array(cellCount)
    const cellColors: RGBA[] = Array.from({ length: cellCount }, () => transparent)

    const yRange = this._yMax - this._yMin
    if (yRange === 0) return

    for (const series of this._series) {
      if (series.data.length === 0) continue
      const seriesColor = RGBA.fromHex(series.color)
      const dataLen = series.data.length

      // Map each data point to a virtual pixel y-coordinate
      const pixelYs: number[] = series.data.map((v) => {
        const normalized = (v - this._yMin) / yRange // 0 = min, 1 = max
        // Invert: top of plot is max, bottom is min
        return Math.round((1 - normalized) * (pixH - 1))
      })

      // Build per-column line Y: for each virtual pixel x, store the
      // topmost y of the line. We fill from this y down to pixH-1 (area chart).
      const lineY = new Int32Array(pixW).fill(pixH) // default: below bottom (no fill)

      // For each pair of adjacent points, trace the Bresenham line
      // and record the min y per pixel column.
      for (let i = 0; i < dataLen - 1; i++) {
        const x0 = Math.round((i / (dataLen - 1)) * (pixW - 1))
        const y0 = pixelYs[i]!
        const x1 = Math.round(((i + 1) / (dataLen - 1)) * (pixW - 1))
        const y1 = pixelYs[i + 1]!

        let dx = Math.abs(x1 - x0)
        let dy = Math.abs(y1 - y0)
        const sx = x0 < x1 ? 1 : -1
        const sy = y0 < y1 ? 1 : -1
        let err = dx - dy
        let cx = x0
        let cy = y0

        while (true) {
          if (cx >= 0 && cx < pixW && cy >= 0 && cy < pixH) {
            if (cy < lineY[cx]!) lineY[cx] = cy
          }
          if (cx === x1 && cy === y1) break
          const e2 = 2 * err
          if (e2 > -dy) { err -= dy; cx += sx }
          if (e2 < dx) { err += dx; cy += sy }
        }
      }

      // Single data point: fill a single column
      if (dataLen === 1) {
        const px = Math.round(pixW / 2)
        const py = pixelYs[0]!
        if (px >= 0 && px < pixW && py >= 0 && py < pixH) {
          lineY[px] = py
        }
      }

      // Fill area: for each pixel column, set all dots from lineY[px] to pixH-1
      for (let px = 0; px < pixW; px++) {
        const topY = lineY[px]!
        if (topY >= pixH) continue
        for (let py = topY; py < pixH; py++) {
          const cellX = Math.floor(px / 2)
          const cellY = Math.floor(py / 4)
          const subCol = px % 2
          const subRow = py % 4
          const cellIdx = cellY * plotW + cellX
          if (cellIdx >= 0 && cellIdx < cellCount) {
            cellBits[cellIdx]! |= brailleBit(subCol, subRow)
            cellColors[cellIdx] = seriesColor
          }
        }
      }
    }

    // ── Render braille cells to buffer ─────────────────────────
    for (let cy = 0; cy < plotH; cy++) {
      for (let cx = 0; cx < plotW; cx++) {
        const cellIdx = cy * plotW + cx
        const bits = cellBits[cellIdx]!
        if (bits === 0) continue
        const char = String.fromCharCode(0x2800 + bits)
        buffer.setCell(plotX + cx, plotY + cy, char, cellColors[cellIdx]!, transparent)
      }
    }

    // ── Draw X-axis labels ─────────────────────────────────────
    if (this._xLabels.length > 0) {
      const xAxisRow = plotY + plotH
      const labelCount = this._xLabels.length
      for (let i = 0; i < labelCount; i++) {
        const label = this._xLabels[i]!
        const labelX = plotX + Math.round((i / Math.max(1, labelCount - 1)) * (plotW - 1))
        // Center the label around the position, but clamp to plot bounds
        const centeredX = Math.max(plotX, Math.min(labelX - Math.floor(label.length / 2), plotX + plotW - label.length))
        buffer.drawText(label, centeredX, xAxisRow, axisRgba)
      }
    }
  }
}

// ── Register the custom renderable ───────────────────────────────────

extend({ 'graph-plot': GraphPlotRenderable })

declare module '@opentui/react' {
  interface OpenTUIComponents {
    'graph-plot': typeof GraphPlotRenderable
  }
}

// ── Default color palette for series ─────────────────────────────────

const DEFAULT_SERIES_COLORS = [
  Color.Orange,
  Color.Blue,
  Color.Green,
  Color.Purple,
  Color.Red,
  Color.Yellow,
  Color.Magenta,
]

// ── Graph.Line (data-only child, renders null) ───────────────────────

interface GraphLineProps {
  /** Y-values for this series */
  data: number[]
  /** Line color */
  color?: Color.ColorLike
  /** Series label (for future legend) */
  title?: string
}

const GraphLine = (_props: GraphLineProps): any => {
  return null
}

// ── Graph React component ────────────────────────────────────────────

interface GraphProps {
  /** Height of the graph in terminal rows (default: 15) */
  height?: number
  /** X-axis labels */
  xLabels?: string[]
  /** Manual Y-axis range [min, max] (default: auto from data) */
  yRange?: [number, number]
  /** Number of Y-axis tick labels (default: 5) */
  yTicks?: number
  /** Custom Y-axis label formatter */
  yFormat?: (v: number) => string
  /** Graph.Line children */
  children: ReactNode
}

interface GraphType {
  (props: GraphProps): any
  Line: (props: GraphLineProps) => any
}

const Graph: GraphType = (props) => {
  const theme = useTheme()
  const { height = 15, xLabels = [], yRange, yTicks = 5, yFormat, children } = props

  // Collect series data from Graph.Line children
  const series = useMemo<SeriesData[]>(() => {
    const result: SeriesData[] = []
    let colorIndex = 0
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return
      const childProps = child.props as GraphLineProps
      if (!childProps.data) return

      const color = resolveColor(childProps.color) || DEFAULT_SERIES_COLORS[colorIndex % DEFAULT_SERIES_COLORS.length]!
      result.push({
        data: childProps.data,
        color,
      })
      colorIndex++
    })
    return result
  }, [children])

  // Auto-compute Y range if not provided
  const computedYRange = useMemo<[number, number]>(() => {
    if (yRange) return yRange
    let min = Infinity
    let max = -Infinity
    for (const s of series) {
      for (const v of s.data) {
        if (v < min) min = v
        if (v > max) max = v
      }
    }
    if (min === Infinity) return [0, 100]
    // Add small padding so lines don't touch edges
    const padding = (max - min) * 0.05
    return [min - padding, max + padding]
  }, [series, yRange])

  // Total height = plot rows + 1 for x-axis labels
  const totalHeight = height + (xLabels.length > 0 ? 1 : 0)

  return (
    <graph-plot
      width="100%"
      height={totalHeight}
      series={series}
      xLabels={xLabels}
      yMin={computedYRange[0]}
      yMax={computedYRange[1]}
      yTicks={yTicks}
      yFormat={yFormat}
      axisColor={theme.textMuted}
    />
  )
}

Graph.Line = GraphLine

export { Graph, GraphPlotRenderable }
export type { GraphProps, GraphLineProps, SeriesData }
