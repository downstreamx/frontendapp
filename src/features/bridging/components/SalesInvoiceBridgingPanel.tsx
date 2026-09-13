import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertCircle, PackagePlus, Truck } from 'lucide-react'
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
  applySalesCreditEntitlements,
  bulkAssignTruckLoadsToSalesInvoice,
  fetchSalesDistributionProgress,
  provisionInvoiceLoading,
  type BulkAssignTruckLoadsPayload,
  type TruckLoad,
} from '../bridging-api'
import {
  operationalInvoicePanelCardClass,
  operationalPanelActionButtonClass,
  operationalPanelPhaseChipClass,
  salesDistributionStatusBadgeClass,
  salesDistributionStatusLabel,
  truckLoadPhaseLabel,
} from '../bridging-status-ui'
import type { LoadsByPhase, SalesDistributionBlockReason, SalesDistributionStatus } from '../types'
import { AssignTruckLoadDialog } from './AssignTruckLoadDialog'
import { SalesTruckLoadActions } from './SalesTruckLoadActions'

type Props = {
  invoiceId: string | number
  depotId?: number | null
  invoiceStatus?: string
  paidAmount?: number
}

function driverLabel(row: TruckLoad): string {
  if (!row.driver) return '—'
  return [row.driver.first_name, row.driver.last_name].filter(Boolean).join(' ') || '—'
}

function allocatedQtyOnInvoice(load: TruckLoad, salesInvoiceId: number): number {
  const fromAllocations = (load.sales_allocations ?? [])
    .filter((row) => row.sales_invoice_id === salesInvoiceId)
    .reduce((sum, row) => sum + row.quantity, 0)
  if (fromAllocations > 0) {
    return fromAllocations
  }
  if (load.sales_invoice_id === salesInvoiceId) {
    return load.assigned_qty || load.quantity
  }
  return 0
}

