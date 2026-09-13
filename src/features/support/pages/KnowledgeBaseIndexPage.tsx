import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { DataTable, type Column } from '@/components/ui/data-table'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import {
  deleteKnowledgeBase,
  listKnowledgeBasesPaginated,
  type KnowledgeBaseRow,
} from '../support-api'

export function KnowledgeBaseIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  usePageChrome({
    pageTitle: t('Knowledge base'),
    breadcrumbs: [{ label: t('Support') }, { label: t('Knowledge base') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['support-ticket', 'knowledge-bases', listParams],
    queryFn: () => listKnowledgeBasesPaginated(listParams),
  })

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ['support-ticket', 'knowledge-bases'] })

  const deleteMutation = useMutation({
    mutationFn: deleteKnowledgeBase,
    onSuccess: () => {
      toast.success(t('Deleted successfully'))
      invalidate()
      setDeleteId(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const hasFilters = Boolean(toolbar.search)

  const applyFilters = () => {
    toolbar.applySearch()
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', '1')
      return next
    })
  }

  const clearFilters = () => {
    toolbar.clearSearch()
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

  const columns: Column<KnowledgeBaseRow>[] = [
    {
      key: 'title',
      header: t('Title'),
      sortable: true,
      render: (_, row) => (
        <Link
          to={paths.support.knowledgeBaseShow(row.id)}
          className="font-medium text-primary hover:underline"
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: 'category',
      header: t('Category'),
      render: (_, row) => row.category ?? '—',
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <TableRowActions
          onEdit={() => navigate(paths.support.knowledgeBaseEdit(row.id))}
          onDelete={() => setDeleteId(row.id)}
        />
      ),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Knowledge base')}
        description={t('Manage help articles for your support portal.')}
        canCreate
        onCreateClick={() => navigate(paths.support.knowledgeBaseCreate)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search articles...'),
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
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
            onCreateClick={() => navigate(paths.support.knowledgeBaseCreate)}
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
        title={t('Delete {{entity}}', { entity: t('Article') })}
        message={t('Are you sure you want to delete this record?')}
        confirmText={t('Delete')}
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        variant="destructive"
      />
    </>
  )
}
