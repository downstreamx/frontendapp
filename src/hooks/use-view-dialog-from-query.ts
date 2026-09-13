import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Opens a view dialog when the URL contains `?view=<id>`, then strips the param. */
export function useViewDialogFromQuery(enabled: boolean, paramName = 'view') {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewId, setViewId] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    const id = searchParams.get(paramName)
    if (!id) return
    setViewId(id)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(paramName)
        return next
      },
      { replace: true },
    )
  }, [enabled, paramName, searchParams, setSearchParams])

  const openView = useCallback((id: string | number) => {
    setViewId(String(id))
  }, [])

  const closeView = useCallback(() => {
    setViewId(null)
  }, [])

  return {
    viewId,
    isOpen: viewId !== null,
    openView,
    closeView,
  }
}
