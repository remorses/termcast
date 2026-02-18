import { useKeyboard } from '@opentui/react'
import { useFocusContext, useFormScrollContext } from './index'
import { useIsInFocus } from '../../internal/focus-context'

// Helper hook to get navigation functions without keyboard handling
export function useFormNavigationHelpers(id: string) {
  const scrollContext = useFormScrollContext()
  const { setFocusedField } = useFocusContext()

  // Get sorted field IDs from descendants - use committedMap for stability
  const getFieldIds = () => {
    if (!scrollContext) return []
    const descendants = Object.values(scrollContext.descendantsContext.committedMap)
      .filter((item) => item.index !== -1 && item.props?.id)
      .sort((a, b) => a.index - b.index)
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

  // handleTabs defaults to false to avoid conflict with global Form handler
  let { handleArrows = true, handleTabs = false } = options || {}

  const { navigateToPrevious, navigateToNext } = useFormNavigationHelpers(id)

  useKeyboard((evt) => {
    // Only handle keyboard events when this field is focused and form is in focus
    if (!isFocused || !isInFocus) return

    if (handleTabs && evt.name === 'tab') {
      if (evt.shift) {
        navigateToPrevious()
      } else {
        navigateToNext()
      }
      evt.stopPropagation()
    } else if (handleArrows) {
      // Prevent the newly-focused field from also processing this arrow.
      // setFocusedField uses flushSync which updates all useKeyboard handler
      // refs via useEffectEvent before the next handler in the dispatch loop runs.
      if (evt.name === 'up') {
        navigateToPrevious()
        evt.stopPropagation()
      } else if (evt.name === 'down') {
        navigateToNext()
        evt.stopPropagation()
      }
    }
  })

  return {
    navigateToPrevious,
    navigateToNext,
  }
}
