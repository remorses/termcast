import React from 'react'

/**
 * Shared animation tick system for synchronized loading animations.
 * 
 * Components subscribe to a global tick counter that increments every 20ms.
 * Each component can compute its animation state based on the tick value.
 * 
 * Intervals (coordinated so animations look synchronized):
 * - LoadingBar: 40ms (2 ticks) - wave animation
 * - LoadingText: 40ms (2 ticks) - wave animation, same speed as bar
 * - Spinner: 200ms (10 ticks) - pulses every 5 wave steps
 */

type TickListener = (tick: number) => void

let globalTick = 0
let intervalId: NodeJS.Timeout | null = null
const listeners = new Set<TickListener>()

const BASE_INTERVAL_MS = 20

function startGlobalTick() {
  if (intervalId) return
  intervalId = setInterval(() => {
    globalTick++
    listeners.forEach((listener) => {
      listener(globalTick)
    })
  }, BASE_INTERVAL_MS)
}

function stopGlobalTick() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function subscribe(listener: TickListener) {
  listeners.add(listener)
  if (listeners.size === 1) {
    startGlobalTick()
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      stopGlobalTick()
    }
  }
}

/**
 * Hook to subscribe to animation ticks.
 * @param divisor - Only triggers re-render when tick is divisible by this value. Pass 0 to disable (no subscription).
 * @returns The current tick value (divided by divisor)
 */
export function useAnimationTick(divisor: number = 1): number {
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    // Don't subscribe if divisor is 0 (disabled)
    if (divisor <= 0) {
      setTick(0) // Reset when disabled
      return
    }

    const unsubscribe = subscribe((currentTick) => {
      if (currentTick % divisor === 0) {
        setTick(Math.floor(currentTick / divisor))
      }
    })
    return unsubscribe
  }, [divisor])

  return tick
}

// Tick divisors for each component type (base interval is 20ms)
// Waves share the same speed so they animate in sync
export const TICK_DIVISORS = {
  LOADING_BAR: 2,    // 40ms - wave animation
  LOADING_TEXT: 2,   // 40ms - wave animation (same as bar)
  SPINNER: 10,       // 200ms - pulses every 5 wave steps
} as const
