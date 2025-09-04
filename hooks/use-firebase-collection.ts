import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where, 
  onSnapshot,
  type Query,
  type DocumentData,
  type QueryConstraint 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthUser } from './use-auth-user'

interface UseFirebaseCollectionOptions {
  constraints?: QueryConstraint[]
  realtime?: boolean
  enabled?: boolean
}

interface UseFirebaseCollectionReturn<T> {
  data: T[]
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Custom hook for fetching Firebase collections with loading states and error handling
 * 
 * @param collectionPath - Firestore collection path (e.g., 'plants', 'users/uid/logs')
 * @param options - Query constraints, realtime updates, and enabled state
 * @returns Object with data, loading state, error, and refetch function
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const { data: plants, loading, error } = useFirebaseCollection<Plant>('plants')
 * 
 * // With constraints
 * const { data: logs } = useFirebaseCollection<LogEntry>('logs', {
 *   constraints: [orderBy('createdAt', 'desc'), limit(10)]
 * })
 * 
 * // With realtime updates
 * const { data: reminders } = useFirebaseCollection<Reminder>('reminders', {
 *   realtime: true
 * })
 * ```
 */
export function useFirebaseCollection<T extends DocumentData>(
  collectionPath: string,
  options: UseFirebaseCollectionOptions = {}
): UseFirebaseCollectionReturn<T> {
  const { constraints = [], realtime = false, enabled = true } = options
  const { user } = useAuthUser()
  
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!enabled || !user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Replace {userId} placeholder in path
      const path = collectionPath.replace('{userId}', user.uid)
      const collectionRef = collection(db, path)
      
      let queryRef: Query = collectionRef
      if (constraints.length > 0) {
        queryRef = query(collectionRef, ...constraints)
      }

      const snapshot = await getDocs(queryRef)
      const documents = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data
        } as unknown as T
      })

      setData(documents)
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch data')
      console.error('Firebase collection fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeListener = () => {
    if (!enabled || !user) return

    try {
      setError(null)
      
      const path = collectionPath.replace('{userId}', user.uid)
      const collectionRef = collection(db, path)
      
      let queryRef: Query = collectionRef
      if (constraints.length > 0) {
        queryRef = query(collectionRef, ...constraints)
      }

      const unsubscribe = onSnapshot(queryRef, (snapshot) => {
        const documents = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data
          } as unknown as T
        })

        setData(documents)
        setLoading(false)
      }, (err) => {
        setError(err?.message || 'Realtime listener error')
        console.error('Firebase realtime error:', err)
        setLoading(false)
      })

      return unsubscribe
    } catch (err: any) {
      setError(err?.message || 'Failed to setup realtime listener')
      setLoading(false)
    }
  }

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
  }, [collectionPath, JSON.stringify(constraints), realtime, enabled, user?.uid])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}