/**
 * CandleChart component for rendering trading-style OHLC candlestick charts.
 *
 * Uses a custom opentui Renderable (CandleChartRenderable) for direct drawing
 * to OptimizedBuffer via setCell(). Each data point occupies exactly one
 * terminal column, rendering:
 *   - Body (open-to-close): left-half block characters (▌/▘/▖) with 2x
 *     vertical sub-row resolution
 *   - Wick (high-to-low): thin vertical line (│) extending above/below body
 *
 * Color encodes direction:
 *   - Green (default): close >= open (bullish)
 *   - Red (default): close < open (bearish)
 *
 * Layout reuses the same Y-axis + X-axis label pattern as Graph component.
 */

import { useMemo } from 'react'
import { Renderable, RGBA } from '@opentui/core'
import type { RenderableOptions, RenderContext } from '@opentui/core'
import type { OptimizedBuffer } from '@opentui/core'
import { extend } from '@opentui/react'
import { useTheme } from 'termcast/src/theme'
import { Color, resolveColor } from 'termcast/src/colors'

// ── Data types ───────────────────────────────────────────────────────

export interface CandleData {
  /** Price at the start of the period */
  open: number
  /** Price at the end of the period */
  close: number
  /** Highest price during the period */
  high: number
  /** Lowest price during the period */
  low: number
}

// ── Block characters (same as Graph filled variant) ──────────────────
// Left-half and quadrant characters give 2x vertical sub-row resolution
// while keeping each bar 50% cell width for visible gaps between columns.
const LEFT_HALF = '▌'     // U+258C — full height, left 50%
const QUAD_UL = '▘'       // U+2598 — top half, left 50%
const QUAD_LL = '▖'       // U+2596 — bottom half, left 50%

// ── CandleChartRenderable ────────────────────────────────────────────

export interface CandleChartPlotOptions extends RenderableOptions {
  candles?: CandleData[]
  xLabels?: string[]
  yMin?: number
  yMax?: number
  yTicks?: number
  yFormat?: (v: number) => string
  axisColor?: string
  upColor?: string    // hex color for bullish candles (close >= open)
  downColor?: string  // hex color for bearish candles (close < open)
  wickColor?: string  // hex color for wick lines
}

export class CandleChartRenderable extends Renderable {
  private _candles: CandleData[] = []
  private _xLabels: string[] = []
  private _yMin = 0
  private _yMax = 100
  private _yTicks = 5
  private _yFormat: (v: number) => string = (v) => {
    return v >= 1000 ? v.toFixed(0) : v.toFixed(1)
  }
  private _axisColor: string = '#666666'
  private _upColor: string = '#34EE7F'   // Color.Green
  private _downColor: string = '#FF7B7B' // Color.Red
  private _wickColor: string = '#666666'

  constructor(ctx: RenderContext, options: CandleChartPlotOptions) {
    super(ctx, options)
    if (options.candles) this._candles = options.candles
    if (options.xLabels) this._xLabels = options.xLabels
    if (options.yMin !== undefined) this._yMin = options.yMin
    if (options.yMax !== undefined) this._yMax = options.yMax
    if (options.yTicks !== undefined) this._yTicks = options.yTicks
    if (options.yFormat) this._yFormat = options.yFormat
    if (options.axisColor) this._axisColor = options.axisColor
    if (options.upColor) this._upColor = options.upColor
    if (options.downColor) this._downColor = options.downColor
    if (options.wickColor) this._wickColor = options.wickColor
  }

  set candles(value: CandleData[]) { this._candles = value; this.requestRender() }
  set xLabels(value: string[]) { this._xLabels = value; this.requestRender() }
  set yMin(value: number) { this._yMin = value; this.requestRender() }
  set yMax(value: number) { this._yMax = value; this.requestRender() }
  set yTicks(value: number) { this._yTicks = value; this.requestRender() }
  set yFormat(value: (v: number) => string) { this._yFormat = value; this.requestRender() }
  set axisColor(value: string) { this._axisColor = value; this.requestRender() }
  set upColor(value: string) { this._upColor = value; this.requestRender() }
  set downColor(value: string) { this._downColor = value; this.requestRender() }
  set wickColor(value: string) { this._wickColor = value; this.requestRender() }

