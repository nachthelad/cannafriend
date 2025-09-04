import { useState, useCallback } from 'react'

interface UseLoadingStepsReturn {
  isLoading: boolean
  currentStep: string
  startLoading: (initialStep?: string) => void
  setStep: (step: string) => void
  stopLoading: () => void
  withLoading: <T>(
    steps: string[],
    asyncOperations: (() => Promise<T>)[]
  ) => Promise<T[]>
}

/**
 * Custom hook for managing multi-step loading states
 * 
 * @returns Object with loading state and step management functions
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const { isLoading, currentStep, startLoading, setStep, stopLoading } = useLoadingSteps()
 * 
 * // Manual step management
 * const handleSubmit = async () => {
 *   startLoading('Validating data...')
 *   // ... validation logic
 *   setStep('Creating user...')
 *   // ... user creation logic
 *   setStep('Saving profile...')
 *   // ... profile save logic
 *   stopLoading()
 * }
 * 
 * // Automatic step management
 * const { withLoading } = useLoadingSteps()
 * const handleAutoSubmit = async () => {
 *   try {
 *     const results = await withLoading(
 *       ['Validating...', 'Creating user...', 'Saving profile...'],
 *       [validateData, createUser, saveProfile]
 *     )
 *   } catch (error) {
 *     // Handle error
 *   }
 * }
 * ```
 */
export function useLoadingSteps(): UseLoadingStepsReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<string>('')

  const startLoading = useCallback((initialStep: string = '') => {
    setIsLoading(true)
    setCurrentStep(initialStep)
  }, [])

  const setStep = useCallback((step: string) => {
    setCurrentStep(step)
  }, [])

  const stopLoading = useCallback(() => {
    setIsLoading(false)
    setCurrentStep('')
  }, [])

  const withLoading = useCallback(async <T>(
    steps: string[],
    asyncOperations: (() => Promise<T>)[]
  ): Promise<T[]> => {
    if (steps.length !== asyncOperations.length) {
      throw new Error('Steps and operations arrays must have the same length')
    }

    startLoading(steps[0])
    
    try {
      const results: T[] = []
      
      for (let i = 0; i < asyncOperations.length; i++) {
        if (i > 0) {
          setStep(steps[i])
        }
        const result = await asyncOperations[i]()
        results.push(result)
      }
      
      return results
    } finally {
      stopLoading()
    }
  }, [startLoading, setStep, stopLoading])

  return {
    isLoading,
    currentStep,
    startLoading,
    setStep,
    stopLoading,
    withLoading
  }
}