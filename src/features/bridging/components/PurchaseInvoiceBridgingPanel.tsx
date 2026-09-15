import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Plus, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { paths } from '@/lib/paths'
import { queryKeys } from '@/lib/query-keys'
import { getApiErrorMessage } from '@/lib/errors'
import { formatQuantity } from '@/lib/format-quantity'
import { formatDate } from '@/utils/helpers'
import {
  bulkCreatePurchaseTruckLoads,
  fetchPurchaseBridgingProgress,
  provisionInvoiceLoading,
  type BulkStorePurchaseTruckLoadPayload,
  type TruckLoad,
} from '../bridging-api'
import {
  operationalInvoicePanelCardClass,
  operationalPanelActionButtonClass,
  operationalPanelPhaseChipClass,
  purchaseBridgingStatusBadgeClass,
  purchaseBridgingStatusLabel,
  truckLoadPhaseLabel,
} from '../bridging-status-ui'
import type { LoadsByPhase, PurchaseBridgingStatus } from '../types'
import { TruckLoadFormDialog } from './TruckLoadFormDialog'
import { PurchaseTruckLoadActions } from './PurchaseTruckLoadActions'

type Props = {
  invoiceId: string | number
  loadingDepotId?: number | null
  invoiceStatus?: string
  paidAmount?: number
}

function driverLabel(row: TruckLoad): string {
  if (!row.driver) return '—'
  return [row.driver.first_name, row.driver.last_name].filter(Boolean).join(' ') || '—'
}

function salesAllocationLabels(row: TruckLoad): { id: number; label: string }[] {
  const fromAllocations = (row.sales_allocations ?? [])
    .filter((a) => a.sales_invoice?.id)
    .map((a) => ({
      id: a.sales_invoice!.id,
      label: a.sales_invoice!.invoice_number ?? `#${a.sales_invoice!.id}`,
    }))
  if (fromAllocations.length > 0) {
    return fromAllocations
  }
  if (row.sales_invoice?.id) {
    return [
      {
        id: row.sales_invoice.id,
        label: row.sales_invoice.invoice_number ?? `#${row.sales_invoice.id}`,
      },
    ]
  }
  return []
}

