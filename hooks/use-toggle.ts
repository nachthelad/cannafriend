import { useState, useCallback } from 'react'

interface UseToggleReturn {
  value: boolean
  toggle: () => void
  setTrue: () => void
  setFalse: () => void
  setValue: (value: boolean) => void
}

/**
 * Custom hook for managing boolean toggle state with utility functions
 * 
 * @param initialValue - Initial boolean value (default: false)
 * @returns Object with current value and toggle functions
 * 
 * @example
 * ```typescript
 * // Basic toggle
 * const { value: isVisible, toggle } = useToggle(false)
 * 
 * // Password visibility toggle
 * const { value: showPassword, toggle: togglePassword } = useToggle()
 * 
 * // Multiple toggles
 * const { value: showPassword, setTrue: showPass, setFalse: hidePass } = useToggle()
 * const { value: showConfirm, toggle: toggleConfirm } = useToggle()
 * 
 * // Modal state
 * const { value: isOpen, setTrue: open, setFalse: close } = useToggle()
 * ```
 */
export function useToggle(initialValue: boolean = false): UseToggleReturn {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => {
    setValue(prev => !prev)
  }, [])

  const setTrue = useCallback(() => {
    setValue(true)
  }, [])

  const setFalse = useCallback(() => {
    setValue(false)
  }, [])

  const setValueCallback = useCallback((newValue: boolean) => {
    setValue(newValue)
  }, [])

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    setValue: setValueCallback
  }
}