  // ── Layout: compute plot area and Y labels ─────────────────────
  private computeLayout(): {
    plotX: number; plotY: number; plotW: number; plotH: number
    yAxisWidth: number; yLabels: string[]
  } | null {
    const totalW = this.width
    const totalH = this.height
    if (totalW <= 0 || totalH <= 0) return null

    const safeTicks = Math.max(2, this._yTicks)
    const yLabels: string[] = []
    for (let i = 0; i < safeTicks; i++) {
      const value = this._yMin + (this._yMax - this._yMin) * (1 - i / (safeTicks - 1))
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

  // ── Axes: Y labels + separator, X labels ──────────────────────
  private drawAxes(buffer: OptimizedBuffer, layout: {
    plotX: number; plotY: number; plotW: number; plotH: number
    yAxisWidth: number; yLabels: string[]
  }): void {
    const { plotX, plotY, plotW, plotH, yAxisWidth, yLabels } = layout
    const axisRgba = RGBA.fromHex(this._axisColor)

    // Y-axis labels + separator
    const safeTicks = Math.max(2, this._yTicks)
    const labelRows = new Set<number>()
    for (let i = 0; i < safeTicks; i++) {
      const row = Math.round(plotY + (i / (safeTicks - 1)) * (plotH - 1))
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

  // ── Convert a price value to a virtual sub-row position ────────
  // Returns a float in [0, virtualH-1] where 0 = top (yMax), virtualH-1 = bottom (yMin)
  private priceToVRow({ price, virtualH }: { price: number; virtualH: number }): number {
    const yRange = this._yMax - this._yMin
    if (yRange === 0) return 0
    const normalized = (price - this._yMin) / yRange
    return (1 - normalized) * (virtualH - 1)
  }

  // ── Aggregate candles into column buckets ───────────────────────
  // When data.length > plotW, multiple candles share a column. We bucket
  // them with standard OHLC aggregation: open=first.open, close=last.close,
  // high=max(highs), low=min(lows). When data.length <= plotW, candles map
  // 1:1 to contiguous columns (right-aligned so latest data is at the right edge).
  private aggregateToColumns({ plotW }: { plotW: number }): CandleData[] {
    const candles = this._candles
    if (candles.length === 0) return []

    if (candles.length <= plotW) {
      // 1:1 mapping — return as-is, caller will right-align
      return candles
    }

    // Bucket candles into plotW columns
    const result: CandleData[] = []
    for (let col = 0; col < plotW; col++) {
      const start = Math.floor((col * candles.length) / plotW)
      const end = Math.floor(((col + 1) * candles.length) / plotW)
      const slice = candles.slice(start, Math.max(start + 1, end))
      const first = slice[0]!
      const last = slice[slice.length - 1]!
      result.push({
        open: first.open,
        close: last.close,
        high: Math.max(...slice.map((c) => c.high)),
        low: Math.min(...slice.map((c) => c.low)),
      })
    }
    return result
  }

  // ── Render candles ─────────────────────────────────────────────
  // Each candle occupies exactly one terminal column. Uses 2x vertical
  // sub-row resolution (same as Graph filled variant).
  //
  // For each column:
  //   1. Map OHLC to virtual Y positions
  //   2. Draw wick (│) from high to low, excluding body range
  //   3. Draw body (▌/▘/▖) from min(open,close) to max(open,close)
  //   4. Color: green if close >= open, red otherwise
  private renderCandles(buffer: OptimizedBuffer, plotX: number, plotY: number, plotW: number, plotH: number): void {
    const transparent = RGBA.fromValues(0, 0, 0, 0)
    const virtualH = plotH * 2 // 2 sub-rows per terminal row
    const yRange = this._yMax - this._yMin
    if (yRange === 0) return

    const upRgba = RGBA.fromHex(this._upColor)
    const downRgba = RGBA.fromHex(this._downColor)
    const wickRgba = RGBA.fromHex(this._wickColor)

    const columns = this.aggregateToColumns({ plotW })
    if (columns.length === 0) return

    // Right-align: latest candles at the right edge of the plot.
    // When fewer candles than columns, offset pushes them rightward.
    const offset = plotW - columns.length

    for (let i = 0; i < columns.length; i++) {
      const candle = columns[i]!
      const col = offset + i

      if (col < 0 || col >= plotW) continue

      const isBullish = candle.close >= candle.open
      const bodyColor = isBullish ? upRgba : downRgba

      // Convert prices to virtual sub-row positions (0 = top, virtualH-1 = bottom)
      const highVRow = Math.round(this.priceToVRow({ price: candle.high, virtualH }))
      const lowVRow = Math.round(this.priceToVRow({ price: candle.low, virtualH }))
      const openVRow = Math.round(this.priceToVRow({ price: candle.open, virtualH }))
      const closeVRow = Math.round(this.priceToVRow({ price: candle.close, virtualH }))

      const bodyTopVRow = Math.min(openVRow, closeVRow)
      const bodyBotVRow = Math.max(openVRow, closeVRow)

      // Clamp all values to valid range
      const wickTop = Math.max(0, Math.min(highVRow, virtualH - 1))
      const wickBot = Math.max(0, Math.min(lowVRow, virtualH - 1))
      const bodyTop = Math.max(0, Math.min(bodyTopVRow, virtualH - 1))
      const bodyBot = Math.max(0, Math.min(bodyBotVRow, virtualH - 1))

      // Draw each terminal row for this column
      for (let row = 0; row < plotH; row++) {
        const vTop = row * 2       // virtual sub-row for top half of this terminal row
        const vBot = row * 2 + 1   // virtual sub-row for bottom half

        // Check what each sub-row contains: body, wick, or nothing
        const topIsBody = vTop >= bodyTop && vTop <= bodyBot
        const botIsBody = vBot >= bodyTop && vBot <= bodyBot
        const topIsWick = !topIsBody && vTop >= wickTop && vTop <= wickBot
        const botIsWick = !botIsBody && vBot >= wickTop && vBot <= wickBot

        if (topIsBody || botIsBody) {
          // Body takes priority — draw block character
          if (topIsBody && botIsBody) {
            buffer.setCell(plotX + col, plotY + row, LEFT_HALF, bodyColor, transparent)
          } else if (topIsBody) {
            // Top is body, bottom might be wick
            buffer.setCell(plotX + col, plotY + row, QUAD_UL, bodyColor, transparent)
          } else {
            // Bottom is body, top might be wick
            buffer.setCell(plotX + col, plotY + row, QUAD_LL, bodyColor, transparent)
          }
        } else if (topIsWick || botIsWick) {
          // Only wick in this terminal row — draw thin line
          buffer.setCell(plotX + col, plotY + row, '│', wickRgba, transparent)
        }
      }

      // Handle doji case: when open == close, body is a single sub-row line.
      // If bodyTop == bodyBot, ensure at least one cell is drawn with body color.
      if (bodyTop === bodyBot) {
        const row = Math.floor(bodyTop / 2)
        const subRow = bodyTop % 2
        if (row >= 0 && row < plotH) {
          const char = subRow === 0 ? QUAD_UL : QUAD_LL
          buffer.setCell(plotX + col, plotY + row, char, bodyColor, transparent)
        }
      }
    }
  }

  // ── Main render ────────────────────────────────────────────────
  protected renderSelf(buffer: OptimizedBuffer): void {
    const layout = this.computeLayout()
    if (!layout) return

    this.drawAxes(buffer, layout)

    const yRange = this._yMax - this._yMin
    if (yRange === 0 || this._candles.length === 0) return

    const { plotX, plotY, plotW, plotH } = layout
    this.renderCandles(buffer, plotX, plotY, plotW, plotH)
  }
}

// ── Register the custom renderable ───────────────────────────────────

extend({ 'candle-chart-plot': CandleChartRenderable })

declare module '@opentui/react' {
  interface OpenTUIComponents {
    'candle-chart-plot': typeof CandleChartRenderable
  }
}

// ── CandleChart React component ──────────────────────────────────────

export interface CandleChartProps {
  /** OHLC candle data. Each entry maps to one terminal column. When there
   *  are more candles than available columns, adjacent candles are aggregated
   *  into OHLC buckets (open=first, close=last, high=max, low=min). */
  data: CandleData[]
  /** Height of the plot area in terminal rows. The total rendered height is
   *  this value plus one extra row for X-axis labels (if provided). Default: 15. */
  height?: number
  /** Labels displayed along the X-axis below the chart, evenly spaced
   *  from left to right (e.g. `['12d', '8d', '4d', 'Now']`). */
  xLabels?: string[]
  /** Explicit Y-axis range as `[min, max]`. When omitted the range is
   *  auto-computed from the data's lowest `low` and highest `high` values
   *  with 5% padding so candles don't touch the top/bottom edges. */
  yRange?: [number, number]
  /** Number of evenly spaced tick labels drawn along the Y-axis. Controls
   *  how many price labels appear on the left side of the chart. Default: 5.
   *  Minimum effective value is 2 (top and bottom). */
  yTicks?: number
  /** Formatter for Y-axis tick labels. Receives the numeric price value and
   *  should return a display string (e.g. `(v) => '$' + v.toFixed(0)`).
   *  Default: values >= 1000 use `.toFixed(0)`, otherwise `.toFixed(1)`. */
  yFormat?: (v: number) => string
  /** Color for bullish candles where close >= open. Default: Color.Green. */
  upColor?: Color.ColorLike
  /** Color for bearish candles where close < open. Default: Color.Red. */
  downColor?: Color.ColorLike
}

interface CandleChartType {
  (props: CandleChartProps): any
}

const CandleChart: CandleChartType = (props) => {
  const theme = useTheme()
  const {
    data,
    height = 15,
    xLabels = [],
    yRange,
    yTicks = 5,
    yFormat,
    upColor,
    downColor,
  } = props

  const resolvedUpColor = resolveColor(upColor) || Color.Green
  const resolvedDownColor = resolveColor(downColor) || Color.Red

  // Auto-compute Y range from data high/low if not provided
  const computedYRange = useMemo<[number, number]>(() => {
    if (yRange) return yRange
    let min = Infinity
    let max = -Infinity
    for (const candle of data) {
      if (candle.low < min) min = candle.low
      if (candle.high > max) max = candle.high
    }
    if (min === Infinity) return [0, 100]
    // Add padding so candles don't touch edges.
    // When max === min (flat data), use absolute padding to avoid zero range.
    const padding = max === min
      ? Math.max(Math.abs(max) * 0.01, 1)
      : (max - min) * 0.05
    return [min - padding, max + padding]
  }, [data, yRange])

  // Total height = plot rows + 1 for x-axis labels
  const totalHeight = height + (xLabels.length > 0 ? 1 : 0)

  return (
    <candle-chart-plot
      width="100%"
      height={totalHeight}
      candles={data}
      xLabels={xLabels}
      yMin={computedYRange[0]}
      yMax={computedYRange[1]}
      yTicks={yTicks}
      yFormat={yFormat}
      axisColor={theme.textMuted}
      upColor={resolvedUpColor}
      downColor={resolvedDownColor}
      wickColor={theme.textMuted}
    />
  )
}

export { CandleChart }