function PhaseSummary({ loadsByPhase, t }: { loadsByPhase: LoadsByPhase; t: (key: string) => string }) {
  const entries = Object.entries(loadsByPhase).filter(([, count]) => count > 0)
  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([phase, count]) => (
        <span
          key={phase}
          className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${operationalPanelPhaseChipClass(phase)}`}
        >
          {truckLoadPhaseLabel(phase, t)}: {count}
        </span>
      ))}
    </div>
  )
}

export function PurchaseInvoiceBridgingPanel({
  invoiceId,
  loadingDepotId,
  invoiceStatus,
  paidAmount = 0,
}: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const progressQuery = useQuery({
    queryKey: queryKeys.bridging.purchaseProgress(invoiceId),
    queryFn: () => fetchPurchaseBridgingProgress(invoiceId),
  })

  const provisionMutation = useMutation({
    mutationFn: () => provisionInvoiceLoading('purchase', invoiceId),
    onSuccess: () => {
      toast.success(t('Loading provisioned successfully.'))
      void progressQuery.refetch()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to provision loading'))),
  })

  const createMutation = useMutation({
    mutationFn: (payload: BulkStorePurchaseTruckLoadPayload) =>
      bulkCreatePurchaseTruckLoads(invoiceId, payload),
    onSuccess: (rows) => {
      const count = rows.length
      toast.success(
        count === 1 ? t('Truck load created.') : t('{{count}} truck loads created.', { count }),
      )
      setDialogOpen(false)
      void queryClient.invalidateQueries({ queryKey: queryKeys.bridging.purchaseProgress(invoiceId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchase.invoices.detail(invoiceId) })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to create truck loads'))),
  })

  if (progressQuery.isLoading) {
    return <Skeleton className="h-40 w-full" />
  }

  if (progressQuery.isError) {
    return (
      <Card className={operationalInvoicePanelCardClass}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="h-5 w-5" />
            {t('Bridging & truck loads')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">{t('Could not load truck loads')}</p>
              <p className="text-muted-foreground">
                {getApiErrorMessage(progressQuery.error, t('Check your connection and try again.'))}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={`mt-3 ${operationalPanelActionButtonClass('retry')}`}
                onClick={() => void progressQuery.refetch()}
              >
                {t('Retry')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const progress = progressQuery.data
  const bridgingStatus = (progress?.bridging_status ?? 'not_eligible') as PurchaseBridgingStatus
  const entitlements = progress?.entitlements ?? []
  const truckLoads = progress?.truck_loads ?? []
  const notEligible = bridgingStatus === 'not_eligible'
  const canCreateLoad =
    !notEligible && entitlements.some((e) => e.balance_qty > 0) && bridgingStatus !== 'fully_bridged'
  const canProvision = (progress?.total_balance_qty ?? 0) > 0 && notEligible && paidAmount > 0
  const isDraft = invoiceStatus === 'draft'

  const onFormSubmit = (payload: BulkStorePurchaseTruckLoadPayload) => {
    createMutation.mutate(payload)
  }

  return (
    <>
      <Card className={operationalInvoicePanelCardClass}>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5" />
              {t('Bridging & truck loads')}
            </CardTitle>
            <span className={purchaseBridgingStatusBadgeClass(bridgingStatus)}>
              {purchaseBridgingStatusLabel(bridgingStatus, t)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {canProvision ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={operationalPanelActionButtonClass('provision')}
                disabled={provisionMutation.isPending}
                onClick={() => provisionMutation.mutate()}
              >
                {provisionMutation.isPending ? t('Provisioning...') : t('Provision loading')}
              </Button>
            ) : null}
            {canCreateLoad ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={operationalPanelActionButtonClass('add_bridging')}
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                {t('Add Bridging')}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDraft ? (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-900/20">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
              <div>
                <p className="font-medium">{t('Invoice not posted')}</p>
                <p className="text-muted-foreground">
                  {t('Post this purchase invoice before bridging stock from the supplier.')}
                </p>
              </div>
            </div>
          ) : null}

          {notEligible && !isDraft ? (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-900/20">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
              <div>
                <p className="font-medium">{t('Payment required')}</p>
                <p className="text-muted-foreground">
                  {paidAmount <= 0
                    ? t(
                        'Record a payment or apply supplier credit on this invoice to unlock bridging entitlements.',
                      )
                    : t(
                        'Provision loading or wait for entitlements after payment is allocated to product lines.',
                      )}
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border/40 bg-[hsl(var(--section-deep))]/70 p-3">
              <p className="text-xs text-muted-foreground">{t('Invoiced qty')}</p>
              <p className="text-lg font-semibold">
                {formatQuantity(progress?.total_invoiced_qty ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-[hsl(var(--section-deep))]/70 p-3">
              <p className="text-xs text-muted-foreground">{t('Paid qty')}</p>
              <p className="text-lg font-semibold">
                {formatQuantity(progress?.total_paid_qty ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-[hsl(var(--section-deep))]/70 p-3">
              <p className="text-xs text-muted-foreground">{t('Bridged qty')}</p>
              <p className="text-lg font-semibold">
                {formatQuantity(progress?.total_bridged_qty ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-[hsl(var(--section-deep))]/70 p-3">
              <p className="text-xs text-muted-foreground">{t('Unbridged qty')}</p>
              <p className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                {formatQuantity(progress?.total_balance_qty ?? 0)}
              </p>
            </div>
          </div>

          {progress?.loads_by_phase ? (
            <PhaseSummary loadsByPhase={progress.loads_by_phase} t={t} />
          ) : null}

          {entitlements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-semibold">{t('Product')}</th>
                    <th className="px-3 py-2 text-left font-semibold">{t('Depot')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('Paid')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('Bridged')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('Balance')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entitlements.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2">{row.product?.name ?? '—'}</td>
                      <td className="px-3 py-2">{row.depot?.name ?? '—'}</td>
                      <td className="px-3 py-2 text-right">{formatQuantity(row.paid_qty)}</td>
                      <td className="px-3 py-2 text-right">{formatQuantity(row.bridged_qty)}</td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatQuantity(row.balance_qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !notEligible ? (
            <p className="text-sm text-muted-foreground">
              {t('No product entitlements on this invoice yet.')}
            </p>
          ) : null}

          {truckLoads.length > 0 ? (
            <div>
              <h4 className="mb-2 text-sm font-semibold">{t('Distributed trucks')}</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left font-semibold">{t('Load #')}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t('Date')}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t('Truck')}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t('Driver')}</th>
                      <th className="px-3 py-2 text-right font-semibold">{t('Qty')}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t('Phase')}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t('Sales invoice')}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t('Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {truckLoads.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-2">{row.load_number || `#${row.id}`}</td>
                        <td className="px-3 py-2">
                          {row.loading_date ? formatDate(row.loading_date) : '—'}
                        </td>
                        <td className="px-3 py-2">{row.truck?.plate_number ?? '—'}</td>
                        <td className="px-3 py-2">{driverLabel(row)}</td>
                        <td className="px-3 py-2 text-right">{formatQuantity(row.quantity)}</td>
                        <td className="px-3 py-2">{truckLoadPhaseLabel(row.phase, t)}</td>
                        <td className="px-3 py-2">
                          {salesAllocationLabels(row).length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              {salesAllocationLabels(row).map((si) => (
                                <Link
                                  key={si.id}
                                  to={`${paths.sales.invoices}/${si.id}`}
                                  className="text-primary hover:underline"
                                >
                                  {si.label}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <PurchaseTruckLoadActions
                            load={row}
                            purchaseInvoiceId={invoiceId}
                            onUpdated={() => void progressQuery.refetch()}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : notEligible ? null : (
            <p className="text-sm text-muted-foreground">
              {t('No truck loads yet. Add a load when a truck is sent to the supplier depot.')}
            </p>
          )}
        </CardContent>
      </Card>

      <TruckLoadFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entitlements={entitlements}
        defaultLoadingDepotId={loadingDepotId}
        isPending={createMutation.isPending}
        dialogTitle={t('Adding Bridging')}
        submitLabel={t('Create Bridging')}
        onSubmit={onFormSubmit}
      />
    </>
  )
}
