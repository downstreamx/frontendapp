import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LookupSelectContent } from '@/components/forms/entity-select'
import { toTruckLookupOptions } from '@/features/_shared/operations-lookups'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatDate, formatCurrency } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { truckLabel } from '@/features/shared/lib/entity-labels'
import { FleetStatusBadge } from '../components/FleetStatusBadge'
import { TruckMaintenanceFormFields } from '../components/TruckMaintenanceFormFields'
import {
  createTruckMaintenance,
  fetchTruckMaintenanceCreateMeta,
  fetchTruckMaintenanceEditMeta,
  fetchTruckMaintenancesIndexMeta,
  listTruckMaintenancesPaginated,
  updateTruckMaintenance,
  type TruckMaintenanceRow,
} from '../fleet-api'
import { ForbiddenPage } from '@/components/status-page'
import {
  formStateToMaintenancePayload,
  initialMaintenanceFormState,
  maintenanceToFormState,
  type TruckMaintenanceFormState,
} from '../truck-maintenance-form-utils'

type AppliedFilters = {
  truck_id: string
  status: string
}

const defaultFilters: AppliedFilters = {
  truck_id: '',
  status: '',
}

export function TruckMaintenancesIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<TruckMaintenanceFormState>(initialMaintenanceFormState())

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const canManage = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'manage-truck-maintenances',
  )
  const canCreate = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'create-truck-maintenances',
  )

  usePageChrome({
    pageTitle: t('Truck Maintenances'),
    breadcrumbs: [{ label: t('Fleet') }, { label: t('Truck Maintenances') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.truck_id) params.truck_id = appliedFilters.truck_id
    if (appliedFilters.status) params.status = appliedFilters.status
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['fleet', 'truck-maintenances', listParams],
    queryFn: () => listTruckMaintenancesPaginated(listParams),
    enabled: canManage,
  })

  const { data: indexMeta } = useQuery({
    queryKey: ['fleet', 'truck-maintenances', 'index-meta'],
    queryFn: fetchTruckMaintenancesIndexMeta,
    enabled: canManage,
  })

  const { data: createMeta } = useQuery({
    queryKey: ['fleet', 'truck-maintenances', 'create-meta'],
    queryFn: fetchTruckMaintenanceCreateMeta,
    enabled: canManage && dialogOpen && editingId == null,
  })

  const { data: editMeta, isLoading: editMetaLoading } = useQuery({
    queryKey: ['fleet', 'truck-maintenances', editingId, 'edit-meta'],
    queryFn: () => fetchTruckMaintenanceEditMeta(editingId!),
    enabled: canManage && dialogOpen && editingId != null,
  })

  const formMeta = editingId != null ? editMeta : createMeta
  const statuses = formMeta?.statuses ?? indexMeta?.statuses ?? ['scheduled']

  const truckOptions = useMemo(
    () => toTruckLookupOptions(formMeta?.trucks ?? indexMeta?.trucks ?? []),
    [formMeta?.trucks, indexMeta?.trucks],
  )

  const providerOptions = useMemo(
    () =>
      (formMeta?.maintenance_providers ?? []).map((p) => ({
        id: p.id,
        label: p.name,
      })),
    [formMeta?.maintenance_providers],
  )

  useEffect(() => {
    const shouldCreate = searchParams.get('create')
    const editParam = searchParams.get('edit')
    if (!shouldCreate && !editParam) return

    if (shouldCreate) {
      setEditingId(null)
      setForm(initialMaintenanceFormState())
      setDialogOpen(true)
    } else if (editParam) {
      const id = Number(editParam)
      if (id) {
        setEditingId(id)
        setDialogOpen(true)
      }
    }

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('create')
      next.delete('edit')
      return next
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dialogOpen) return
    if (editingId == null) {
      setForm(initialMaintenanceFormState())
      return
    }
    if (editMeta?.maintenance) {
      setForm(maintenanceToFormState(editMeta.maintenance))
    }
  }, [dialogOpen, editingId, editMeta])

  const setField = <K extends keyof TruckMaintenanceFormState>(
    key: K,
    value: TruckMaintenanceFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = formStateToMaintenancePayload(form)
      return editingId != null
        ? updateTruckMaintenance(editingId, payload)
        : createTruckMaintenance(payload)
    },
    onSuccess: () => {
      toast.success(editingId != null ? t('Maintenance updated') : t('Maintenance recorded'))
      void queryClient.invalidateQueries({ queryKey: ['fleet', 'truck-maintenances'] })
      setDialogOpen(false)
      setEditingId(null)
      setForm(initialMaintenanceFormState())
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save maintenance'))),
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(initialMaintenanceFormState())
    setDialogOpen(true)
  }

  const openEdit = (row: TruckMaintenanceRow) => {
    setEditingId(row.id)
    setDialogOpen(true)
  }

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'fleet.truck-maintenances.destroy',
      defaultMessage: t('Are you sure you want to delete this maintenance record?'),
      onSuccess: () => {
        toast.success(t('Maintenance deleted'))
        void queryClient.invalidateQueries({ queryKey: ['fleet', 'truck-maintenances'] })
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete maintenance'))),
    })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = [appliedFilters.truck_id, appliedFilters.status].filter(Boolean).length
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

  const columns: Column<TruckMaintenanceRow>[] = [
    {
      key: 'truck_id',
      header: t('Truck'),
      render: (_, row) => truckLabel(row.truck, row.truck_id),
    },
    {
      key: 'provider_id',
      header: t('Provider'),
      render: (_, row) => row.maintenance_provider?.name ?? '—',
    },
    {
      key: 'service_type',
      header: t('Service type'),
      sortable: true,
      render: (_, row) => (
        <Link
          to={paths.fleet.truckMaintenanceShow(row.id)}
          className="text-primary capitalize hover:underline"
        >
          {(row.service_type ?? '—').replace(/-/g, ' ')}
        </Link>
      ),
    },
    {
      key: 'start_date',
      header: t('Start date'),
      sortable: true,
      render: (_, row) => (row.start_date ? formatDate(row.start_date) : '—'),
    },
    {
      key: 'total_cost',
      header: t('Total cost'),
      sortable: true,
      render: (_, row) =>
        row.total_cost != null && row.total_cost !== '' ? formatCurrency(row.total_cost) : '—',
    },
    {
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => <FleetStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <TableRowActions
          viewPermission="edit-truck-maintenances"
          editPermission="edit-truck-maintenances"
          deletePermission="delete-truck-maintenances"
          onView={() => navigate(paths.fleet.truckMaintenanceShow(row.id))}
          onEdit={() => openEdit(row)}
          onDelete={() =>
            openDeleteDialog(
              row.id,
              t('Delete maintenance "{{service}}"?', {
                service: row.service_type ?? t('record'),
              }),
            )
          }
        />
      ),
    },
  ]

  if (!canManage) {
    return <ForbiddenPage />
  }

  return (
    <>
      <ModuleListCard
        title={t('Truck Maintenances')}
        description={t('Track service work, costs, and maintenance status per truck.')}
        canCreate={canCreate}
        onCreateClick={openCreate}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search maintenances...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>{t('Truck')}</Label>
                <Select
                  value={draftFilters.truck_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, truck_id: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All trucks')} />
                  </SelectTrigger>
                  <LookupSelectContent
                      leadingItem={<SelectItem value="all">{t('All trucks')}</SelectItem>}
                      options={truckOptions}
                    />
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
                    {(indexMeta?.statuses ?? []).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace('_', ' ')}
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
            createPermission="create-truck-maintenances"
            onCreateClick={openCreate}
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

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingId(null)
            setForm(initialMaintenanceFormState())
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId != null ? t('Edit Truck Maintenance') : t('Create Truck Maintenance')}
            </DialogTitle>
          </DialogHeader>
          {editingId != null && editMetaLoading ? (
            <p className="text-sm text-muted-foreground">{t('Loading...')}</p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                saveMutation.mutate()
              }}
            >
              <TruckMaintenanceFormFields
                form={form}
                setField={setField}
                truckOptions={truckOptions}
                providerOptions={providerOptions}
                statuses={statuses}
              />
              <DialogFooter>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {t('Save')}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete maintenance')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
