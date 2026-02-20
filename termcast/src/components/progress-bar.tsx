/**
 * ProgressBar component for rendering usage/progress rows in terminal UIs.
 *
 * Layout:
 * - title row
 * - bar + percentage row (bar grows to fill available width)
 * - optional muted label row
 */

import React from 'react'
import { TextAttributes } from '@opentui/core'
import type { BoxProps } from '@opentui/react'
import { useTheme } from 'termcast/src/theme'
import { Color, resolveColor } from 'termcast/src/colors'

export interface ProgressBarProps extends BoxProps {
  /** Main title shown above the bar */
  title: string
  /** Current progress value */
  value: number
  /** Maximum value used to calculate percentage (default: 100) */
  maxValue?: number
  /** Optional muted label below the bar */
  label?: string
  /** Show percentage text at end of bar row (default: true) */
  showPercentage?: boolean
  /** Optional suffix after percentage text (e.g. "used") */
  percentageSuffix?: string
  /** Optional color override for filled segment */
  color?: Color.ColorLike
  /** Optional color override for track segment */
  trackColor?: Color.ColorLike
  /** Optional formatter for percentage value */
  formatPercentage?: (percentage: number) => string
}

function clamp({ value, min, max }: { value: number; min: number; max: number }): number {
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}

function ProgressBar(props: ProgressBarProps): any {
  const theme = useTheme()
  const {
    title,
    value,
    maxValue = 100,
    label,
    showPercentage = true,
    percentageSuffix,
    color,
    trackColor,
    formatPercentage,
    ...rest
  } = props

  const safeMaxValue = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 1
  const safeValue = Number.isFinite(value) ? value : 0
  const rawPercentage = (safeValue / safeMaxValue) * 100
  const clampedPercentage = clamp({ value: rawPercentage, min: 0, max: 100 })

  const filledGrow = clampedPercentage
  const trackGrow = 100 - clampedPercentage

  const filledColor = resolveColor(color) || theme.accent
  const resolvedTrackColor = resolveColor(trackColor) || theme.conceal

  const formattedPercentage = formatPercentage
    ? formatPercentage(clampedPercentage)
    : `${Math.round(clampedPercentage)}%`

  const percentageText = percentageSuffix
    ? `${formattedPercentage} ${percentageSuffix}`
    : formattedPercentage

  return (
    <box flexDirection="column" width="100%" {...rest}>
      <text fg={theme.text} attributes={TextAttributes.BOLD}>{title}</text>
      <box flexDirection="row" alignItems="center" width="100%" gap={1}>
        <box flexDirection="row" flexGrow={1} overflow="hidden">
          {filledGrow > 0 && (
            <box flexGrow={filledGrow} flexBasis={0} flexShrink={1} overflow="hidden">
              <text fg={filledColor} wrapMode="none">{'█'.repeat(300)}</text>
            </box>
          )}
          {trackGrow > 0 && (
            <box flexGrow={trackGrow} flexBasis={0} flexShrink={1} overflow="hidden">
              <text fg={resolvedTrackColor} wrapMode="none">{'░'.repeat(300)}</text>
            </box>
          )}
        </box>
        {showPercentage && (
          <text fg={theme.text} wrapMode="none" flexShrink={0}>{percentageText}</text>
        )}
      </box>
      {label && <text fg={theme.textMuted}>{label}</text>}
    </box>
  )
}

export { ProgressBar }
