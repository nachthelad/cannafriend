import { useState, useEffect, useCallback } from 'react'
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  type DocumentData,
  type DocumentReference,
  type UpdateData,
  type SetOptions 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthUser } from './use-auth-user'
import { unwrapError } from '@/lib/errors'

interface UseFirebaseDocumentOptions {
  realtime?: boolean
  enabled?: boolean
}

interface UseFirebaseDocumentReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  exists: boolean
  create: (data: T, options?: SetOptions) => Promise<void>
  update: (data: UpdateData<T>) => Promise<void>
  remove: () => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Custom hook for managing a single Firebase document with CRUD operations
 * 
 * @param documentPath - Firestore document path (e.g., 'users/uid', 'plants/{userId}/plantId')
 * @param options - Realtime updates and enabled state
 * @returns Object with document data, loading state, error, and CRUD functions
 * 
 * @example
 * ```typescript
 * // Basic document fetching
 * const { data: plant, loading, error } = useFirebaseDocument<Plant>('plants/plantId')
 * 
 * // With realtime updates
 * const { data: user, update } = useFirebaseDocument<User>('users/{userId}', {
 *   realtime: true
 * })
 * 
 * // With CRUD operations
 * const { data, create, update, remove } = useFirebaseDocument<Plant>('plants/newPlant')
 * 
 * // Create new document
 * await create({ name: 'New Plant', type: 'indica' })
 * 
 * // Update existing document
 * await update({ status: 'flowering' })
 * 
 * // Delete document
 * await remove()
 * ```
 */
export function useFirebaseDocument<T extends DocumentData>(
  documentPath: string,
  options: UseFirebaseDocumentOptions = {}
): UseFirebaseDocumentReturn<T> {
  const { realtime = false, enabled = true } = options
  const { user } = useAuthUser()
  
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exists, setExists] = useState(false)

  // Replace {userId} placeholder in path
  const resolvedPath = documentPath.replace('{userId}', user?.uid || '')
  const docRef = doc(db, resolvedPath) as DocumentReference<T>

  const fetchData = useCallback(async () => {
    if (!enabled || !user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        setData({ id: docSnap.id, ...data } as unknown as T)
        setExists(true)
      } else {
        setData(null)
        setExists(false)
      }
    } catch (err: unknown) {
      setError(unwrapError(err, 'Failed to fetch document'))
    } finally {
      setLoading(false)
    }
  }, [docRef, enabled, user])

  const setupRealtimeListener = useCallback(() => {
    if (!enabled || !user) return

    try {
      setError(null)
      
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setData({ id: docSnap.id, ...data } as unknown as T)
          setExists(true)
        } else {
          setData(null)
          setExists(false)
        }
        setLoading(false)
      }, (err: unknown) => {
        setError(unwrapError(err, 'Realtime listener error'))
        setLoading(false)
      })

      return unsubscribe
    } catch (err: unknown) {
      setError(unwrapError(err, 'Failed to setup realtime listener'))
      setLoading(false)
    }
  }, [docRef, enabled, user])

  const create = useCallback(async (data: T, options?: SetOptions) => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      await setDoc(docRef, data, options || {})
      if (!realtime) {
        await fetchData()
      }
    } catch (err: unknown) {
      const errorMessage = unwrapError(err, 'Failed to create document')
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [docRef, user, realtime, fetchData])

  const update = useCallback(async (data: UpdateData<T>) => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      await updateDoc(docRef, data)
      if (!realtime) {
        await fetchData()
      }
    } catch (err: unknown) {
      const errorMessage = unwrapError(err, 'Failed to update document')
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [docRef, user, realtime, fetchData])

  const remove = useCallback(async () => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      await deleteDoc(docRef)
      if (!realtime) {
        setData(null)
        setExists(false)
      }
    } catch (err: unknown) {
      const errorMessage = unwrapError(err, 'Failed to delete document')
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [docRef, user, realtime])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    if (realtime) {
      const unsubscribe = setupRealtimeListener()
      return unsubscribe
    } else {
      fetchData()
    }
  }, [resolvedPath, realtime, enabled, user?.uid, setupRealtimeListener, fetchData])

  return {
    data,
    loading,
    error,
    exists,
    create,
    update,
    remove,
    refetch: fetchData
  }
}