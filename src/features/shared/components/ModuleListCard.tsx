import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Pagination, type PaginatedListMeta } from '@/components/ui/pagination'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import { SearchAndFilter, type SearchAndFilterProps } from '@/components/ui/search-and-filter'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ListPaginationProvider } from '@/contexts/list-pagination-context'
import { useRegisterContentTitle } from '@/contexts/page-chrome-context'

type SearchToolbarProps = Omit<SearchAndFilterProps, 'children'> & {
  filtersPanel?: ReactNode
}

type Props = {
  title: string
  description?: string
  /** Legacy icon-only create button with tooltip */
  canCreate?: boolean
  onCreateClick?: () => void
  /** Custom header actions (overrides default create when provided) */
  actions?: ReactNode
  /** Legacy search + filter toolbar */
  searchToolbar?: SearchToolbarProps
  /** Server-driven pagination footer */
  pagination?: PaginatedListMeta & { onPageChange?: (page: number) => void }
  /** Legacy: separate from `pagination` on many index pages */
  onPageChange?: (page: number) => void
  isLoading?: boolean
  error?: boolean
  children: ReactNode
}

export function ModuleListCard({
  title,
  description,
  canCreate,
  onCreateClick,
  actions,
  searchToolbar,
  pagination,
  onPageChange,
  isLoading,
  error,
  children,
}: Props) {
  const { t } = useTranslation()
  useRegisterContentTitle(title)

  const paginationForSn = pagination
    ? {
        ...pagination,
        onPageChange: pagination.onPageChange ?? onPageChange,
      }
    : undefined

  const paginationFooter =
    paginationForSn?.onPageChange != null ? (paginationForSn as PaginatedListMeta & { onPageChange: (page: number) => void }) : undefined

  const headerAction =
    actions ??
    (canCreate && onCreateClick ? (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button size="sm" className="shrink-0 gap-1.5" onClick={onCreateClick}>
            <Plus className="h-4 w-4" aria-hidden />
            <span className="sr-only sm:not-sr-only sm:inline">{t('Create')}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="sm:hidden">
          <p>{t('Create')}</p>
        </TooltipContent>
      </Tooltip>
    ) : null)

  return (
    <TooltipProvider>
      <Card>
        <CardContent className={cn('p-6', searchToolbar && 'pb-0')}>
          <div
            className={cn(
              'flex items-center justify-between gap-4',
              searchToolbar ? 'mb-4' : 'mb-6',
            )}
          >
            <div className="min-w-0">
              <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
              {description && (
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
              )}
            </div>
            {headerAction}
          </div>
        </CardContent>

        {searchToolbar && (
          <SearchAndFilter {...searchToolbar}>{searchToolbar.filtersPanel}</SearchAndFilter>
        )}

        <CardContent className="p-0">
          {isLoading && <PageContentLoader className="min-h-[16rem] py-10" />}
          {error && !isLoading && (
            <p className="px-6 pb-6 text-sm text-destructive">{t('Failed to load list.')}</p>
          )}
          {!isLoading && !error && (
            <div className="scrollbar-thin scrollbar-thumb-border scrollbar-track-section max-h-[75vh] w-full overflow-y-auto rounded-none">
              <div className="min-w-[600px]">
                <ListPaginationProvider meta={paginationForSn}>{children}</ListPaginationProvider>
              </div>
            </div>
          )}
        </CardContent>

        {paginationFooter && !isLoading && !error && (
          <div className="border-t border-border/50 px-4 sm:px-6">
            <Pagination data={paginationFooter} onPageChange={paginationFooter.onPageChange} />
          </div>
        )}
      </Card>
    </TooltipProvider>
  )
}
