/**
 * Heatmap component for rendering GitHub-style contribution/journal grids.
 *
 * Uses a custom opentui Renderable for performance: cells are drawn directly
 * to OptimizedBuffer with month grouping, day labels, and legend support.
 *
 * Cell intensity is encoded by mixing a primary and secondary color.
 */

import React from 'react'
import { Renderable, RGBA } from '@opentui/core'
import type { OptimizedBuffer, RenderContext, RenderableOptions } from '@opentui/core'
import { extend } from '@opentui/react'
import { Color, resolveColor } from 'termcast/src/colors'
import { useTheme } from 'termcast/src/theme'

const GRID_ROWS = 7
const DEFAULT_CELL_CHAR = '◼'
const CELL_STRIDE = 2
const MONTH_GAP = 1

const MONDAY_ROW = 1
const WEDNESDAY_ROW = 3
const FRIDAY_ROW = 5

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface NormalizedPoint {
  date: Date
  value: number
}

interface PreparedWeek {
  weekStart: Date
  monthKey: string
  monthLabel: string
  values: [number, number, number, number, number, number, number]
}

interface MonthSection {
  key: string
  label: string
  weeks: PreparedWeek[]
}

export interface HeatmapData {
  date: Date | string
  value: number
}

export type HeatmapCellChar = '◼' | '■' | '█' | '▪'

export interface HeatmapGridOptions extends RenderableOptions {
  data?: HeatmapData[]
  cellChar?: HeatmapCellChar
  cellColor?: string
  backgroundColor?: string
  emptyColor?: string
  labelColor?: string
  showMonthLabels?: boolean
  showDayLabels?: boolean
  showLegend?: boolean
}

function normalizeDate(input: Date | string): Date | null {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      return null
    }
    return new Date(input.getFullYear(), input.getMonth(), input.getDate())
  }

  if (typeof input !== 'string') {
    return null
  }

  const dateOnlyMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1])
    const month = Number(dateOnlyMatch[2]) - 1
    const day = Number(dateOnlyMatch[3])
    return new Date(year, month, day)
  }

  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

function normalizePoint(point: HeatmapData): NormalizedPoint | null {
  const normalizedDate = normalizeDate(point.date)
  if (!normalizedDate) {
    return null
  }

  if (!Number.isFinite(point.value)) {
    return null
  }

  const normalizedValue = Math.max(0, point.value)
  return {
    date: normalizedDate,
    value: normalizedValue,
  }
}

function toDateKey(date: Date): string {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeekStart(date: Date): Date {
  const day = date.getDay()
  const weekStart = new Date(date)
  weekStart.setDate(date.getDate() - day)
  return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate())
}

function createEmptyWeekValues(): [number, number, number, number, number, number, number] {
  return [0, 0, 0, 0, 0, 0, 0]
}

function getSectionGridWidth(section: MonthSection): number {
  return section.weeks.length * CELL_STRIDE
}

function getSectionsGridWidth(sections: MonthSection[]): number {
  if (sections.length === 0) {
    return 0
  }

  return sections.reduce((total, section, index) => {
    const sectionWidth = getSectionGridWidth(section)
    if (index === 0) {
      return sectionWidth
    }
    return total + MONTH_GAP + sectionWidth
  }, 0)
}

export class HeatmapRenderable extends Renderable {
  private _data: HeatmapData[] = []
  private _cellChar: HeatmapCellChar = DEFAULT_CELL_CHAR
  private _cellColor = '#00AA55'
  private _backgroundColor = '#000000'
  private _emptyColor = '#2B2B2B'
  private _labelColor = '#888888'
  private _showMonthLabels = true
  private _showDayLabels = true
  private _showLegend = true

  private _sections: MonthSection[] = []
  private _maxValue = 0

