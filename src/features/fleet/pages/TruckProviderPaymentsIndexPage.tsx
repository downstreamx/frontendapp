import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
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
import { EntitySelect } from '@/components/forms/entity-select'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { resolveMediaUrl } from '@/features/media/media-url'
import { hasPermission } from '@/lib/permissions'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { FleetStatusBadge } from '../components/FleetStatusBadge'
import { ForbiddenPage } from '@/components/status-page'
import {
  createTruckProviderPayment,
  fetchTruckProviderPaymentsIndexMeta,
  listTruckProviderPaymentsPaginated,
  type TruckProviderPaymentRow,
} from '../fleet-api'

type AppliedFilters = {
  truck_provider_id: string
  status: string
}

const defaultFilters: AppliedFilters = {
  truck_provider_id: '',
  status: '',
}

function canAccessFleet(auth: ReturnType<typeof useAppContext>['auth']) {
  return (
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-fleet') ||
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-trucks')
  )
}

export function TruckProviderPaymentsIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [createOpen, setCreateOpen] = useState(false)
  const [truckProviderId, setTruckProviderId] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [narration, setNarration] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  const page = Number(searchParams.get('page') ?? '1') || 1

  const canManage = canAccessFleet(auth)
  const { imageUrlPrefix } = useAppContext()

  usePageChrome({
    pageTitle: t('Truck Provider Payments'),
    breadcrumbs: [{ label: t('Fleet') }, { label: t('Truck Provider Payments') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.truck_provider_id) {
      params.truck_provider_id = appliedFilters.truck_provider_id
    }
    if (appliedFilters.status) params.status = appliedFilters.status
    return params
  }, [appliedFilters, page, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['fleet', 'truck-provider-payments', listParams],
    queryFn: () => listTruckProviderPaymentsPaginated(listParams),
    enabled: canManage,
  })

  const { data: indexMeta } = useQuery({
    queryKey: ['fleet', 'truck-provider-payments', 'index-meta'],
    queryFn: fetchTruckProviderPaymentsIndexMeta,
    enabled: canManage,
  })

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
      routeName: 'fleet.truck-provider-payments.destroy',
      defaultMessage: t('Are you sure you want to delete this payment?'),
      onSuccess: () => {
        toast.success(t('Payment deleted'))
        void queryClient.invalidateQueries({ queryKey: ['fleet', 'truck-provider-payments'] })
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete payment'))),
    })

  const createMutation = useMutation({
    mutationFn: createTruckProviderPayment,
    onSuccess: () => {
      toast.success(t('Payment recorded'))
      void queryClient.invalidateQueries({ queryKey: ['fleet', 'truck-provider-payments'] })
      setCreateOpen(false)
      setTruckProviderId('')
      setAmount('')
      setReferenceNumber('')
      setPaymentMethod('')
      setNarration('')
      setReceiptFile(null)
      setPaymentDate(new Date().toISOString().slice(0, 10))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to record payment'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = [appliedFilters.truck_provider_id, appliedFilters.status].filter(
    Boolean,
  ).length
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

  const columns: Column<TruckProviderPaymentRow>[] = [
    {
      key: 'payment_date',
      header: t('Date'),
      render: (_, row) => (row.payment_date ? formatDate(row.payment_date) : '—'),
    },
    {
      key: 'truck_provider_id',
      header: t('Provider'),
      render: (_, row) => row.truck_provider?.name ?? '—',
    },
    {
      key: 'reference_number',
      header: t('Reference'),
      render: (value) => (value ? String(value) : '—'),
    },
    {
      key: 'amount',
      header: t('Amount'),
      render: (value) => (value != null ? formatCurrency(Number(value)) : '—'),
    },
    {
      key: 'payment_method',
      header: t('Method'),
      render: (value) => (value ? String(value) : '—'),
    },
    {
      key: 'receipt_path',
      header: t('Receipt'),
      render: (_, row) =>
        row.receipt_path ? (
          <Button variant="link" size="sm" className="h-auto px-0" asChild>
            <a
              href={resolveMediaUrl(row.receipt_path, imageUrlPrefix)}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              <Download className="mr-1 h-3 w-3" />
              {t('Download')}
            </a>
          </Button>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (_, row) => <FleetStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <TableRowActions onDelete={() => openDeleteDialog(row.id)} />
      ),
    },
  ]

  if (!canManage) {
    return <ForbiddenPage />
  }

  return (
    <>
      <ModuleListCard
        title={t('Truck Provider Payments')}
        description={t('Record payments made to truck providers.')}
        canCreate={canManage}
        onCreateClick={() => setCreateOpen(true)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search payments...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>{t('Provider')}</Label>
                <Select
                  value={draftFilters.truck_provider_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({
                      ...f,
                      truck_provider_id: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All providers')} />
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
            onCreateClick={() => setCreateOpen(true)}
          />
        ) : (
          <DataTable columns={columns} data={rows} />
        )}
      </ModuleListCard>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Record provider payment')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate({
                truck_provider_id: Number(truckProviderId),
                payment_date: paymentDate,
                amount: Number(amount),
                reference_number: referenceNumber || undefined,
                payment_method: paymentMethod || undefined,
                narration: narration || undefined,
                receipt: receiptFile,
              })
            }}
          >
            <div className="space-y-1">
              <Label>{t('Provider')}</Label>
              <EntitySelect
                value={truckProviderId}
                onValueChange={setTruckProviderId}
                options={providerOptions}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Payment date')}</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Amount')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Reference')}</Label>
                <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('Payment method')}</Label>
                <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('Narration')}</Label>
              <Input value={narration} onChange={(e) => setNarration(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="provider-payment-receipt">{t('Receipt')}</Label>
              <Input
                id="provider-payment-receipt"
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)}
              />
              {receiptFile ? (
                <p className="text-xs text-muted-foreground">{receiptFile.name}</p>
              ) : null}
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
        title={t('Delete Payment')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
