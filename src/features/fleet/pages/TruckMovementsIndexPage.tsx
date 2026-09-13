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
import { formatCurrency, formatDate } from '@/utils/helpers'
import { truckLabel } from '@/features/shared/lib/entity-labels'
import { FleetStatusBadge } from '../components/FleetStatusBadge'
import {
  createTruckMovement,
  fetchTruckMovementsIndexMeta,
  listTruckMovementsPaginated,
  postTruckMovement,
  updateTruckMovement,
  type TruckMovementRow,
} from '../fleet-api'

type AppliedFilters = {
  truck_id: string
  status: string
}

const defaultFilters: AppliedFilters = {
  truck_id: '',
  status: '',
}

type MovementFormState = {
  movement_date: string
  truck_id: string
  truck_provider_id: string
  haulage_claim_number: string
  source: string
  destination: string
  quantity_lifted: string
  haulage_rate: string
  amount: string
  wht_percent: string
  wht_amount: string
  shortage_qty: string
  shortage_amount: string
  overage_qty: string
  overage_amount: string
  fuel_qty: string
  fuel_rate: string
  fuel_consumption: string
  repairs: string
  transport_allowance: string
  margin: string
  debit_account_id: string
  credit_account_id: string
  narration: string
}

const emptyForm = (): MovementFormState => ({
  movement_date: new Date().toISOString().slice(0, 10),
  truck_id: '',
  truck_provider_id: '',
  haulage_claim_number: '',
  source: '',
  destination: '',
  quantity_lifted: '',
  haulage_rate: '',
  amount: '',
  wht_percent: '',
  wht_amount: '',
  shortage_qty: '',
  shortage_amount: '',
  overage_qty: '',
  overage_amount: '',
  fuel_qty: '',
  fuel_rate: '',
  fuel_consumption: '',
  repairs: '',
  transport_allowance: '',
  margin: '',
  debit_account_id: '',
  credit_account_id: '',
  narration: '',
})

function canAccessFleet(auth: ReturnType<typeof useAppContext>['auth']) {
  return (
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-fleet') ||
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-trucks')
  )
}

function rowToForm(row: TruckMovementRow): MovementFormState {
  const str = (v: unknown) => (v != null && v !== '' ? String(v) : '')
  return {
    movement_date: row.movement_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    truck_id: row.truck_id ? String(row.truck_id) : '',
    truck_provider_id: row.truck_provider_id ? String(row.truck_provider_id) : '',
    haulage_claim_number: row.haulage_claim_number ?? '',
    source: row.source ?? '',
    destination: row.destination ?? '',
    quantity_lifted: str(row.quantity_lifted),
    haulage_rate: str(row.haulage_rate),
    amount: str(row.amount),
    wht_percent: str(row.wht_percent),
    wht_amount: str(row.wht_amount),
    shortage_qty: str(row.shortage_qty),
    shortage_amount: str(row.shortage_amount),
    overage_qty: str(row.overage_qty),
    overage_amount: str(row.overage_amount),
    fuel_qty: str(row.fuel_qty),
    fuel_rate: str(row.fuel_rate),
    fuel_consumption: str(row.fuel_consumption),
    repairs: str(row.repairs),
    transport_allowance: str(row.transport_allowance),
    margin: str(row.margin),
    debit_account_id: row.debit_account_id ? String(row.debit_account_id) : '',
    credit_account_id: row.credit_account_id ? String(row.credit_account_id) : '',
    narration: row.narration ?? '',
  }
}

function formToPayload(form: MovementFormState): Record<string, unknown> {
  const num = (v: string) => (v ? Number(v) : undefined)
  return {
    movement_date: form.movement_date,
    truck_id: Number(form.truck_id),
    truck_provider_id: form.truck_provider_id ? Number(form.truck_provider_id) : undefined,
    haulage_claim_number: form.haulage_claim_number || undefined,
    source: form.source || undefined,
    destination: form.destination || undefined,
    quantity_lifted: num(form.quantity_lifted),
    haulage_rate: num(form.haulage_rate),
    amount: num(form.amount),
    wht_percent: num(form.wht_percent),
    wht_amount: num(form.wht_amount),
    shortage_qty: num(form.shortage_qty),
    shortage_amount: num(form.shortage_amount),
    overage_qty: num(form.overage_qty),
    overage_amount: num(form.overage_amount),
    fuel_qty: num(form.fuel_qty),
    fuel_rate: num(form.fuel_rate),
    fuel_consumption: num(form.fuel_consumption),
    repairs: num(form.repairs),
    transport_allowance: num(form.transport_allowance),
    margin: num(form.margin),
    debit_account_id: form.debit_account_id ? Number(form.debit_account_id) : undefined,
    credit_account_id: form.credit_account_id ? Number(form.credit_account_id) : undefined,
    narration: form.narration || undefined,
  }
}