  constructor(ctx: RenderContext, options: HeatmapGridOptions) {
    super(ctx, options)

    if (options.data) {
      this._data = options.data
    }
    if (options.cellChar) {
      this._cellChar = options.cellChar
    }
    if (options.cellColor) {
      this._cellColor = options.cellColor
    }
    if (options.backgroundColor) {
      this._backgroundColor = options.backgroundColor
    }
    if (options.emptyColor) {
      this._emptyColor = options.emptyColor
    }
    if (options.labelColor) {
      this._labelColor = options.labelColor
    }
    if (options.showMonthLabels !== undefined) {
      this._showMonthLabels = options.showMonthLabels
    }
    if (options.showDayLabels !== undefined) {
      this._showDayLabels = options.showDayLabels
    }
    if (options.showLegend !== undefined) {
      this._showLegend = options.showLegend
    }

    this.recomputeData()
  }

  set data(value: HeatmapData[]) {
    this._data = value
    this.recomputeData()
    this.requestRender()
  }

  set cellColor(value: string) {
    this._cellColor = value
    this.requestRender()
  }

  set cellChar(value: HeatmapCellChar) {
    this._cellChar = value
    this.requestRender()
  }

  set backgroundColor(value: string) {
    this._backgroundColor = value
    this.requestRender()
  }

  set emptyColor(value: string) {
    this._emptyColor = value
    this.requestRender()
  }

  set labelColor(value: string) {
    this._labelColor = value
    this.requestRender()
  }

  set showMonthLabels(value: boolean) {
    this._showMonthLabels = value
    this.requestRender()
  }

  set showDayLabels(value: boolean) {
    this._showDayLabels = value
    this.requestRender()
  }

  set showLegend(value: boolean) {
    this._showLegend = value
    this.requestRender()
  }

  private recomputeData(): void {
    const normalizedPoints: NormalizedPoint[] = this._data.reduce<NormalizedPoint[]>((result, point) => {
      const normalized = normalizePoint(point)
      if (!normalized) {
        return result
      }
      result.push(normalized)
      return result
    }, [])

    normalizedPoints.sort((a, b) => {
      return a.date.getTime() - b.date.getTime()
    })

    this._maxValue = normalizedPoints.reduce((maxValue, point) => {
      return Math.max(maxValue, point.value)
    }, 0)

    const valueByDay = new Map<string, number>()
    const dateByDay = new Map<string, Date>()

    normalizedPoints.forEach((point) => {
      const dayKey = toDateKey(point.date)
      const currentValue = valueByDay.get(dayKey) || 0
      valueByDay.set(dayKey, currentValue + point.value)
      dateByDay.set(dayKey, point.date)
    })

    const weekMap = new Map<string, PreparedWeek>()

    const dayEntries = Array.from(valueByDay.entries())
      .reduce<Array<{ date: Date; value: number }>>((result, [dayKey, value]) => {
        const date = dateByDay.get(dayKey)
        if (!date) {
          return result
        }
        result.push({ date, value })
        return result
      }, [])
      .sort((a, b) => {
        return a.date.getTime() - b.date.getTime()
      })

    dayEntries.forEach((entry) => {
      const date = entry.date
      const weekStart = getWeekStart(date)
      const weekKey = toDateKey(weekStart)
      const monthKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = MONTH_LABELS[weekStart.getMonth()] || ''

      const existingWeek = weekMap.get(weekKey)
      if (existingWeek) {
        const dayIndex = date.getDay()
        existingWeek.values[dayIndex] = existingWeek.values[dayIndex] + entry.value
        return
      }

      const values = createEmptyWeekValues()
      values[date.getDay()] = entry.value
      weekMap.set(weekKey, {
        weekStart,
        monthKey,
        monthLabel,
        values,
      })
    })

    const sortedWeeks = Array.from(weekMap.values()).sort((a, b) => {
      return a.weekStart.getTime() - b.weekStart.getTime()
    })

    const sections: MonthSection[] = []
    sortedWeeks.forEach((week) => {
      const lastSection = sections[sections.length - 1]
      if (!lastSection || lastSection.key !== week.monthKey) {
        sections.push({
          key: week.monthKey,
          label: week.monthLabel,
          weeks: [week],
        })
        return
      }

      lastSection.weeks.push(week)
    })

    this._sections = sections
  }