function distributionBlockMessage(
  reason: SalesDistributionBlockReason | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  switch (reason) {
    case 'insufficient_depot_stock':
      return t(
        'Credit sale could not create distribution entitlements: depot stock is below the invoiced quantity. Increase depot stock, then contact support to re-apply credit entitlements, or record a customer payment.',
      )
    case 'missing_depot':
      return t(
        'This product invoice has no depot. Edit the invoice (if still draft) or create a new invoice with a depot to use credit distribution.',
      )
    case 'service_invoice_not_eligible':
      return t('Service invoices do not receive product distribution entitlements.')
    case 'entitlements_missing':
      return t(
        'Credit terms apply but entitlements were not created when this invoice was posted. Record a cleared customer payment, or ask an admin to re-apply credit entitlements.',
      )
    case 'prepaid_requires_payment':
    default:
      return t(
        'Record a cleared customer payment, or use payment terms with Credit terms enabled in Sales system setup and post the invoice.',
      )
  }
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

export function SalesInvoiceBridgingPanel({
  invoiceId,
  invoiceStatus,
  paidAmount = 0,
}: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const numericInvoiceId = Number(invoiceId)

  const progressQuery = useQuery({
    queryKey: queryKeys.bridging.salesProgress(invoiceId),
    queryFn: () => fetchSalesDistributionProgress(invoiceId),
  })

  const provisionMutation = useMutation({
    mutationFn: () => provisionInvoiceLoading('sales', invoiceId),
    onSuccess: () => {
      toast.success(t('Loading provisioned successfully.'))
      void progressQuery.refetch()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to provision loading'))),
  })

  const applyCreditMutation = useMutation({
    mutationFn: () => applySalesCreditEntitlements(invoiceId),
    onSuccess: () => {
      toast.success(t('Credit entitlements applied.'))
      void queryClient.invalidateQueries({ queryKey: queryKeys.bridging.salesProgress(invoiceId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.sales.invoices.detail(invoiceId) })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to apply credit entitlements'))),
  })

  const assignMutation = useMutation({
    mutationFn: (payload: BulkAssignTruckLoadsPayload) =>
      bulkAssignTruckLoadsToSalesInvoice(invoiceId, payload),
    onSuccess: (rows) => {
      const count = rows.length
      toast.success(
        count === 1
          ? t('Truck assigned to invoice.')
          : t('{{count}} trucks assigned to invoice.', { count }),
      )
      setDialogOpen(false)
      void queryClient.invalidateQueries({ queryKey: queryKeys.bridging.salesProgress(invoiceId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.bridging.bridgedAvailable.all() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.sales.invoices.detail(invoiceId) })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to assign trucks'))),
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
            {t('Distribution & truck loads')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">{t('Could not load distribution')}</p>
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
  const distributionStatus = (progress?.distribution_status ?? 'not_eligible') as SalesDistributionStatus
  const stockBalances = progress?.stock_balances ?? []
  const truckLoads = progress?.truck_loads ?? []
  const notEligible = distributionStatus === 'not_eligible'
  const canAssign =
    !notEligible &&
    distributionStatus !== 'fully_distributed' &&
    stockBalances.some((e) => e.balance_qty > 0) &&
    (progress?.bridged_trucks_available_count ?? 0) > 0
  const isDraft = invoiceStatus === 'draft'
  const canProvision = (progress?.total_balance_qty ?? 0) > 0 && notEligible && paidAmount > 0
  const canApplyCredit =
    notEligible &&
    !isDraft &&
    progress?.is_credit_terms === true &&
    (progress?.distribution_block_reason === 'entitlements_missing' ||
      progress?.distribution_block_reason === 'insufficient_depot_stock')

  return (
    <>
      <Card className={operationalInvoicePanelCardClass}>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5" />
              {t('Distribution')}
            </CardTitle>
            <span className={salesDistributionStatusBadgeClass(distributionStatus)}>
              {salesDistributionStatusLabel(distributionStatus, t)}
            </span>
            {!notEligible && (progress?.bridged_trucks_available_count ?? 0) > 0 ? (
              <p className="text-xs text-muted-foreground">
                {t('{{count}} bridged truck(s) available to assign', {
                  count: progress?.bridged_trucks_available_count ?? 0,
                })}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {canApplyCredit ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={operationalPanelActionButtonClass('apply_credit')}
                disabled={applyCreditMutation.isPending}
                onClick={() => applyCreditMutation.mutate()}
              >
                {applyCreditMutation.isPending
                  ? t('Applying...')
                  : t('Apply credit entitlements')}
              </Button>
            ) : null}
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
            {canAssign ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={operationalPanelActionButtonClass('distribute')}
                onClick={() => setDialogOpen(true)}
              >
                <PackagePlus className="mr-1 h-4 w-4" />
                {t('Distribute')}
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
                  {t('Post this sales invoice before assigning trucks for distribution.')}
                </p>
              </div>
            </div>
          ) : null}

          {notEligible && !isDraft ? (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-900/20">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
              <div>
                <p className="font-medium">
                  {progress?.is_credit_terms ? t('Credit entitlements required') : t('Payment required')}
                </p>
                <p className="text-muted-foreground">
                  {paidAmount <= 0
                    ? distributionBlockMessage(progress?.distribution_block_reason, t)
                    : t(
                        'Provision loading or wait for entitlements after payment is allocated to product lines.',
                      )}
                </p>
              </div>
            </div>
          ) : null}

          {!notEligible &&
          !isDraft &&
          (progress?.bridged_trucks_available_count ?? 0) === 0 &&
          distributionStatus !== 'fully_distributed' ? (
            <div className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-muted-foreground">
                {t(
                  'No bridged trucks are available company-wide. Approve truck loads on purchase invoices, then assign them here.',
                )}
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">{t('Invoiced qty')}</p>
              <p className="text-lg font-semibold">
                {formatQuantity(progress?.total_invoiced_qty ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">{t('Paid qty')}</p>
              <p className="text-lg font-semibold">
                {formatQuantity(progress?.total_paid_qty ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">{t('Distributed qty')}</p>
              <p className="text-lg font-semibold">
                {formatQuantity(progress?.total_distributed_qty ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">{t('Undistributed qty')}</p>
              <p className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                {formatQuantity(progress?.total_balance_qty ?? 0)}
              </p>
            </div>
          </div>

          {progress?.loads_by_phase ? (
            <PhaseSummary loadsByPhase={progress.loads_by_phase} t={t} />
          ) : null}

          {stockBalances.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-semibold">{t('Product')}</th>
                    <th className="px-3 py-2 text-left font-semibold">{t('Depot')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('Paid')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('Distributed')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('Balance')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stockBalances.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2">{row.product?.name ?? '—'}</td>
                      <td className="px-3 py-2">{row.depot?.name ?? '—'}</td>
                      <td className="px-3 py-2 text-right">{formatQuantity(row.paid_qty)}</td>
                      <td className="px-3 py-2 text-right">
                        {formatQuantity(row.distributed_qty ?? row.bridged_qty)}
                      </td>
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
              <h4 className="mb-2 text-sm font-semibold">{t('Assigned truck loads')}</h4>
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
                      <th className="px-3 py-2 text-left font-semibold">{t('Purchase invoice')}</th>
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
                        <td className="px-3 py-2 text-right">
                          {formatQuantity(allocatedQtyOnInvoice(row, numericInvoiceId))}
                        </td>
                        <td className="px-3 py-2">{truckLoadPhaseLabel(row.phase, t)}</td>
                        <td className="px-3 py-2">
                          {row.purchase_invoice?.id ? (
                            <Link
                              to={`${paths.purchase.invoices}/${row.purchase_invoice.id}`}
                              className="text-primary hover:underline"
                            >
                              {row.purchase_invoice.invoice_number ?? `#${row.purchase_invoice.id}`}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <SalesTruckLoadActions
                            load={row}
                            salesInvoiceId={invoiceId}
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
              {t('No trucks assigned yet. Assign a bridged truck when ready to distribute.')}
            </p>
          )}
        </CardContent>
      </Card>

      <AssignTruckLoadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        salesInvoiceId={numericInvoiceId}
        stockBalances={stockBalances}
        assignedTruckLoads={truckLoads}
        isPending={assignMutation.isPending}
        onSubmit={(payload) => assignMutation.mutate(payload)}
      />
    </>
  )
}
