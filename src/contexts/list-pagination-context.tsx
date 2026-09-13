import { createContext, useContext, type ReactNode } from 'react'
import type { PaginatedListMeta } from '@/components/ui/pagination'

const ListPaginationContext = createContext<PaginatedListMeta | undefined>(undefined)

export function ListPaginationProvider({
  meta,
  children,
}: {
  meta?: PaginatedListMeta
  children: ReactNode
}) {
  return (
    <ListPaginationContext.Provider value={meta}>{children}</ListPaginationContext.Provider>
  )
}

export function useListPaginationMeta(): PaginatedListMeta | undefined {
  return useContext(ListPaginationContext)
}
