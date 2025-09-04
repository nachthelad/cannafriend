import { useState } from 'react'
import { useForm, FieldValues, UseFormProps } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useErrorHandler } from '@/hooks/use-error-handler'
import { useToast } from '@/hooks/use-toast'

interface UseFormAuthOptions<T extends FieldValues> extends UseFormProps<T> {
  namespace?: string
}

interface UseFormAuthReturn<T extends FieldValues> {
  form: ReturnType<typeof useForm<T>>
  isLoading: boolean
  loadingStep: string
  setIsLoading: (loading: boolean) => void
  setLoadingStep: (step: string) => void
  showPassword: boolean
  setShowPassword: (show: boolean) => void
  showConfirmPassword?: boolean
  setShowConfirmPassword?: (show: boolean) => void
  handleFirebaseError: (error: any, context?: string) => void
  toast: ReturnType<typeof useToast>['toast']
  t: ReturnType<typeof useTranslation>['t']
}

/**
 * Custom hook for authentication forms with common state and utilities
 * 
 * @param options - Form options including default values and validation rules
 * @returns Object with form controls, loading states, and utility functions
 * 
 * @example
 * ```typescript
 * // Login form
 * const { form, isLoading, setIsLoading, showPassword, setShowPassword } = useFormAuth<LoginData>({
 *   defaultValues: { email: '', password: '' }
 * })
 * 
 * // Signup form with confirm password
 * const { 
 *   form, 
 *   isLoading, 
 *   setLoadingStep, 
 *   showPassword, 
 *   showConfirmPassword, 
 *   setShowConfirmPassword 
 * } = useFormAuth<SignupData>({
 *   defaultValues: { email: '', password: '', confirmPassword: '' }
 * })
 * ```
 */
export function useFormAuth<T extends FieldValues>(
  options: UseFormAuthOptions<T> = {}
): UseFormAuthReturn<T> {
  const { namespace = 'auth', ...formOptions } = options
  const { t } = useTranslation([namespace, 'common'])
  const { toast } = useToast()
  const { handleFirebaseError } = useErrorHandler()
  
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<T>(formOptions)

  return {
    form,
    isLoading,
    loadingStep,
    setIsLoading,
    setLoadingStep,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleFirebaseError,
    toast,
    t
  }
}