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
import { useTheme, getThemePalette } from 'termcast/src/theme'
import { Color, resolveColor } from 'termcast/src/colors'

// ── Graph variant ────────────────────────────────────────────────────
// Three rendering modes for the plot area:
// - 'area':    braille dots filling area under curve (2×4 sub-pixel resolution)
// - 'filled':  solid block characters (2× vertical sub-row resolution)
// - 'striped': all columns filled, alternating between two colors
//              (pass 'transparent' for one color to get gap-style bars)

export type GraphVariant = 'area' | 'filled' | 'striped'

// ── Block characters for Filled/Striped modes ───────────────────────
// We use ▀/▄ with fg+bg color encoding to eliminate the tiny gaps
// some terminals show between adjacent █ rows.
// ▀ = top half drawn with fg, bottom half shows bg
// ▄ = bottom half drawn with fg, top half shows bg
// ▁ = lower 1/8 block, used as a thin baseline for zero/minimum values
const UPPER_HALF = '▀'    // U+2580
const LOWER_HALF = '▄'    // U+2584
const LOWER_EIGHTH = '▁'  // U+2581

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

export interface SeriesData {
  data: number[]
  color: string // hex color
}

// ── GraphPlotRenderable ──────────────────────────────────────────────

export interface GraphPlotOptions extends RenderableOptions {
  series?: SeriesData[]
  xLabels?: string[]
  yMin?: number
  yMax?: number
  yTicks?: number
  yFormat?: (v: number) => string
  axisColor?: string
  variant?: GraphVariant
  stripeColor1?: string // hex color for even columns in striped mode
  stripeColor2?: string // hex color for odd columns in striped mode
}

export class GraphPlotRenderable extends Renderable {
  private _series: SeriesData[] = []
  private _xLabels: string[] = []
  private _yMin = 0
  private _yMax = 100
  private _yTicks = 5
  private _yFormat: (v: number) => string = (v) => {
    return v >= 1000 ? v.toFixed(0) : v.toFixed(1)
  }
  private _axisColor: string = '#666666'
  private _variant: GraphVariant = 'area'
  private _stripeColor1: string = '#0080FF'
  private _stripeColor2: string = '#FF8000'

  constructor(ctx: RenderContext, options: GraphPlotOptions) {
    super(ctx, options)
    if (options.series) this._series = options.series
    if (options.xLabels) this._xLabels = options.xLabels
    if (options.yMin !== undefined) this._yMin = options.yMin
    if (options.yMax !== undefined) this._yMax = options.yMax
    if (options.yTicks !== undefined) this._yTicks = options.yTicks
    if (options.yFormat) this._yFormat = options.yFormat
    if (options.axisColor) this._axisColor = options.axisColor
    if (options.variant) this._variant = options.variant
    if (options.stripeColor1) this._stripeColor1 = options.stripeColor1
    if (options.stripeColor2) this._stripeColor2 = options.stripeColor2
  }

  set series(value: SeriesData[]) { this._series = value; this.requestRender() }
  set xLabels(value: string[]) { this._xLabels = value; this.requestRender() }
  set yMin(value: number) { this._yMin = value; this.requestRender() }
  set yMax(value: number) { this._yMax = value; this.requestRender() }
  set yTicks(value: number) { this._yTicks = value; this.requestRender() }
  set yFormat(value: (v: number) => string) { this._yFormat = value; this.requestRender() }
  set axisColor(value: string) { this._axisColor = value; this.requestRender() }
  set variant(value: GraphVariant) { this._variant = value; this.requestRender() }
  set stripeColor1(value: string) { this._stripeColor1 = value; this.requestRender() }
  set stripeColor2(value: string) { this._stripeColor2 = value; this.requestRender() }

  // ── Shared: compute layout and draw axes ─────────────────────
  private computeLayout(): {
    plotX: number; plotY: number; plotW: number; plotH: number
    yAxisWidth: number; yLabels: string[]
  } | null {
    const totalW = this.width
    const totalH = this.height
    if (totalW <= 0 || totalH <= 0) return null

    const yLabels: string[] = []
    for (let i = 0; i < this._yTicks; i++) {
      const value = this._yMin + (this._yMax - this._yMin) * (1 - i / (this._yTicks - 1))
      yLabels.push(this._yFormat(value))
    }
    const yAxisWidth = Math.max(...yLabels.map((l) => l.length))

    const plotX = this.x + yAxisWidth + 1
    const plotY = this.y
    const plotH = totalH - 1
    const plotW = totalW - yAxisWidth - 1
    if (plotW <= 0 || plotH <= 0) return null

    return { plotX, plotY, plotW, plotH, yAxisWidth, yLabels }
  }

