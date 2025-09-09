import { useKeyboard } from '@opentui/react'
import { useFormContext } from 'react-hook-form'
import { useFocusContext,  } from './index'
import { useIsInFocus } from '../../internal/focus-context'

export function useFormNavigation(id: string, options?: {
    handleArrows?: boolean
    handleTabs?: boolean
}) {
    const { getValues } = useFormContext()
    const { focusedField, setFocusedField } = useFocusContext()
    const isInFocus = useIsInFocus()
    const isFocused = focusedField === id

    const { handleArrows = true, handleTabs = true } = options || {}

    const navigateToPrevious = () => {
        const fieldNames = Object.keys(getValues())
        const currentIndex = fieldNames.indexOf(id)
        if (currentIndex > 0) {
            setFocusedField(fieldNames[currentIndex - 1])
        } else {
            setFocusedField(fieldNames[fieldNames.length - 1])
        }
    }

    const navigateToNext = () => {
        const fieldNames = Object.keys(getValues())
        const currentIndex = fieldNames.indexOf(id)
        if (currentIndex < fieldNames.length - 1) {
            setFocusedField(fieldNames[currentIndex + 1])
        } else {
            setFocusedField(fieldNames[0])
        }
    }

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
