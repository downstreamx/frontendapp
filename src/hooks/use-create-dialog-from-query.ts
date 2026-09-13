import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Opens a create dialog when the URL contains `?create=1`, then strips the param. */
export function useCreateDialogFromQuery(enabled: boolean) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!enabled) return
    if (searchParams.get('create') !== '1') return
    setOpen(true)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('create')
        return next
      },
      { replace: true },
    )
  }, [enabled, searchParams, setSearchParams])

  return { open, setOpen }
}