  private resolveVisibleSections(availableGridWidth: number): MonthSection[] {
    if (availableGridWidth <= 0 || this._sections.length === 0) {
      return []
    }

    const visibleFromEnd: MonthSection[] = []
    let usedWidth = 0

    for (let i = this._sections.length - 1; i >= 0; i--) {
      const section = this._sections[i]!
      const sectionWidth = getSectionGridWidth(section)
      const gapWidth = visibleFromEnd.length > 0 ? MONTH_GAP : 0
      const nextWidth = usedWidth + gapWidth + sectionWidth
      if (nextWidth > availableGridWidth) {
        break
      }
      visibleFromEnd.unshift(section)
      usedWidth = nextWidth
    }

    if (visibleFromEnd.length > 0) {
      return visibleFromEnd
    }

    const latestSection = this._sections[this._sections.length - 1]
    if (!latestSection) {
      return []
    }

    const maxWeeks = Math.max(1, Math.floor(availableGridWidth / CELL_STRIDE))
    const weeks = latestSection.weeks.slice(Math.max(0, latestSection.weeks.length - maxWeeks))

    return [{
      key: latestSection.key,
      label: latestSection.label,
      weeks,
    }]
  }

  private valueToLevel(value: number): 0 | 1 | 2 | 3 | 4 {
    if (value <= 0 || this._maxValue <= 0) {
      return 0
    }

    const normalized = value / this._maxValue
    if (normalized <= 0.25) {
      return 1
    }
    if (normalized <= 0.5) {
      return 2
    }
    if (normalized <= 0.75) {
      return 3
    }
    return 4
  }

  private mixColors(a: RGBA, b: RGBA, ratio: number): RGBA {
    const clampedRatio = Math.max(0, Math.min(1, ratio))
    return RGBA.fromValues(
      a.r + (b.r - a.r) * clampedRatio,
      a.g + (b.g - a.g) * clampedRatio,
      a.b + (b.b - a.b) * clampedRatio,
      1,
    )
  }

  private buildLevelColors(): [RGBA, RGBA, RGBA, RGBA, RGBA] {
    const primary = RGBA.fromHex(this._cellColor)
    const secondary = RGBA.fromHex(this._emptyColor)

    return [
      secondary,
      this.mixColors(secondary, primary, 0.25),
      this.mixColors(secondary, primary, 0.5),
      this.mixColors(secondary, primary, 0.75),
      primary,
    ]
  }