export function TruckMovementsIndexPage() {
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
  const [editingStatus, setEditingStatus] = useState<string | undefined>()
  const [form, setForm] = useState<MovementFormState>(emptyForm)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const canManage = canAccessFleet(auth)

  usePageChrome({
    pageTitle: t('Truck Movements'),
    breadcrumbs: [{ label: t('Fleet') }, { label: t('Truck Movements') }],
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
    queryKey: ['fleet', 'truck-movements', listParams],
    queryFn: () => listTruckMovementsPaginated(listParams),
    enabled: canManage,
  })

  const { data: indexMeta } = useQuery({
    queryKey: ['fleet', 'truck-movements', 'index-meta'],
    queryFn: fetchTruckMovementsIndexMeta,
    enabled: canManage,
  })

  const truckOptions = useMemo(
    () => toTruckLookupOptions(indexMeta?.trucks ?? []),
    [indexMeta?.trucks],
  )

  const providerOptions = useMemo(
    () =>
      (indexMeta?.truck_providers ?? []).map((p) => ({
        id: p.id,
        label: p.name,
      })),
    [indexMeta?.truck_providers],
  )

  const accountOptions = useMemo(
    () =>
      (indexMeta?.chart_accounts ?? []).map((a) => ({
        id: a.id,
        label: [a.account_code, a.account_name ?? a.name].filter(Boolean).join(' · '),
      })),
    [indexMeta?.chart_accounts],
  )

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'fleet.truck-movements.destroy',
      defaultMessage: t('Are you sure you want to delete this movement?'),
      onSuccess: () => {
        toast.success(t('Movement deleted'))
        void queryClient.invalidateQueries({ queryKey: ['fleet', 'truck-movements'] })
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete movement'))),
    })

  const saveMutation = useMutation({
    mutationFn: (payload: { id: number | null; body: Record<string, unknown> }) =>
      payload.id ? updateTruckMovement(payload.id, payload.body) : createTruckMovement(payload.body),
    onSuccess: () => {
      toast.success(editingId ? t('Movement updated') : t('Movement created'))
      void queryClient.invalidateQueries({ queryKey: ['fleet', 'truck-movements'] })
      setDialogOpen(false)
      setEditingId(null)
      setEditingStatus(undefined)
      setForm(emptyForm())
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save movement'))),
  })

  const postMutation = useMutation({
    mutationFn: postTruckMovement,
    onSuccess: () => {
      toast.success(t('Movement posted'))
      void queryClient.invalidateQueries({ queryKey: ['fleet', 'truck-movements'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to post movement'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = [appliedFilters.truck_id, appliedFilters.status].filter(Boolean).length
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0
  const formReadOnly = editingStatus === 'posted'

  const openCreate = () => {
    setEditingId(null)
    setEditingStatus(undefined)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEdit = (row: TruckMovementRow) => {
    setEditingId(row.id)
    setEditingStatus(row.status)
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

  const setField = <K extends keyof MovementFormState>(key: K, value: MovementFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const columns: Column<TruckMovementRow>[] = [
    {
      key: 'movement_date',
      header: t('Date'),
      sortable: true,
      render: (_, row) => (row.movement_date ? formatDate(row.movement_date) : '—'),
    },
    {
      key: 'haulage_claim_number',
      header: t('Claim #'),
      sortable: true,
      render: (value) => (value ? String(value) : '—'),
    },
    {
      key: 'truck_id',
      header: t('Truck'),
      render: (_, row) => truckLabel(row.truck, row.truck_id),
    },
    {
      key: 'source',
      header: t('Route'),
      render: (_, row) => {
        const route = [row.source, row.destination].filter(Boolean).join(' → ')
        return route || '—'
      },
    },
    {
      key: 'quantity_lifted',
      header: t('Qty'),
      render: (value) => (value != null ? String(value) : '—'),
    },
    {
      key: 'amount',
      header: t('Amount'),
      sortable: true,
      render: (value) => (value != null ? formatCurrency(Number(value)) : '—'),
    },
    {
      key: 'wht_amount',
      header: t('WHT'),
      render: (_, row) => {
        if (row.wht_amount != null) return formatCurrency(Number(row.wht_amount))
        if (row.wht_percent != null) return `${row.wht_percent}%`
        return '—'
      },
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
          {row.status === 'draft' ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={postMutation.isPending}
              onClick={() => postMutation.mutate(row.id)}
            >
              {t('Post')}
            </Button>
          ) : null}
          {row.status !== 'posted' ? (
            <TableRowActions
              onEdit={() => openEdit(row)}
              onDelete={() => openDeleteDialog(row.id)}
            />
          ) : null}
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
        title={t('Truck Movements')}
        description={t('Record haulage movements and post them to the general ledger.')}
        canCreate={canManage}
        onCreateClick={openCreate}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search movements...'),
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
            setEditingStatus(undefined)
            setForm(emptyForm())
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? t('Edit movement') : t('New movement')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (formReadOnly) return
              saveMutation.mutate({ id: editingId, body: formToPayload(form) })
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Movement date')}</Label>
                <Input
                  type="date"
                  value={form.movement_date}
                  onChange={(e) => setField('movement_date', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Claim number')}</Label>
                <Input
                  value={form.haulage_claim_number}
                  onChange={(e) => setField('haulage_claim_number', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Truck')}</Label>
                <EntitySelect
                  value={form.truck_id}
                  onValueChange={(v) => setField('truck_id', v)}
                  options={truckOptions}
                  required
                  disabled={formReadOnly}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Truck provider')}</Label>
                <EntitySelect
                  value={form.truck_provider_id}
                  onValueChange={(v) => setField('truck_provider_id', v)}
                  options={providerOptions}
                  disabled={formReadOnly}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Source')}</Label>
                <Input
                  value={form.source}
                  onChange={(e) => setField('source', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Destination')}</Label>
                <Input
                  value={form.destination}
                  onChange={(e) => setField('destination', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>{t('Quantity lifted')}</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={form.quantity_lifted}
                  onChange={(e) => setField('quantity_lifted', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Haulage rate')}</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={form.haulage_rate}
                  onChange={(e) => setField('haulage_rate', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Amount')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setField('amount', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('WHT %')}</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={form.wht_percent}
                  onChange={(e) => setField('wht_percent', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('WHT amount')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.wht_amount}
                  onChange={(e) => setField('wht_amount', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Debit account')}</Label>
                <EntitySelect
                  value={form.debit_account_id}
                  onValueChange={(v) => setField('debit_account_id', v)}
                  options={accountOptions}
                  disabled={formReadOnly}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Credit account')}</Label>
                <EntitySelect
                  value={form.credit_account_id}
                  onValueChange={(v) => setField('credit_account_id', v)}
                  options={accountOptions}
                  disabled={formReadOnly}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Shortage qty')}</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={form.shortage_qty}
                  onChange={(e) => setField('shortage_qty', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Shortage amount')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.shortage_amount}
                  onChange={(e) => setField('shortage_amount', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Overage qty')}</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={form.overage_qty}
                  onChange={(e) => setField('overage_qty', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Overage amount')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.overage_amount}
                  onChange={(e) => setField('overage_amount', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>{t('Fuel qty')}</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={form.fuel_qty}
                  onChange={(e) => setField('fuel_qty', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Fuel rate')}</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={form.fuel_rate}
                  onChange={(e) => setField('fuel_rate', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Fuel consumption')}</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={form.fuel_consumption}
                  onChange={(e) => setField('fuel_consumption', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>{t('Repairs')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.repairs}
                  onChange={(e) => setField('repairs', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Transport allowance')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.transport_allowance}
                  onChange={(e) => setField('transport_allowance', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Margin')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.margin}
                  onChange={(e) => setField('margin', e.target.value)}
                  disabled={formReadOnly}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('Narration')}</Label>
              <Textarea
                value={form.narration}
                onChange={(e) => setField('narration', e.target.value)}
                rows={2}
                disabled={formReadOnly}
              />
            </div>
            {!formReadOnly ? (
              <DialogFooter>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {t('Save')}
                </Button>
              </DialogFooter>
            ) : null}
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete Movement')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