  private drawAxes(buffer: OptimizedBuffer, layout: {
    plotX: number; plotY: number; plotW: number; plotH: number
    yAxisWidth: number; yLabels: string[]
  }): void {
    const { plotX, plotY, plotW, plotH, yAxisWidth, yLabels } = layout
    const axisRgba = RGBA.fromHex(this._axisColor)

    // Y-axis labels + separator
    const labelRows = new Set<number>()
    for (let i = 0; i < this._yTicks; i++) {
      const row = Math.round(plotY + (i / (this._yTicks - 1)) * (plotH - 1))
      labelRows.add(row)
      const label = yLabels[i]!
      buffer.drawText(label, this.x + yAxisWidth - label.length, row, axisRgba)
      buffer.drawText('│', this.x + yAxisWidth, row, axisRgba)
    }
    for (let row = plotY; row < plotY + plotH; row++) {
      if (!labelRows.has(row)) {
        buffer.drawText('│', this.x + yAxisWidth, row, axisRgba)
      }
    }

    // X-axis labels
    if (this._xLabels.length > 0) {
      const xAxisRow = plotY + plotH
      const labelCount = this._xLabels.length
      for (let i = 0; i < labelCount; i++) {
        const label = this._xLabels[i]!
        const labelX = plotX + Math.round((i / Math.max(1, labelCount - 1)) * (plotW - 1))
        const centeredX = Math.max(plotX, Math.min(labelX - Math.floor(label.length / 2), plotX + plotW - label.length))
        buffer.drawText(label, centeredX, xAxisRow, axisRgba)
      }
    }
  }

  // ── Shared: interpolate line Y per column ────────────────────
  // Returns an array where lineY[col] = the topmost virtual-row Y
  // of the series line at that column. virtualRows is the total
  // number of virtual rows (pixW for braille, plotW for block modes).
  private computeLineYPerColumn({ series, colCount, virtualH }: {
    series: { data: number[]; color: RGBA }
    colCount: number
    virtualH: number
  }): Int32Array {
    const yRange = this._yMax - this._yMin
    const dataLen = series.data.length
    const lineY = new Int32Array(colCount).fill(virtualH)

    const pixelYs: number[] = series.data.map((v) => {
      const normalized = (v - this._yMin) / yRange
      return Math.round((1 - normalized) * (virtualH - 1))
    })

    for (let i = 0; i < dataLen - 1; i++) {
      const x0 = Math.round((i / (dataLen - 1)) * (colCount - 1))
      const y0 = pixelYs[i]!
      const x1 = Math.round(((i + 1) / (dataLen - 1)) * (colCount - 1))
      const y1 = pixelYs[i + 1]!

      let dx = Math.abs(x1 - x0)
      let dy = Math.abs(y1 - y0)
      const sx = x0 < x1 ? 1 : -1
      const sy = y0 < y1 ? 1 : -1
      let err = dx - dy
      let cx = x0
      let cy = y0

      while (true) {
        if (cx >= 0 && cx < colCount && cy >= 0 && cy < virtualH) {
          if (cy < lineY[cx]!) lineY[cx] = cy
        }
        if (cx === x1 && cy === y1) break
        const e2 = 2 * err
        if (e2 > -dy) { err -= dy; cx += sx }
        if (e2 < dx) { err += dx; cy += sy }
      }
    }

    if (dataLen === 1) {
      const px = Math.round(colCount / 2)
      const py = pixelYs[0]!
      if (px >= 0 && px < colCount && py >= 0 && py < virtualH) {
        lineY[px] = py
      }
    }

    return lineY
  }

