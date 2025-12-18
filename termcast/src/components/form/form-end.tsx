import React, { useState, useLayoutEffect } from 'react'
import { Theme } from 'termcast/src/theme'
import { useFocusContext, useFormScrollContext } from './index'

export const FormEnd = (): any => {
  const { focusedField } = useFocusContext()
  const scrollContext = useFormScrollContext()
  const [isLastFieldFocused, setIsLastFieldFocused] = useState(false)

  useLayoutEffect(() => {
    if (!scrollContext || !focusedField) {
      setIsLastFieldFocused(false)
      return
    }
    const descendants = Object.values(scrollContext.descendantsContext.map.current)
      .filter((item) => item.index !== -1 && item.props?.id)
      .sort((a, b) => a.index - b.index)
    if (descendants.length === 0) {
      setIsLastFieldFocused(false)
      return
    }
    const lastField = descendants[descendants.length - 1]
    setIsLastFieldFocused(lastField.props?.id === focusedField)
  }, [focusedField])

  return <text fg={isLastFieldFocused ? Theme.accent : Theme.text}>└</text>
}
