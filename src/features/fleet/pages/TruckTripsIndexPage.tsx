import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { EntitySelect, LookupSelectContent } from '@/components/forms/entity-select'
import { toDriverLookupOptions, toTruckLookupOptions } from '@/features/_shared/operations-lookups'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatDate } from '@/utils/helpers'
import { personName, truckLabel } from '@/features/shared/lib/entity-labels'
import { FleetStatusBadge } from '../components/FleetStatusBadge'
import {
  advanceTruckTrip,
  createTruckTrip,
  fetchTruckTripsIndexMeta,
  listTruckTripsPaginated,
  type TruckTripRow,
} from '../fleet-api'

type AppliedFilters = {
  truck_id: string
  driver_id: string
  status: string
}

const defaultFilters: AppliedFilters = {
  truck_id: '',
  driver_id: '',
  status: '',
}

const nextStatusLabel: Record<string, string> = {
  planned: 'Start trip',
  in_progress: 'Complete trip',
}

export function TruckTripsIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [createOpen, setCreateOpen] = useState(false)
  const [truckId, setTruckId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16))

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const canManage = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-truck-trips')
  const canCreate = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-truck-trips')

  usePageChrome({
    pageTitle: t('Truck Trips'),
    breadcrumbs: [{ label: t('Fleet') }, { label: t('Truck Trips') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.truck_id) params.truck_id = appliedFilters.truck_id
    if (appliedFilters.driver_id) params.driver_id = appliedFilters.driver_id
    if (appliedFilters.status) params.status = appliedFilters.status
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['fleet', 'truck-trips', listParams],
    queryFn: () => listTruckTripsPaginated(listParams),
    enabled: canManage,
  })

  const { data: indexMeta } = useQuery({
    queryKey: ['fleet', 'truck-trips', 'index-meta'],
    queryFn: fetchTruckTripsIndexMeta,
    enabled: canManage,
  })

  const truckOptions = useMemo(
    () => toTruckLookupOptions(indexMeta?.trucks ?? []),
    [indexMeta?.trucks],
  )

  const driverOptions = useMemo(
    () =>
      toDriverLookupOptions(
        (indexMeta?.drivers ?? []).map((d) => ({
          id: d.id,
          name: d.display_name,
          first_name: d.first_name,
          last_name: d.last_name,
          email: d.email,
          avatar: d.avatar,
        })),
      ),
    [indexMeta?.drivers],
  )

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'fleet.truck-trips.destroy',
      defaultMessage: t('Are you sure you want to delete this trip?'),
      onSuccess: () => {
        toast.success(t('Trip deleted'))
        void queryClient.invalidateQueries({ queryKey: ['fleet', 'truck-trips'] })
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete trip'))),
    })

  const createMutation = useMutation({
    mutationFn: createTruckTrip,
    onSuccess: () => {
      toast.success(t('Trip created'))
      void queryClient.invalidateQueries({ queryKey: ['fleet', 'truck-trips'] })
      setCreateOpen(false)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to create trip'))),
  })

  const advanceMutation = useMutation({
    mutationFn: advanceTruckTrip,
    onSuccess: () => {
      toast.success(t('Trip updated'))
      void queryClient.invalidateQueries({ queryKey: ['fleet', 'truck-trips'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Could not advance trip status'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = [
    appliedFilters.truck_id,
    appliedFilters.driver_id,
    appliedFilters.status,
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

  const columns: Column<TruckTripRow>[] = [
    {
      key: 'origin',
      header: t('Route'),
      sortable: true,
      render: (_, row) => {
        const route = [row.origin, row.destination].filter(Boolean).join(' → ')
        return route || '—'
      },
    },
    {
      key: 'truck_id',
      header: t('Truck'),
      render: (_, row) => truckLabel(row.truck, row.truck_id),
    },
    {
      key: 'driver_id',
      header: t('Driver'),
      render: (_, row) => personName(row.driver, row.driver_id),
    },
    {
      key: 'start_time',
      header: t('Start'),
      sortable: true,
      render: (_, row) => (row.start_time ? formatDate(row.start_time) : '—'),
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
        <div className="flex items-center gap-1">
          {row.status && nextStatusLabel[row.status] ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={advanceMutation.isPending}
              onClick={() => advanceMutation.mutate(row.id)}
            >
              {t(nextStatusLabel[row.status])}
            </Button>
          ) : null}
          <TableRowActions
            deletePermission="delete-truck-trips"
            onDelete={() => openDeleteDialog(row.id)}
          />
        </div>
      ),
    },
  ]

  if (!canManage) {
    return <p className="text-sm text-muted-foreground">{t('Permission denied')}</p>
  }

  return (
    <>
      <ModuleListCard
        title={t('Truck Trips')}
        description={t('Plan and track truck trips from origin to destination.')}
        canCreate={canCreate}
        onCreateClick={() => setCreateOpen(true)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search trips...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                <Label>{t('Driver')}</Label>
                <Select
                  value={draftFilters.driver_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, driver_id: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All drivers')} />
                  </SelectTrigger>
                  <LookupSelectContent
                      leadingItem={<SelectItem value="all">{t('All drivers')}</SelectItem>}
                      options={driverOptions}
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
            createPermission="create-truck-trips"
            onCreateClick={() => setCreateOpen(true)}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Log trip')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate({
                truck_id: Number(truckId),
                driver_id: Number(driverId),
                origin,
                destination,
                start_time: startTime,
              })
            }}
          >
            <div className="space-y-1">
              <Label>{t('Truck')}</Label>
              <EntitySelect
                value={truckId}
                onValueChange={setTruckId}
                options={truckOptions}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>{t('Driver')}</Label>
              <EntitySelect
                value={driverId}
                onValueChange={setDriverId}
                options={driverOptions}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Origin')}</Label>
                <Input value={origin} onChange={(e) => setOrigin(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('Destination')}</Label>
                <Input value={destination} onChange={(e) => setDestination(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('Start')}</Label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete Trip')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
