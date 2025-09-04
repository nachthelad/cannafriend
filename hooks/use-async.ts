import { useState, useCallback } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
}

/**
 * Custom hook for handling async operations with loading states and error handling
 * 
 * @param asyncFunction - The async function to execute
 * @param immediate - Whether to execute the function immediately (default: false)
 * @returns Object with data, loading, error states and execute/reset functions
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const { data, loading, error, execute } = useAsync(fetchUserData)
 * 
 * // Execute on mount
 * const { data: plants } = useAsync(fetchPlants, true)
 * 
 * // Manual execution
 * const { execute: saveData, loading: saving } = useAsync(savePlantData)
 * const handleSave = () => execute(plantData)
 * ```
 */
export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  immediate: boolean = false
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null
  })

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const data = await asyncFunction(...args)
      setState({ data, loading: false, error: null })
      return data
    } catch (error: any) {
      const errorMessage = error?.message || 'An error occurred'
      setState({ data: null, loading: false, error: errorMessage })
      console.error('Async operation failed:', error)
      return null
    }
  }, [asyncFunction])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  // Execute immediately if requested
  useState(() => {
    if (immediate) {
      execute()
    }
  })

  return {
    ...state,
    execute,
    reset
  }
}