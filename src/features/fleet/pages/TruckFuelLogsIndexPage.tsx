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
import { formatCurrency } from '@/utils/helpers'
import { personName, truckLabel } from '@/features/shared/lib/entity-labels'
import {
  createTruckFuelLog,
  fetchTruckFuelLogsIndexMeta,
  listTruckFuelLogsPaginated,
  type TruckFuelLogRow,
} from '../fleet-api'

type AppliedFilters = {
  truck_id: string
  driver_id: string
}

const defaultFilters: AppliedFilters = {
  truck_id: '',
  driver_id: '',
}

export function TruckFuelLogsIndexPage() {
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
  const [liters, setLiters] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [odometer, setOdometer] = useState('')

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const canManage = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-truck-fuel-logs')
  const canCreate = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-truck-fuel-logs')

  usePageChrome({
    pageTitle: t('Fuel Logs'),
    breadcrumbs: [{ label: t('Fleet') }, { label: t('Fuel Logs') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.truck_id) params.truck_id = appliedFilters.truck_id
    if (appliedFilters.driver_id) params.driver_id = appliedFilters.driver_id
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['fleet', 'truck-fuel-logs', listParams],
    queryFn: () => listTruckFuelLogsPaginated(listParams),
    enabled: canManage,
  })

  const { data: indexMeta } = useQuery({
    queryKey: ['fleet', 'truck-fuel-logs', 'index-meta'],
    queryFn: fetchTruckFuelLogsIndexMeta,
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
      routeName: 'fleet.truck-fuel-logs.destroy',
      defaultMessage: t('Are you sure you want to delete this fuel log?'),
      onSuccess: () => {
        toast.success(t('Fuel log deleted'))
        void queryClient.invalidateQueries({ queryKey: ['fleet', 'truck-fuel-logs'] })
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete fuel log'))),
    })

  const createMutation = useMutation({
    mutationFn: createTruckFuelLog,
    onSuccess: () => {
      toast.success(t('Fuel log recorded'))
      void queryClient.invalidateQueries({ queryKey: ['fleet', 'truck-fuel-logs'] })
      setCreateOpen(false)
      setTruckId('')
      setDriverId('')
      setLiters('')
      setUnitPrice('')
      setOdometer('')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to record fuel log'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = [appliedFilters.truck_id, appliedFilters.driver_id].filter(Boolean).length
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

  const columns: Column<TruckFuelLogRow>[] = [
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
      key: 'liters',
      header: t('Liters'),
      sortable: true,
      render: (value) => (value != null ? `${Number(value).toFixed(1)} L` : '—'),
    },
    {
      key: 'total_cost',
      header: t('Total Cost'),
      sortable: true,
      render: (value) => (value != null ? formatCurrency(Number(value)) : '—'),
    },
    {
      key: 'odometer',
      header: t('Odometer'),
      sortable: true,
      render: (value) => (value != null ? String(value) : '—'),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <TableRowActions
          deletePermission="delete-truck-fuel-logs"
          onDelete={() =>
            openDeleteDialog(
              row.id,
              t('Delete fuel log for {{truck}}?', {
                truck: truckLabel(row.truck, row.truck_id),
              }),
            )
          }
        />
      ),
    },
  ]

  if (!canManage) {
    return <p className="text-sm text-muted-foreground">{t('Permission denied')}</p>
  }

  return (
    <>
      <ModuleListCard
        title={t('Fuel Logs')}
        description={t('Record fuel purchases and odometer readings per truck.')}
        canCreate={canCreate}
        onCreateClick={() => setCreateOpen(true)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search fuel logs...'),
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
            createPermission="create-truck-fuel-logs"
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
            <DialogTitle>{t('Record fuel')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate({
                truck_id: Number(truckId),
                driver_id: driverId ? Number(driverId) : undefined,
                liters: Number(liters),
                unit_price: unitPrice ? Number(unitPrice) : undefined,
                odometer: odometer ? Number(odometer) : undefined,
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
              <EntitySelect value={driverId} onValueChange={setDriverId} options={driverOptions} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>{t('Liters')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Unit price')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Odometer')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                />
              </div>
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
        title={t('Delete Fuel Log')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
