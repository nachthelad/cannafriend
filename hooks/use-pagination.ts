import { useState, useCallback, useMemo } from 'react'

interface UsePaginationOptions {
  initialPage?: number
  pageSize?: number
  totalItems?: number
}

interface UsePaginationReturn {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  startIndex: number
  endIndex: number
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  setPageSize: (size: number) => void
  setTotalItems: (total: number) => void
}

/**
 * Custom hook for pagination logic and state management
 * 
 * @param options - Pagination configuration options
 * @returns Object with pagination state and navigation functions
 * 
 * @example
 * ```typescript
 * // Basic pagination
 * const {
 *   currentPage,
 *   totalPages,
 *   hasNextPage,
 *   hasPreviousPage,
 *   nextPage,
 *   previousPage
 * } = usePagination({ pageSize: 10, totalItems: 100 })
 * 
 * // With dynamic total items
 * const { setTotalItems, startIndex, endIndex } = usePagination({ pageSize: 20 })
 * 
 * // Use with data fetching
 * useEffect(() => {
 *   fetchData(currentPage, pageSize).then(response => {
 *     setTotalItems(response.total)
 *   })
 * }, [currentPage, pageSize])
 * 
 * // Slice array data
 * const paginatedItems = items.slice(startIndex, endIndex + 1)
 * ```
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    pageSize: initialPageSize = 10,
    totalItems: initialTotalItems = 0
  } = options

  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [totalItems, setTotalItems] = useState(initialTotalItems)

  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pageSize) || 1
  }, [totalItems, pageSize])

  const hasNextPage = useMemo(() => {
    return currentPage < totalPages
  }, [currentPage, totalPages])

  const hasPreviousPage = useMemo(() => {
    return currentPage > 1
  }, [currentPage])

  const startIndex = useMemo(() => {
    return (currentPage - 1) * pageSize
  }, [currentPage, pageSize])

  const endIndex = useMemo(() => {
    return Math.min(startIndex + pageSize - 1, totalItems - 1)
  }, [startIndex, pageSize, totalItems])

  const goToPage = useCallback((page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(targetPage)
  }, [totalPages])

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }, [hasNextPage])

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1)
    }
  }, [hasPreviousPage])

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1)
  }, [])

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages)
  }, [totalPages])

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size)
    // Reset to first page when page size changes
    setCurrentPage(1)
  }, [])

  const handleSetTotalItems = useCallback((total: number) => {
    setTotalItems(total)
    // Adjust current page if it exceeds new total pages
    const newTotalPages = Math.ceil(total / pageSize) || 1
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages)
    }
  }, [currentPage, pageSize])

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    setPageSize: handleSetPageSize,
    setTotalItems: handleSetTotalItems
  }
}