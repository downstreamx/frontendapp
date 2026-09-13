import { useCallback, useMemo, useState } from 'react'

export type ListToolbarState = {
  search: string
  draftSearch: string
  showFilters: boolean
  perPage: string
}

type Options = {
  defaultPerPage?: string
  initialSearch?: string
}

export function useListToolbar({ defaultPerPage = '10', initialSearch = '' }: Options = {}) {
  const [draftSearch, setDraftSearch] = useState(initialSearch)
  const [search, setSearch] = useState(initialSearch.trim())
  const [showFilters, setShowFilters] = useState(false)
  const [perPage, setPerPage] = useState(defaultPerPage)

  const applySearch = useCallback((cleared?: boolean) => {
    if (cleared) {
      setDraftSearch('')
      setSearch('')
      return
    }
    setSearch(draftSearch.trim())
  }, [draftSearch])

  const toggleFilters = useCallback(() => {
    setShowFilters((open) => !open)
  }, [])

  const clearSearch = useCallback(() => {
    applySearch(true)
  }, [applySearch])

  return useMemo(
    () => ({
      draftSearch,
      setDraftSearch,
      search,
      applySearch,
      clearSearch,
      showFilters,
      toggleFilters,
      setShowFilters,
      perPage,
      setPerPage,
    }),
    [applySearch, clearSearch, draftSearch, perPage, search, showFilters, toggleFilters],
  )
}
