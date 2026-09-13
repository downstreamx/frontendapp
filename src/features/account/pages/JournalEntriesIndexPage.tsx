import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Eye, Play, Undo2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { paths } from '@/lib/paths'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { getApiErrorMessage } from '@/lib/errors'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import {
  JOURNAL_ENTRY_STATUS_OPTIONS,
  canUnpostJournalEntry,
  formatJournalEntryStatusLabel,
  getJournalEntryStatusBadgeClasses,
} from '../journal-entry-utils'
import {
  listJournalEntriesPaginated,
  postJournalEntry,
  unpostJournalEntry,
  type JournalEntry,
} from '../journal-entries-api'

type AppliedFilters = {
  status: string
  entry_type: string
}

const defaultFilters: AppliedFilters = {
  status: '',
  entry_type: '',
}

export function JournalEntriesIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar({
    defaultPerPage: searchParams.get('per_page') ?? '10',
    initialSearch: searchParams.get('search') ?? '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(() => ({
    status: searchParams.get('status') ?? '',
    entry_type: searchParams.get('entry_type') ?? '',
  }))
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(() => ({
    status: searchParams.get('status') ?? '',
    entry_type: searchParams.get('entry_type') ?? '',
  }))
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'asc') as 'asc' | 'desc'
  const page = searchParams.get('page') ?? '1'

  const [postTarget, setPostTarget] = useState<JournalEntry | null>(null)
  const [unpostTarget, setUnpostTarget] = useState<JournalEntry | null>(null)

  useAccountPageChrome(t('Manage Journal Entries'), t('Journal Entries'))

  const listParams = useMemo(() => {
    const params: Record<string, string> = { per_page: toolbar.perPage, page }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.status) params.status = appliedFilters.status
    if (appliedFilters.entry_type) params.entry_type = appliedFilters.entry_type
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['journal-entries', listParams],
    queryFn: () => listJournalEntriesPaginated(listParams),
  })

  const postMutation = useMutation({
    mutationFn: postJournalEntry,
    onSuccess: () => {
      toast.success(t('Journal entry posted successfully.'))
      setPostTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to post journal entry'))),
  })

  const unpostMutation = useMutation({
    mutationFn: unpostJournalEntry,
    onSuccess: () => {
      toast.success(t('Journal entry unposted successfully.'))
      setUnpostTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to unpost journal entry'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta

  const activeFilterCount = [appliedFilters.status, appliedFilters.entry_type].filter(Boolean).length
  const hasFilters = Boolean(toolbar.search || activeFilterCount > 0)

  const setSort = (field: string) => {
    const next = new URLSearchParams(searchParams)
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    next.set('sort', field)
    next.set('direction', direction)
    next.set('page', '1')
    setSearchParams(next)
  }

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const syncFiltersToUrl = (filters: AppliedFilters, search: string) => {
    const next = new URLSearchParams(searchParams)
    if (search) next.set('search', search)
    else next.delete('search')
    if (filters.status) next.set('status', filters.status)
    else next.delete('status')
    if (filters.entry_type) next.set('entry_type', filters.entry_type)
    else next.delete('entry_type')
    next.set('page', '1')
    setSearchParams(next)
  }

  const columns: Column<JournalEntry>[] = [
    {
      key: 'journal_number',
      header: t('Journal Number'),
      sortable: true,
      render: (value, row) => (
        <Link
          to={paths.account.journalEntryShow(row.id)}
          className="font-medium text-primary hover:underline"
        >
          {String(value ?? `#${row.id}`)}
        </Link>
      ),
    },
    {
      key: 'journal_date',
      header: t('Date'),
      sortable: true,
      render: (_, row) => formatDate(row.journal_date),
    },
    {
      key: 'description',
      header: t('Description'),
      render: (value) => (
        <span className="line-clamp-2 max-w-md">{String(value ?? '—')}</span>
      ),
    },
    {
      key: 'entry_type',
      header: t('Type'),
      render: (value) => (
        <span className="capitalize">{String(value ?? 'manual').replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'total_debit',
      header: t('Debit'),
      sortable: true,
      render: (_, row) => formatCurrency(Number(row.total_debit ?? 0)),
    },
    {
      key: 'total_credit',
      header: t('Credit'),
      sortable: true,
      render: (_, row) => formatCurrency(Number(row.total_credit ?? 0)),
    },
    {
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => (
        <span className={getJournalEntryStatusBadgeClasses(row.status)}>
          {formatJournalEntryStatusLabel(row.status, t)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <div className="flex gap-1">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                onClick={() => navigate(paths.account.journalEntryShow(row.id))}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('View')}</p>
            </TooltipContent>
          </Tooltip>
          {row.status === 'draft' ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-primary hover:text-primary"
                  onClick={() => setPostTarget(row)}
                >
                  <Play className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('Post')}</p>
              </TooltipContent>
            </Tooltip>
          ) : null}
          {canUnpostJournalEntry(row) ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700"
                  onClick={() => setUnpostTarget(row)}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('Unpost')}</p>
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <TooltipProvider>
      <ModuleListCard
        title={t('Journal Entries')}
        canCreate
        onCreateClick={() => navigate(paths.account.journalEntryCreate)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: (cleared) => {
            toolbar.applySearch(cleared)
            syncFiltersToUrl(appliedFilters, cleared ? '' : toolbar.draftSearch.trim())
          },
          searchPlaceholder: t('Search journal entries...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: (
            <PerPageSelector
              value={toolbar.perPage}
              onChange={(value) => {
                toolbar.setPerPage(value)
                const next = new URLSearchParams(searchParams)
                next.set('per_page', value)
                next.set('page', '1')
                setSearchParams(next)
              }}
            />
          ),
          onApplyFilters: () => {
            setAppliedFilters(draftFilters)
            syncFiltersToUrl(draftFilters, toolbar.search)
            toolbar.applySearch()
          },
          onClearFilters: () => {
            setDraftFilters(defaultFilters)
            setAppliedFilters(defaultFilters)
            toolbar.setDraftSearch('')
            toolbar.applySearch(true)
            setSearchParams({ per_page: toolbar.perPage })
          },
          filtersPanel: (
            <>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Status')}</Label>
                <Select
                  value={draftFilters.status || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      status: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All statuses')}</SelectItem>
                    {JOURNAL_ENTRY_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatJournalEntryStatusLabel(status, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Entry Type')}</Label>
                <Select
                  value={draftFilters.entry_type || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      entry_type: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All types')}</SelectItem>
                    <SelectItem value="manual">{t('Manual')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ),
        }}
        pagination={pagination ? { ...pagination, onPageChange: goToPage } : undefined}
      >
        {rows.length === 0 ? (
          <NoRecordsFound
            icon={BookOpen}
            title={t('No journal entries found')}
            description={t('Get started by creating your first journal entry.')}
            hasFilters={hasFilters}
            onClearFilters={() => {
              setDraftFilters(defaultFilters)
              setAppliedFilters(defaultFilters)
              toolbar.setDraftSearch('')
              toolbar.applySearch(true)
              setSearchParams({ per_page: toolbar.perPage })
            }}
            onCreateClick={() => navigate(paths.account.journalEntryCreate)}
            createButtonText={t('Create Journal Entry')}
            className="h-auto py-8"
          />
        ) : (
          <DataTable
            embedded
            data={rows}
            columns={columns}
            onSort={setSort}
            sortKey={sortField}
            sortDirection={sortDirection}
          />
        )}
      </ModuleListCard>

      <ConfirmationDialog
        open={postTarget !== null}
        onOpenChange={(open) => !open && setPostTarget(null)}
        title={t('Post Journal Entry')}
        message={t('Are you sure you want to post this journal entry? This will update account balances.')}
        confirmText={t('Post')}
        onConfirm={() => {
          if (postTarget) postMutation.mutate(postTarget.id)
        }}
        loading={postMutation.isPending}
      />

      <ConfirmationDialog
        open={unpostTarget !== null}
        onOpenChange={(open) => !open && setUnpostTarget(null)}
        title={t('Unpost Journal Entry')}
        message={t('Are you sure you want to unpost this journal entry? Account balances will be reversed.')}
        confirmText={t('Unpost')}
        onConfirm={() => {
          if (unpostTarget) unpostMutation.mutate(unpostTarget.id)
        }}
        loading={unpostMutation.isPending}
      />
    </TooltipProvider>
  )
}
