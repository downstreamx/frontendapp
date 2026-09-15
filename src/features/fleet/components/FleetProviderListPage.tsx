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
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { FleetStatusBadge } from './FleetStatusBadge'
import { FleetProviderFormFields } from './FleetProviderFormFields'
import {
  createMaintenanceProvider,
  createTruckProvider,
  fetchMaintenanceProviderCreateMeta,
  fetchMaintenanceProviderEditMeta,
  fetchMaintenanceProvidersIndexMeta,
  fetchTruckProviderCreateMeta,
  fetchTruckProviderEditMeta,
  fetchTruckProvidersIndexMeta,
  listMaintenanceProvidersPaginated,
  listTruckProvidersPaginated,
  updateMaintenanceProvider,
  updateTruckProvider,
  type FleetProviderRow,
} from '../fleet-api'
import { ForbiddenPage } from '@/components/status-page'
import {
  formStateToProviderPayload,
  initialFleetProviderFormState,
  providerToFormState,
  type FleetProviderFormState,
} from '../fleet-provider-form-utils'

type ProviderKind = 'truck' | 'maintenance'

const permissionMap = {
  truck: {
    manage: 'manage-truck-providers',
    create: 'create-truck-providers',
    edit: 'edit-truck-providers',
    delete: 'delete-truck-providers',
    destroyRoute: 'fleet.truck-providers.destroy' as const,
  },
  maintenance: {
    manage: 'manage-maintenance-providers',
    create: 'create-maintenance-providers',
    edit: 'edit-maintenance-providers',
    delete: 'delete-maintenance-providers',
    destroyRoute: 'fleet.maintenance-providers.destroy' as const,
  },
}

type AppliedFilters = {
  status: string
  provider_type_id: string
}

const defaultFilters: AppliedFilters = {
  status: '',
  provider_type_id: '',
}

type Props = {
  kind: ProviderKind
  title: string
  breadcrumb: string
}

