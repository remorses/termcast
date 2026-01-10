import React, { useState, useLayoutEffect } from 'react'
import { useTheme } from 'termcast/src/theme'
import { useFocusContext, useFormScrollContext } from './index'

export const FormEnd = (): any => {
  const theme = useTheme()
  const { focusedField } = useFocusContext()
  const scrollContext = useFormScrollContext()
  const [isLastFieldFocused, setIsLastFieldFocused] = useState(false)

  useLayoutEffect(() => {
    if (!scrollContext || !focusedField) {
      setIsLastFieldFocused(false)
      return
    }
    // Use committedMap for stability
    const descendants = Object.values(scrollContext.descendantsContext.committedMap)
      .filter((item) => item.index !== -1 && item.props?.id)
      .sort((a, b) => a.index - b.index)
    if (descendants.length === 0) {
      setIsLastFieldFocused(false)
      return
    }
    const lastField = descendants[descendants.length - 1]
    setIsLastFieldFocused(lastField.props?.id === focusedField)
  }, [focusedField, scrollContext?.descendantsContext.committedMap])

  return <text fg={isLastFieldFocused ? theme.accent : theme.text}>└</text>
}
