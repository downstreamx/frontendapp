import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { deleteTraining, listTrainingsPaginated, type TrainingRow } from '../training-api'
import { useTrainingsIndexMeta } from '../hooks/use-training-meta'

type AppliedFilters = { training_type_id: string; trainer_id: string; status: string }
const defaultFilters: AppliedFilters = { training_type_id: '', trainer_id: '', status: '' }

export function TrainingsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { meta, trainingTypeOptions, trainerOptions } = useTrainingsIndexMeta()
  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  usePageChrome({
    pageTitle: t('Trainings'),
    breadcrumbs: [{ label: t('Training') }, { label: t('Trainings') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.training_type_id) params.training_type_id = appliedFilters.training_type_id
    if (appliedFilters.trainer_id) params.trainer_id = appliedFilters.trainer_id
    if (appliedFilters.status) params.status = appliedFilters.status
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['training', 'trainings', listParams],
    queryFn: () => listTrainingsPaginated(listParams),
  })

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ['training', 'trainings'] })

  const deleteMutation = useMutation({
    mutationFn: deleteTraining,
    onSuccess: () => {
      toast.success(t('Deleted successfully'))
      invalidate()
      setDeleteId(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length
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

  const columns: Column<TrainingRow>[] = [
    {
      key: 'title',
      header: t('Title'),
      sortable: true,
      render: (_, row) => (
        <Link to={paths.training.show(row.id)} className="font-medium text-primary hover:underline">
          {row.title}
        </Link>
      ),
    },
    {
      key: 'training_type',
      header: t('Type'),
      render: (_, row) => row.training_type?.name ?? '—',
    },
    {
      key: 'trainer',
      header: t('Trainer'),
      render: (_, row) => row.trainer?.name ?? '—',
    },
    {
      key: 'dates',
      header: t('Dates'),
      sortable: true,
      render: (_, row) => {
        const start = row.start_date ? formatDate(row.start_date) : '—'
        const end = row.end_date ? formatDate(row.end_date) : '—'
        return `${start} – ${end}`
      },
    },
    {
      key: 'location',
      header: t('Location'),
      render: (_, row) => row.location ?? '—',
    },
    {
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => (row.status ? <FleetStatusBadge status={row.status} /> : '—'),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <TableRowActions
          editPermission="manage-trainings"
          deletePermission="manage-trainings"
          onEdit={() => navigate(paths.training.edit(row.id))}
          onDelete={() => setDeleteId(row.id)}
        />
      ),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Trainings')}
        description={t('Plan and manage employee training sessions.')}
        canCreate
        onCreateClick={() => navigate(paths.training.create)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search trainings...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('Training type')}</Label>
                <Select
                  value={draftFilters.training_type_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({
                      ...f,
                      training_type_id: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All types')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All types')}</SelectItem>
                    {(meta?.training_types ?? []).map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Trainer')}</Label>
                <Select
                  value={draftFilters.trainer_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, trainer_id: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All trainers')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All trainers')}</SelectItem>
                    {(meta?.trainers ?? []).map((trainer) => (
                      <SelectItem key={trainer.id} value={String(trainer.id)}>
                        {trainer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Status')}</Label>
                <Select
                  value={draftFilters.status || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, status: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All statuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All statuses')}</SelectItem>
                    {(meta?.statuses ?? []).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
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
            onCreateClick={() => navigate(paths.training.create)}
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
        title={t('Delete {{entity}}', { entity: t('Training') })}
        message={t('Are you sure you want to delete this record?')}
        confirmText={t('Delete')}
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        variant="destructive"
      />
    </>
  )
}