export function FleetProviderListPage({ kind, title, breadcrumb }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const perms = permissionMap[kind]
  const isTruck = kind === 'truck'
  const showPath = isTruck ? paths.fleet.truckProviderShow : paths.fleet.maintenanceProviderShow
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FleetProviderFormState>(initialFleetProviderFormState)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const canManage = hasPermission(auth.permissions, auth.roles, auth.user?.type, perms.manage)
  const canCreate = hasPermission(auth.permissions, auth.roles, auth.user?.type, perms.create)

  usePageChrome({
    pageTitle: title,
    breadcrumbs: [{ label: t('Fleet') }, { label: breadcrumb }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.status) params.status = appliedFilters.status
    if (kind === 'truck' && appliedFilters.provider_type_id) {
      params.provider_type_id = appliedFilters.provider_type_id
    }
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, kind, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const queryKey = ['fleet', kind === 'truck' ? 'truck-providers' : 'maintenance-providers']

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKey, listParams],
    queryFn: () =>
      kind === 'truck'
        ? listTruckProvidersPaginated(listParams)
        : listMaintenanceProvidersPaginated(listParams),
    enabled: canManage,
  })

  const { data: indexMeta } = useQuery({
    queryKey: [...queryKey, 'index-meta'],
    queryFn: () =>
      kind === 'truck' ? fetchTruckProvidersIndexMeta() : fetchMaintenanceProvidersIndexMeta(),
    enabled: canManage,
  })

  const { data: createMeta } = useQuery({
    queryKey: ['fleet', kind, 'providers', 'create-meta'],
    queryFn: isTruck ? fetchTruckProviderCreateMeta : fetchMaintenanceProviderCreateMeta,
    enabled: canManage && dialogOpen && editingId == null,
  })

  const { data: editMeta, isLoading: editMetaLoading } = useQuery({
    queryKey: ['fleet', kind, 'providers', editingId, 'edit-meta'],
    queryFn: () =>
      isTruck
        ? fetchTruckProviderEditMeta(editingId!)
        : fetchMaintenanceProviderEditMeta(editingId!),
    enabled: canManage && dialogOpen && editingId != null,
  })

  const formMeta = editingId != null ? editMeta : createMeta
  const statuses = formMeta?.statuses ?? indexMeta?.statuses ?? ['active']
  const formProviderTypes =
    isTruck && formMeta && 'truck_provider_types' in formMeta
      ? formMeta.truck_provider_types
      : []

  useEffect(() => {
    const shouldCreate = searchParams.get('create')
    const editParam = searchParams.get('edit')
    if (!shouldCreate && !editParam) return

    if (shouldCreate) {
      setEditingId(null)
      setForm(initialFleetProviderFormState)
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
      setForm(initialFleetProviderFormState)
      return
    }
    if (editMeta?.provider) {
      setForm(providerToFormState(editMeta.provider))
    }
  }, [dialogOpen, editingId, editMeta])

  const setField = <K extends keyof FleetProviderFormState>(
    key: K,
    value: FleetProviderFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = formStateToProviderPayload(form, isTruck)
      if (editingId != null) {
        return isTruck
          ? updateTruckProvider(editingId, payload)
          : updateMaintenanceProvider(editingId, payload)
      }
      return isTruck ? createTruckProvider(payload) : createMaintenanceProvider(payload)
    },
    onSuccess: () => {
      toast.success(editingId != null ? t('Provider updated') : t('Provider created'))
      void queryClient.invalidateQueries({ queryKey })
      setDialogOpen(false)
      setEditingId(null)
      setForm(initialFleetProviderFormState)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save provider'))),
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(initialFleetProviderFormState)
    setDialogOpen(true)
  }

  const openEdit = (row: FleetProviderRow) => {
    setEditingId(row.id)
    setDialogOpen(true)
  }

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: perms.destroyRoute,
      defaultMessage: t('Are you sure you want to delete this provider?'),
      onSuccess: () => {
        toast.success(t('Provider deleted'))
        void queryClient.invalidateQueries({ queryKey })
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete provider'))),
    })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = [
    appliedFilters.status,
    kind === 'truck' ? appliedFilters.provider_type_id : '',
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

  const columns: Column<FleetProviderRow>[] = [
    {
      key: 'name',
      header: t('Name'),
      sortable: true,
      render: (_, row) => (
        <Link to={showPath(row.id)} className="text-primary hover:underline">
          {row.name}
        </Link>
      ),
    },
    ...(kind === 'truck'
      ? [
          {
            key: 'provider_type',
            header: t('Type'),
            render: (_: unknown, row: FleetProviderRow) =>
              row.truck_provider_type?.name ?? '—',
          } as Column<FleetProviderRow>,
        ]
      : []),
    {
      key: 'contact_email',
      header: t('Email'),
      sortable: true,
      render: (_, row) => row.contact_email ?? '—',
    },
    {
      key: 'contact_phone',
      header: t('Phone'),
      render: (_, row) => row.contact_phone ?? '—',
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
          viewPermission={perms.edit}
          editPermission={perms.edit}
          deletePermission={perms.delete}
          onView={() => navigate(showPath(row.id))}
          onEdit={() => openEdit(row)}
          onDelete={() =>
            openDeleteDialog(row.id, t('Delete provider "{{name}}"?', { name: row.name }))
          }
        />
      ),
    },
  ]

  if (!canManage) {
    return <ForbiddenPage />
  }

  const providerTypes =
    kind === 'truck' && 'truck_provider_types' in (indexMeta ?? {})
      ? (indexMeta as { truck_provider_types?: Array<{ id: number; name: string }> })
          .truck_provider_types ?? []
      : []

  return (
    <>
      <ModuleListCard
        title={title}
        description={t('Manage provider contacts, contracts, and status.')}
        canCreate={canCreate}
        onCreateClick={openCreate}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search providers...'),
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
              {kind === 'truck' ? (
                <div className="space-y-1">
                  <Label>{t('Provider type')}</Label>
                  <Select
                    value={draftFilters.provider_type_id || 'all'}
                    onValueChange={(value) =>
                      setDraftFilters((f) => ({
                        ...f,
                        provider_type_id: value === 'all' ? '' : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('All types')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('All types')}</SelectItem>
                      {providerTypes.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
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
            createPermission={perms.create}
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
            setForm(initialFleetProviderFormState)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId != null
                ? isTruck
                  ? t('Edit Truck Provider')
                  : t('Edit Maintenance Provider')
                : isTruck
                  ? t('Create Truck Provider')
                  : t('Create Maintenance Provider')}
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
              <FleetProviderFormFields
                kind={kind}
                form={form}
                setField={setField}
                statuses={statuses}
                providerTypes={formProviderTypes}
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
        title={t('Delete provider')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
