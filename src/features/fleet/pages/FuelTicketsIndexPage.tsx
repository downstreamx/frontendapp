import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  toDriverLookupOptions,
  toProductLookupOptions,
  toTruckLookupOptions,
} from '@/features/_shared/operations-lookups'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { truckLabel } from '@/features/shared/lib/entity-labels'
import { FleetStatusBadge } from '../components/FleetStatusBadge'
import { ForbiddenPage } from '@/components/status-page'
import {
  createFuelTicket,
  fetchFuelTicketsIndexMeta,
  listFuelTicketsPaginated,
  updateFuelTicket,
  type FuelTicketRow,
} from '../fleet-api'

type AppliedFilters = {
  truck_id: string
  status: string
}

const defaultFilters: AppliedFilters = {
  truck_id: '',
  status: '',
}

type TicketFormState = {
  ticket_number: string
  ticket_date: string
  service_station_name: string
  product_id: string
  rate: string
  quantity: string
  trip_allowance: string
  truck_capacity: string
  truck_id: string
  from_location: string
  destination: string
  driver_id: string
  driver_phone: string
  truck_provider_id: string
  notes: string
}

const emptyForm = (): TicketFormState => ({
  ticket_number: '',
  ticket_date: new Date().toISOString().slice(0, 10),
  service_station_name: '',
  product_id: '',
  rate: '',
  quantity: '',
  trip_allowance: '',
  truck_capacity: '',
  truck_id: '',
  from_location: '',
  destination: '',
  driver_id: '',
  driver_phone: '',
  truck_provider_id: '',
  notes: '',
})

function canAccessFleet(auth: ReturnType<typeof useAppContext>['auth']) {
  return (
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-fleet') ||
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-trucks')
  )
}

function rowToForm(row: FuelTicketRow): TicketFormState {
  return {
    ticket_number: row.ticket_number ?? '',
    ticket_date: row.ticket_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    service_station_name: row.service_station_name ?? '',
    product_id: row.product_id ? String(row.product_id) : '',
    rate: row.rate != null ? String(row.rate) : '',
    quantity: row.quantity != null ? String(row.quantity) : '',
    trip_allowance: row.trip_allowance != null ? String(row.trip_allowance) : '',
    truck_capacity: row.truck_capacity != null ? String(row.truck_capacity) : '',
    truck_id: row.truck_id ? String(row.truck_id) : '',
    from_location: row.from_location ?? '',
    destination: row.destination ?? '',
    driver_id: row.driver_id ? String(row.driver_id) : '',
    driver_phone: row.driver_phone ?? '',
    truck_provider_id: row.truck_provider_id ? String(row.truck_provider_id) : '',
    notes: row.notes ?? '',
  }
}

function formToPayload(form: TicketFormState): Record<string, unknown> {
  return {
    ticket_number: form.ticket_number,
    ticket_date: form.ticket_date,
    service_station_name: form.service_station_name || undefined,
    product_id: form.product_id ? Number(form.product_id) : undefined,
    rate: form.rate ? Number(form.rate) : undefined,
    quantity: form.quantity ? Number(form.quantity) : undefined,
    trip_allowance: form.trip_allowance ? Number(form.trip_allowance) : undefined,
    truck_capacity: form.truck_capacity ? Number(form.truck_capacity) : undefined,
    truck_id: form.truck_id ? Number(form.truck_id) : undefined,
    from_location: form.from_location || undefined,
    destination: form.destination || undefined,
    driver_id: form.driver_id ? Number(form.driver_id) : undefined,
    driver_phone: form.driver_phone || undefined,
    truck_provider_id: form.truck_provider_id ? Number(form.truck_provider_id) : undefined,
    notes: form.notes || undefined,
  }
}

