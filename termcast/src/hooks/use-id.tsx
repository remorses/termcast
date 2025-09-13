import { useRef } from 'react'
import { nanoid } from 'nanoid'

/**
 * @deprecated Use `useRef` with `nanoid`
 *
 * Hook that generates a unique ID that is stable across re-renders
 * The ID is generated once on the first render and remains the same
 * throughout the component's lifecycle
 */
export const useId = (): string => {
  const idRef = useRef<string | undefined>(undefined)

  if (!idRef.current) {
    idRef.current = nanoid()
  }

  return idRef.current
}
