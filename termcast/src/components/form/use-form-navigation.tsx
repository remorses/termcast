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

  let { handleArrows = true, handleTabs = true } = options || {}

  handleArrows = false

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
