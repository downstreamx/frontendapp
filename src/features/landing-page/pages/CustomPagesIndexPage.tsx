import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { deleteCustomPage, listCustomPagesPaginated, type CustomPage } from '../landing-page-api'
import { useCustomPagesMeta } from '../hooks/use-landing-page-meta'

type AppliedFilters = {
  is_active: string
}

const defaultFilters: AppliedFilters = {
  is_active: '',
}

export function CustomPagesIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const { data: indexMeta } = useCustomPagesMeta()

  usePageChrome({
    pageTitle: t('Custom pages'),
    breadcrumbs: [
      { label: t('Landing page'), url: paths.landingPage },
      { label: t('Custom pages') },
    ],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.is_active !== '') params.is_active = appliedFilters.is_active
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['landing-page', 'pages', listParams],
    queryFn: () => listCustomPagesPaginated(listParams),
  })

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ['landing-page', 'pages'] })

  const deleteMutation = useMutation({
    mutationFn: deleteCustomPage,
    onSuccess: () => {
      toast.success(t('Deleted successfully'))
      invalidate()
      setDeleteId(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = Object.values(appliedFilters).filter((v) => v !== '').length
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

  const applyFilters = () => {
    toolbar.applySearch()
    setAppliedFilters(draftFilters)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', '1')
      return next
    })
  }

  const clearFilters = () => {
    toolbar.clearSearch()
    setDraftFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('page')
      return next
    })
  }

  const setSort = (field: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const current = prev.get('sort') ?? ''
      const dir = prev.get('direction') ?? 'asc'
      if (current === field && dir === 'asc') {
        next.set('direction', 'desc')
      } else {
        next.set('sort', field)
        next.set('direction', 'asc')
      }
      return next
    })
  }

  const columns: Column<CustomPage>[] = [
    {
      key: 'title',
      header: t('Title'),
      sortable: true,
      render: (_, row) => (
        <Link to={paths.landingPagePageShow(row.id)} className="font-medium text-primary hover:underline">
          {row.title}
        </Link>
      ),
    },
    {
      key: 'slug',
      header: t('URL slug'),
      sortable: true,
      render: (_, row) => <span className="text-muted-foreground">/{row.slug}</span>,
    },
    {
      key: 'is_active',
      header: t('Status'),
      sortable: true,
      render: (_, row) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'}>
          {row.is_active ? t('Active') : t('Inactive')}
        </Badge>
      ),
    },
    {
      key: 'updated_at',
      header: t('Last updated'),
      sortable: true,
      render: (_, row) => (row.updated_at ? formatDate(row.updated_at) : '—'),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <TableRowActions
          editPermission="edit-custom-pages"
          deletePermission="delete-custom-pages"
          onEdit={() => navigate(paths.landingPagePageEdit(row.id))}
          onDelete={row.is_disabled ? undefined : () => setDeleteId(row.id)}
        />
      ),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Custom pages')}
        description={t('Manage public landing pages and legal content.')}
        canCreate
        onCreateClick={() => navigate(paths.landingPagePageCreate)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search pages...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>{t('Status')}</Label>
                <Select
                  value={draftFilters.is_active === '' ? 'all' : draftFilters.is_active}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, is_active: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All statuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All statuses')}</SelectItem>
                    {(indexMeta?.active_options ?? []).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : undefined,
        }}
        pagination={pagination}
        onPageChange={(p) =>
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            next.set('page', String(p))
            return next
          })
        }
      >
        {rows.length === 0 && !isLoading ? (
          <NoRecordsFound
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            onCreateClick={() => navigate(paths.landingPagePageCreate)}
          />
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={setSort}
          />
        )}
      </ModuleListCard>

      <ConfirmationDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('Delete {{entity}}', { entity: t('Custom page') })}
        message={t('Are you sure you want to delete this page?')}
        confirmText={t('Delete')}
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        variant="destructive"
      />
    </>
  )
}