  private clearArea(buffer: OptimizedBuffer): void {
    const bg = RGBA.fromHex(this._backgroundColor)
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        buffer.setCell(this.x + col, this.y + row, ' ', bg, bg)
      }
    }
  }

  protected renderSelf(buffer: OptimizedBuffer): void {
    this.clearArea(buffer)

    if (this.width <= 0 || this.height <= 0) {
      return
    }

    if (this._sections.length === 0) {
      return
    }

    let showMonthLabels = this._showMonthLabels
    let showLegend = this._showLegend
    const showDayLabels = this._showDayLabels

    let requiredHeight = GRID_ROWS + (showMonthLabels ? 1 : 0) + (showLegend ? 1 : 0)
    if (requiredHeight > this.height && showLegend) {
      showLegend = false
      requiredHeight = GRID_ROWS + (showMonthLabels ? 1 : 0)
    }
    if (requiredHeight > this.height && showMonthLabels) {
      showMonthLabels = false
      requiredHeight = GRID_ROWS
    }
    if (requiredHeight > this.height) {
      return
    }

    const rightDayLabelsWidth = showDayLabels ? 5 : 0
    const availableGridWidth = this.width - rightDayLabelsWidth
    if (availableGridWidth <= 0) {
      return
    }

    const visibleSections = this.resolveVisibleSections(availableGridWidth)
    if (visibleSections.length === 0) {
      return
    }

    const gridWidth = getSectionsGridWidth(visibleSections)
    const gridStartX = this.x
    const monthLabelsRow = this.y
    const gridStartY = this.y + (showMonthLabels ? 1 : 0)

    const levelColors = this.buildLevelColors()
    const cellBackground = RGBA.fromHex(this._backgroundColor)
    const labelColor = RGBA.fromHex(this._labelColor)

    let cursorX = gridStartX
    visibleSections.forEach((section, sectionIndex) => {
      const sectionStartX = cursorX

      section.weeks.forEach((week) => {
        week.values.forEach((value, rowIndex) => {
          const level = this.valueToLevel(value)
          const color = levelColors[level]
          const y = gridStartY + rowIndex
          buffer.setCell(cursorX, y, this._cellChar, color, cellBackground)
        })
        cursorX += CELL_STRIDE
      })

      if (showMonthLabels) {
        const sectionWidth = getSectionGridWidth(section)
        const label = section.label.slice(0, sectionWidth)
        buffer.drawText(label, sectionStartX, monthLabelsRow, labelColor)
      }

      if (sectionIndex < visibleSections.length - 1) {
        cursorX += MONTH_GAP
      }
    })

    if (showDayLabels) {
      const labelsX = gridStartX + gridWidth + 1
      buffer.drawText('Mon', labelsX, gridStartY + MONDAY_ROW, labelColor)
      buffer.drawText('Wed', labelsX, gridStartY + WEDNESDAY_ROW, labelColor)
      buffer.drawText('Fri', labelsX, gridStartY + FRIDAY_ROW, labelColor)
    }

    if (!showLegend) {
      return
    }

    const legendY = gridStartY + GRID_ROWS
    const legendPrefix = 'Less '
    const legendSuffix = ' More'
    const legendSquaresWidth = 9
    const legendWidth = legendPrefix.length + legendSquaresWidth + legendSuffix.length
    const legendX = Math.max(gridStartX, gridStartX + gridWidth - legendWidth)

    buffer.drawText(legendPrefix, legendX, legendY, labelColor)

    let legendCursorX = legendX + legendPrefix.length
    for (let level = 0; level <= 4; level++) {
      const color = levelColors[level]
      buffer.setCell(legendCursorX, legendY, this._cellChar, color, cellBackground)
      legendCursorX += 1
      if (level < 4) {
        legendCursorX += 1
      }
    }

    buffer.drawText(legendSuffix, legendCursorX, legendY, labelColor)
  }
}

extend({ 'heatmap-grid': HeatmapRenderable })

declare module '@opentui/react' {
  interface OpenTUIComponents {
    'heatmap-grid': typeof HeatmapRenderable
  }
}

export interface HeatmapProps {
  data: HeatmapData[]
  cellChar?: HeatmapCellChar
  color?: Color.ColorLike
  emptyColor?: Color.ColorLike
  showMonthLabels?: boolean
  showDayLabels?: boolean
  showLegend?: boolean
}

interface HeatmapType {
  (props: HeatmapProps): any
}

const Heatmap: HeatmapType = (props) => {
  const theme = useTheme()
  const {
    data,
    cellChar = DEFAULT_CELL_CHAR,
    color,
    emptyColor,
    showMonthLabels = true,
    showDayLabels = true,
    showLegend = true,
  } = props

  const resolvedColor = resolveColor(color) || theme.primary
  const resolvedEmptyColor = resolveColor(emptyColor) || theme.background
  const computedHeight = GRID_ROWS + (showMonthLabels ? 1 : 0) + (showLegend ? 1 : 0)

  return (
    <heatmap-grid
      width="100%"
      height={computedHeight}
      data={data}
      cellChar={cellChar}
      cellColor={resolvedColor}
      backgroundColor={theme.background}
      emptyColor={resolvedEmptyColor}
      labelColor={theme.textMuted}
      showMonthLabels={showMonthLabels}
      showDayLabels={showDayLabels}
      showLegend={showLegend}
    />
  )
}

export { Heatmap }