export function FuelTicketsIndexPage() {
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
  const [form, setForm] = useState<TicketFormState>(emptyForm)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const canManage = canAccessFleet(auth)

  usePageChrome({
    pageTitle: t('Fuel Tickets'),
    breadcrumbs: [{ label: t('Fleet') }, { label: t('Fuel Tickets') }],
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
    queryKey: ['fleet', 'fuel-tickets', listParams],
    queryFn: () => listFuelTicketsPaginated(listParams),
    enabled: canManage,
  })

  const { data: indexMeta } = useQuery({
    queryKey: ['fleet', 'fuel-tickets', 'index-meta'],
    queryFn: fetchFuelTicketsIndexMeta,
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
          display_name: d.display_name,
          first_name: d.first_name,
          last_name: d.last_name,
          email: d.email,
          avatar: d.avatar,
        })),
      ),
    [indexMeta?.drivers],
  )

  const productOptions = useMemo(
    () => toProductLookupOptions(indexMeta?.products ?? []),
    [indexMeta?.products],
  )

  const providerOptions = useMemo(
    () =>
      (indexMeta?.truck_providers ?? []).map((p) => ({
        id: p.id,
        label: p.name,
      })),
    [indexMeta?.truck_providers],
  )

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'fleet.fuel-tickets.destroy',
      defaultMessage: t('Are you sure you want to delete this fuel ticket?'),
      onSuccess: () => {
        toast.success(t('Fuel ticket deleted'))
        void queryClient.invalidateQueries({ queryKey: ['fleet', 'fuel-tickets'] })
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete fuel ticket'))),
    })

  const saveMutation = useMutation({
    mutationFn: (payload: { id: number | null; body: Record<string, unknown> }) =>
      payload.id ? updateFuelTicket(payload.id, payload.body) : createFuelTicket(payload.body),
    onSuccess: () => {
      toast.success(editingId ? t('Fuel ticket updated') : t('Fuel ticket created'))
      void queryClient.invalidateQueries({ queryKey: ['fleet', 'fuel-tickets'] })
      setDialogOpen(false)
      setEditingId(null)
      setForm(emptyForm())
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, t('Failed to save fuel ticket'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = [appliedFilters.truck_id, appliedFilters.status].filter(Boolean).length
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEdit = (row: FuelTicketRow) => {
    setEditingId(row.id)
    setForm(rowToForm(row))
    setDialogOpen(true)
  }

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

  const setField = <K extends keyof TicketFormState>(key: K, value: TicketFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const columns: Column<FuelTicketRow>[] = [
    {
      key: 'ticket_date',
      header: t('Date'),
      sortable: true,
      render: (_, row) => (row.ticket_date ? formatDate(row.ticket_date) : '—'),
    },
    {
      key: 'ticket_number',
      header: t('Ticket #'),
      sortable: true,
      render: (value) => (value ? String(value) : '—'),
    },
    {
      key: 'truck_id',
      header: t('Truck'),
      render: (_, row) => truckLabel(row.truck, row.truck_id ?? undefined),
    },
    {
      key: 'service_station_name',
      header: t('Station'),
      render: (value) => (value ? String(value) : '—'),
    },
    {
      key: 'quantity',
      header: t('Qty'),
      sortable: true,
      render: (value) => (value != null ? String(value) : '—'),
    },
    {
      key: 'rate',
      header: t('Rate'),
      render: (value) => (value != null ? formatCurrency(Number(value)) : '—'),
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
          onEdit={() => openEdit(row)}
          onDelete={() => openDeleteDialog(row.id)}
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
        title={t('Fuel Tickets')}
        description={t('Manage fuel tickets issued at service stations.')}
        canCreate={canManage}
        onCreateClick={openCreate}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search fuel tickets...'),
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
            setForm(emptyForm())
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? t('Edit fuel ticket') : t('New fuel ticket')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              saveMutation.mutate({ id: editingId, body: formToPayload(form) })
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Ticket number')}</Label>
                <Input
                  value={form.ticket_number}
                  onChange={(e) => setField('ticket_number', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Ticket date')}</Label>
                <Input
                  type="date"
                  value={form.ticket_date}
                  onChange={(e) => setField('ticket_date', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('Service station')}</Label>
              <Input
                value={form.service_station_name}
                onChange={(e) => setField('service_station_name', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Truck')}</Label>
                <EntitySelect
                  value={form.truck_id}
                  onValueChange={(v) => setField('truck_id', v)}
                  options={truckOptions}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Product')}</Label>
                <EntitySelect
                  value={form.product_id}
                  onValueChange={(v) => setField('product_id', v)}
                  options={productOptions}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>{t('Quantity')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.quantity}
                  onChange={(e) => setField('quantity', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Rate')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.rate}
                  onChange={(e) => setField('rate', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Trip allowance')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.trip_allowance}
                  onChange={(e) => setField('trip_allowance', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('From')}</Label>
                <Input
                  value={form.from_location}
                  onChange={(e) => setField('from_location', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Destination')}</Label>
                <Input
                  value={form.destination}
                  onChange={(e) => setField('destination', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Driver')}</Label>
                <EntitySelect
                  value={form.driver_id}
                  onValueChange={(v) => setField('driver_id', v)}
                  options={driverOptions}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Driver phone')}</Label>
                <Input
                  value={form.driver_phone}
                  onChange={(e) => setField('driver_phone', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Truck provider')}</Label>
                <EntitySelect
                  value={form.truck_provider_id}
                  onValueChange={(v) => setField('truck_provider_id', v)}
                  options={providerOptions}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Truck capacity')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.truck_capacity}
                  onChange={(e) => setField('truck_capacity', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('Notes')}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saveMutation.isPending}>
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete Fuel Ticket')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