  // ── Style: Area (braille) ────────────────────────────────────
  private renderArea(buffer: OptimizedBuffer, plotX: number, plotY: number, plotW: number, plotH: number): void {
    const transparent = RGBA.fromValues(0, 0, 0, 0)
    const pixW = plotW * 2
    const pixH = plotH * 4
    const yRange = this._yMax - this._yMin
    if (yRange === 0) return

    const cellCount = plotW * plotH
    const cellBits = new Uint8Array(cellCount)
    const cellColors: RGBA[] = Array.from({ length: cellCount }, () => transparent)

    for (const series of this._series) {
      if (series.data.length === 0) continue
      const seriesColor = RGBA.fromHex(series.color)

      const lineY = this.computeLineYPerColumn({
        series: { data: series.data, color: seriesColor },
        colCount: pixW,
        virtualH: pixH,
      })

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

    for (let cy = 0; cy < plotH; cy++) {
      for (let cx = 0; cx < plotW; cx++) {
        const cellIdx = cy * plotW + cx
        const bits = cellBits[cellIdx]!
        if (bits === 0) continue
        buffer.setCell(plotX + cx, plotY + cy, String.fromCharCode(0x2800 + bits), cellColors[cellIdx]!, transparent)
      }
    }
  }

  // ── Style: Filled / Striped (block characters) ───────────────
  // Always uses ▀ (upper-half block) with fg=top color, bg=bottom color.
  // This eliminates the tiny gaps some terminals show between adjacent █ rows.
  // Filled: every column uses the series color.
  // Striped: all columns filled, even cols = stripeColor1, odd = stripeColor2.
  //          Pass a transparent color to skip those columns (gap-style bars).
  private renderBlock(buffer: OptimizedBuffer, plotX: number, plotY: number, plotW: number, plotH: number, striped: boolean): void {
    const transparent = RGBA.fromValues(0, 0, 0, 0)
    const virtualH = plotH * 2 // 2 sub-rows per terminal row
    const yRange = this._yMax - this._yMin
    if (yRange === 0) return

    const stripe1 = RGBA.fromHex(this._stripeColor1)
    const stripe2 = RGBA.fromHex(this._stripeColor2)

    for (const series of this._series) {
      if (series.data.length === 0) continue
      const seriesColor = RGBA.fromHex(series.color)

      const lineY = this.computeLineYPerColumn({
        series: { data: series.data, color: seriesColor },
        colCount: plotW,
        virtualH,
      })

      for (let col = 0; col < plotW; col++) {
        // Determine fill color for this column
        const fillColor = striped
          ? (col % 2 === 0 ? stripe1 : stripe2)
          : seriesColor

        // Skip transparent columns (allows gap-style bars in striped mode)
        if (fillColor.a === 0) continue

        const topVRow = lineY[col]!
        if (topVRow >= virtualH) continue

        // Fill from topVRow down to virtualH-1 using ▀/▄ with fg+bg encoding.
        // ▀: fg paints top half, bg paints bottom half.
        // ▄: fg paints bottom half, bg paints top half.
        // We never set fg=transparent on a visible glyph part (would show as black).
        for (let row = 0; row < plotH; row++) {
          const vTop = row * 2       // virtual row for top half
          const vBot = row * 2 + 1   // virtual row for bottom half
          const topFilled = vTop >= topVRow
          const botFilled = vBot >= topVRow

          if (!topFilled && !botFilled) continue

          if (topFilled && botFilled) {
            // Both halves: ▀ with fg=color, bg=color → seamless full block
            buffer.setCell(plotX + col, plotY + row, UPPER_HALF, fillColor, fillColor)
          } else if (topFilled) {
            // Top only: ▀ with fg=color, bg=transparent
            buffer.setCell(plotX + col, plotY + row, UPPER_HALF, fillColor, transparent)
          } else if (topVRow >= virtualH - 1) {
            // Minimum fill: only the very last virtual row is filled (zero/min value).
            // Use ▁ (lower 1/8 block) for a thin baseline indicator.
            buffer.setCell(plotX + col, plotY + row, LOWER_EIGHTH, fillColor, transparent)
          } else {
            // Bottom only: ▄ with fg=color, bg=transparent
            buffer.setCell(plotX + col, plotY + row, LOWER_HALF, fillColor, transparent)
          }
        }
      }
    }
  }

  // ── Main render ──────────────────────────────────────────────
  protected renderSelf(buffer: OptimizedBuffer): void {
    const layout = this.computeLayout()
    if (!layout) return
    const { plotX, plotY, plotW, plotH } = layout

    this.drawAxes(buffer, layout)

    const yRange = this._yMax - this._yMin
    if (yRange === 0 || this._series.length === 0) return

    switch (this._variant) {
      case 'area': {
        this.renderArea(buffer, plotX, plotY, plotW, plotH)
        break
      }
      case 'filled': {
        this.renderBlock(buffer, plotX, plotY, plotW, plotH, false)
        break
      }
      case 'striped': {
        this.renderBlock(buffer, plotX, plotY, plotW, plotH, true)
        break
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

// ── Graph.Line (data-only child, renders null) ───────────────────────

export interface GraphLineProps {
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

export interface GraphProps {
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
  /** Rendering variant: 'area' (braille), 'filled' (blocks), 'striped' (alternating colors) */
  variant?: GraphVariant
  /** Two alternating colors for 'striped' variant [even, odd]. Defaults to [theme.primary, theme.accent].
   *  Pass 'transparent' for one to get gap-style bars. */
  stripeColors?: [Color.ColorLike, Color.ColorLike]
  /** Graph.Line children */
  children: ReactNode
}

interface GraphType {
  (props: GraphProps): any
  Line: (props: GraphLineProps) => any
}

const Graph: GraphType = (props) => {
  const theme = useTheme()
  const { height = 15, xLabels = [], yRange, yTicks = 5, yFormat, variant = 'area', stripeColors, children } = props

  const palette = getThemePalette(theme)

  // Collect series data from Graph.Line children
  const series = useMemo<SeriesData[]>(() => {
    const result: SeriesData[] = []
    let colorIndex = 0
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return
      const childProps = child.props as GraphLineProps
      if (!childProps.data) return

      const color = resolveColor(childProps.color) || palette[colorIndex % palette.length]!
      result.push({
        data: childProps.data,
        color,
      })
      colorIndex++
    })
    return result
  }, [children, palette])

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

  // Resolve stripe colors (defaults to theme primary + accent)
  const resolvedStripe1 = resolveColor(stripeColors?.[0]) || theme.primary
  const resolvedStripe2 = resolveColor(stripeColors?.[1]) || theme.accent

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
      variant={variant}
      stripeColor1={resolvedStripe1}
      stripeColor2={resolvedStripe2}
    />
  )
}

Graph.Line = GraphLine

export { Graph }
