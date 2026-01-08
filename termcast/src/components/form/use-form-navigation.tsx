import { useKeyboard } from '@opentui/react'
import { useFocusContext, useFormScrollContext } from './index'
import { useIsInFocus } from '../../internal/focus-context'

// Helper hook to get navigation functions without keyboard handling
export function useFormNavigationHelpers(id: string) {
  const scrollContext = useFormScrollContext()
  const { setFocusedField } = useFocusContext()

  // Get sorted field IDs from descendants
  const getFieldIds = () => {
    if (!scrollContext) return []
    const descendants = Object.values(scrollContext.descendantsContext.map.current)
      .filter((item) => item.index !== -1 && item.props?.id)
      // IMPORTANT: Sort by y position to ensure correct visual order.
      // opentui's tree traversal order (which determines descendant index) may differ
      // from React's render order, causing fields to appear in wrong navigation order.
      // Note: elementRef can be a React ref object or direct BoxRenderable
      .sort((a, b) => {
        const aRef = a.props?.elementRef
        const bRef = b.props?.elementRef
        // Handle both RefObject<BoxRenderable> and direct BoxRenderable
        const aY = (aRef && 'current' in aRef ? aRef.current?.y : (aRef as any)?.y) ?? 0
        const bY = (bRef && 'current' in bRef ? bRef.current?.y : (bRef as any)?.y) ?? 0
        return aY - bY
      })
    // Debug logging
    const { logger } = require('termcast/src/logger')
    logger.log(`getFieldIds: ${descendants.map(d => {
      const ref = d.props?.elementRef
      const y = (ref && 'current' in ref ? ref.current?.y : (ref as any)?.y) ?? 'null'
      return `${d.props?.id}(y=${y})`
    }).join(', ')}`)
    return descendants.map((item) => item.props!.id)
  }

  const navigateToPrevious = () => {
    const fieldIds = getFieldIds()
    const currentIndex = fieldIds.indexOf(id)
    if (currentIndex > 0) {
      setFocusedField(fieldIds[currentIndex - 1])
    } else {
      setFocusedField(fieldIds[fieldIds.length - 1])
    }
  }

  const navigateToNext = () => {
    const fieldIds = getFieldIds()
    const currentIndex = fieldIds.indexOf(id)
    if (currentIndex < fieldIds.length - 1) {
      setFocusedField(fieldIds[currentIndex + 1])
    } else {
      setFocusedField(fieldIds[0])
    }
  }

  return {
    navigateToPrevious,
    navigateToNext,
  }
}

export function useFormNavigation(
  id: string,
  options?: {
    handleArrows?: boolean
    handleTabs?: boolean
  },
) {
  const { focusedField } = useFocusContext()
  const isInFocus = useIsInFocus()
  const isFocused = focusedField === id

  let { handleArrows = true, handleTabs = true } = options || {}

  handleArrows = false

  const { navigateToPrevious, navigateToNext } = useFormNavigationHelpers(id)

  useKeyboard((evt) => {
    // Only handle keyboard events when this field is focused and form is in focus
    if (!isFocused || !isInFocus) return

    if (handleTabs && evt.name === 'tab') {
      // Prevent cascading navigation: when navigateToNext() triggers a re-render,
      // the newly focused field's handler will also fire for the same event.
      // Use a counter to track the current navigation "session" - handlers that
      // fire during the same navigation session will see the same counter value.
      const currentNav = useFormNavigation._navCounter ?? 0
      if ((evt as any)._navCounter === currentNav) return
      ;(evt as any)._navCounter = currentNav
      useFormNavigation._navCounter = currentNav + 1

      if (evt.shift) {
        navigateToPrevious()
      } else {
        navigateToNext()
      }
    } else if (handleArrows) {
      if (evt.name === 'up') {
        navigateToPrevious()
      } else if (evt.name === 'down') {
        navigateToNext()
      }
    }
  })

  return {
    navigateToPrevious,
    navigateToNext,
  }
}
