import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Truck } from 'lucide-react'
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
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import {
  TableAvatarFrame,
  TableAvatarMedia,
} from '@/features/shared/components/table-avatar-cells'
import { TruckStatusBadge } from '../components/TruckStatusBadge'
import { TruckOperationalStatusBadge } from '../components/TruckOperationalStatusBadge'
import { TRUCK_OPERATIONAL_STATUSES, truckOperationalStatusLabel } from '../truck-operational-status-ui'
import { TruckViewDialog } from '../components/TruckViewDialog'
import { TruckFormFields } from '../components/TruckFormFields'
import {
  createTruck,
  fetchTruckCreateMeta,
  fetchTruckEditMeta,
  fetchTrucksIndexMeta,
  listTrucksPaginated,
  updateTruck,
  type TruckListRow,
} from '../fleet-api'
import { ForbiddenPage } from '@/components/status-page'
import {
  formStateToPayload,
  initialTruckFormState,
  truckToFormState,
  type TruckFormState,
} from '../truck-form-utils'

type AppliedFilters = {
  status: string
  operational_status: string
  provider_id: string
}

const defaultFilters: AppliedFilters = {
  status: '',
  operational_status: '',
  provider_id: '',
}

export function TrucksIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingId, setViewingId] = useState<number | null>(null)
  const [form, setForm] = useState<TruckFormState>(initialTruckFormState)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const canCreate = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-trucks')
  const canManage = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-trucks')

  usePageChrome({
    pageTitle: t('Trucks'),
    breadcrumbs: [{ label: t('Fleet') }, { label: t('Trucks') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.status) params.status = appliedFilters.status
    if (appliedFilters.operational_status) params.operational_status = appliedFilters.operational_status
    if (appliedFilters.provider_id) params.provider_id = appliedFilters.provider_id
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['fleet', 'trucks', listParams],
    queryFn: () => listTrucksPaginated(listParams),
    enabled: canManage,
  })

  const { data: indexMeta } = useQuery({
    queryKey: ['fleet', 'trucks', 'index-meta'],
    queryFn: fetchTrucksIndexMeta,
    enabled: canManage,
  })

  const { data: createMeta } = useQuery({
    queryKey: ['fleet', 'trucks', 'create-meta'],
    queryFn: fetchTruckCreateMeta,
    enabled: canManage && dialogOpen && editingId == null,
  })

  const { data: editMeta, isLoading: editMetaLoading } = useQuery({
    queryKey: ['fleet', 'trucks', editingId, 'edit-meta'],
    queryFn: () => fetchTruckEditMeta(editingId!),
    enabled: canManage && dialogOpen && editingId != null,
  })

  const formMeta = editingId != null ? editMeta : createMeta
  const truckProviders = formMeta?.truck_providers ?? indexMeta?.truck_providers ?? []
  const statuses = formMeta?.statuses ?? indexMeta?.statuses ?? []

  useEffect(() => {
    const shouldCreate = searchParams.get('create')
    const editParam = searchParams.get('edit')
    const viewParam = searchParams.get('view')
    if (!shouldCreate && !editParam && !viewParam) return

    if (shouldCreate) {
      setEditingId(null)
      setForm(initialTruckFormState)
      setDialogOpen(true)
    } else if (editParam) {
      const id = Number(editParam)
      if (id) {
        setEditingId(id)
        setDialogOpen(true)
      }
    } else if (viewParam) {
      const id = Number(viewParam)
      if (id) {
        setViewingId(id)
        setViewDialogOpen(true)
      }
    }

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('create')
      next.delete('edit')
      next.delete('view')
      return next
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dialogOpen) return
    if (editingId == null) {
      setForm(initialTruckFormState)
      return
    }
    if (editMeta?.truck) {
      setForm(truckToFormState(editMeta.truck))
    }
  }, [dialogOpen, editingId, editMeta])

  const setField = <K extends keyof TruckFormState>(key: K, value: TruckFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = formStateToPayload(form)
      return editingId != null ? updateTruck(editingId, payload) : createTruck(payload)
    },
    onSuccess: () => {
      toast.success(
        editingId != null
          ? t('The truck details are updated successfully.')
          : t('The truck has been created successfully.'),
      )
      void queryClient.invalidateQueries({ queryKey: ['fleet', 'trucks'] })
      setDialogOpen(false)
      setEditingId(null)
      setForm(initialTruckFormState)
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(
          err,
          editingId != null ? t('Failed to update truck') : t('Failed to create truck'),
        ),
      ),
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(initialTruckFormState)
    setDialogOpen(true)
  }

  const openEdit = (row: TruckListRow) => {
    setEditingId(row.id)
    setDialogOpen(true)
  }

  const openView = (row: TruckListRow) => {
    setViewingId(row.id)
    setViewDialogOpen(true)
  }

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.plate_number.trim() || !form.provider_id) {
      toast.error(t('Plate number and provider are required'))
      return
    }
    saveMutation.mutate()
  }

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'fleet.trucks.destroy',
      defaultMessage: t('Are you sure you want to delete this truck?'),
      onSuccess: () => {
        toast.success(t('The truck has been deleted.'))
        void queryClient.invalidateQueries({ queryKey: ['fleet', 'trucks'] })
        void queryClient.invalidateQueries({ queryKey: ['fleet', 'create-meta'] })
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete truck'))),
    })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = [
    appliedFilters.status,
    appliedFilters.operational_status,
    appliedFilters.provider_id,
  ].filter(Boolean).length
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

  const columns: Column<TruckListRow>[] = [
    {
      key: 'plate_number',
      header: t('Plate Number'),
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <TableAvatarFrame size="md">
            <TableAvatarMedia src={row.avatar} fallback={Truck} alt={row.plate_number} />
          </TableAvatarFrame>
          <button
            type="button"
            onClick={() => openView(row)}
            className="font-medium text-primary hover:underline"
          >
            {row.plate_number}
          </button>
        </div>
      ),
    },
    {
      key: 'provider_id',
      header: t('Truck Provider'),
      render: (_, row) => row.truck_provider?.name ?? '—',
    },
    {
      key: 'make',
      header: t('Make'),
      sortable: true,
      render: (value) => (value ? t(String(value)) : '—'),
    },
    {
      key: 'truck_model',
      header: t('Model'),
      sortable: true,
      render: (value) => (value ? t(String(value)) : '—'),
    },
    {
      key: 'capacity_litres',
      header: t('Fuel Capacity'),
      render: (value) => (value ? `${value} L` : '—'),
    },
    {
      key: 'status',
      header: t('Fleet status'),
      sortable: true,
      render: (_, row) => <TruckStatusBadge status={row.status} />,
    },
    {
      key: 'operational_status',
      header: t('Operational'),
      render: (_, row) => <TruckOperationalStatusBadge status={row.operational_status} />,
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <TableRowActions
          viewPermission="view-trucks"
          editPermission="edit-trucks"
          deletePermission="delete-trucks"
          onView={() => openView(row)}
          onEdit={() => openEdit(row)}
          onDelete={() =>
            openDeleteDialog(
              row.id,
              t('Are you sure you want to delete "{{plate}}"?', { plate: row.plate_number }),
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
        title={t('Trucks')}
        description={t('Manage fleet trucks, status, and providers.')}
        canCreate={canCreate}
        onCreateClick={openCreate}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search trucks...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('Fleet status')}</Label>
                <Select
                  value={draftFilters.status || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, status: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All statuses')}</SelectItem>
                    {(indexMeta?.statuses ?? []).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status
                          .split('-')
                          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                          .join(' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Operational status')}</Label>
                <Select
                  value={draftFilters.operational_status || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({
                      ...f,
                      operational_status: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by operational status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All operational statuses')}</SelectItem>
                    {TRUCK_OPERATIONAL_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {truckOperationalStatusLabel(status, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Truck Provider')}</Label>
                <Select
                  value={draftFilters.provider_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, provider_id: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by provider')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All providers')}</SelectItem>
                    {(indexMeta?.truck_providers ?? []).map((provider) => (
                      <SelectItem key={provider.id} value={String(provider.id)}>
                        {provider.name}
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
            createPermission="create-trucks"
            onCreateClick={openCreate}
          />
        ) : (
          <DataTable
            embedded
            columns={columns}
            data={rows}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={setSort}
          />
        )}
      </ModuleListCard>

      <TruckViewDialog
        truckId={viewingId}
        open={viewDialogOpen}
        onOpenChange={(open) => {
          setViewDialogOpen(open)
          if (!open) setViewingId(null)
        }}
        onEdit={(id) => {
          setEditingId(id)
          setDialogOpen(true)
        }}
        onDeleted={() => {
          void queryClient.invalidateQueries({ queryKey: ['fleet', 'trucks'] })
          void queryClient.invalidateQueries({ queryKey: ['fleet', 'create-meta'] })
        }}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingId(null)
            setForm(initialTruckFormState)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId != null ? t('Edit Truck') : t('Create Truck')}</DialogTitle>
          </DialogHeader>
          {editingId != null && editMetaLoading ? (
            <p className="text-sm text-muted-foreground">{t('Loading...')}</p>
          ) : (
            <form className="space-y-4" onSubmit={submitForm}>
              <TruckFormFields
                form={form}
                setField={setField}
                truckProviders={truckProviders}
                statuses={statuses}
              />
              <DialogFooter>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? editingId != null
                      ? t('Updating...')
                      : t('Creating...')
                    : editingId != null
                      ? t('Update')
                      : t('Create')}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete Truck')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
