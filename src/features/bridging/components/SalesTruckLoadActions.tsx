import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { getApiErrorMessage } from '@/lib/errors'
import { queryKeys } from '@/lib/query-keys'
import { operationalPanelActionButtonClass } from '../bridging-status-ui'
import { isTruckLoadInDistribution } from '../bridging-phase-helpers'
import {
  cancelTruckLoadDistribution,
  confirmTruckLoadDelivery,
  releaseTruck,
  type TruckLoad,
} from '../bridging-api'
import { AwaitingFullTruckLoadDialog } from './AwaitingFullTruckLoadDialog'

type Props = {
  load: TruckLoad
  salesInvoiceId: string | number
  onUpdated?: () => void
  size?: 'sm' | 'default'
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

function isAwaitingFullTruckLoad(load: TruckLoad, salesInvoiceId: number): boolean {
  const allocated = allocatedQtyOnInvoice(load, salesInvoiceId)
  return (
    load.phase === 'arrived' &&
    allocated > 0 &&
    (load.assigned_qty ?? 0) < load.quantity
  )
}

export function SalesTruckLoadActions({ load, salesInvoiceId, onUpdated, size = 'sm' }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const truckLoadId = load.truck_load_id ?? load.id
  const numericSalesInvoiceId = Number(salesInvoiceId)
  const allocatedQty = allocatedQtyOnInvoice(load, numericSalesInvoiceId)

  const [awaitingDialogOpen, setAwaitingDialogOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.bridging.salesProgress(salesInvoiceId),
    })
    void queryClient.invalidateQueries({ queryKey: queryKeys.bridging.bridgedAvailable.all() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.bridging.truckLoads.all() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.bridging.truckLoads.detail(truckLoadId) })
    onUpdated?.()
  }

  const deliverMutation = useMutation({
    mutationFn: () => confirmTruckLoadDelivery(truckLoadId),
    onSuccess: () => {
      toast.success(t('Delivery confirmed.'))
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to confirm delivery'))),
  })

  const releaseMutation = useMutation({
    mutationFn: () => releaseTruck(truckLoadId),
    onSuccess: () => {
      toast.success(t('Truck released.'))
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to release truck'))),
  })

  const cancelDistributionMutation = useMutation({
    mutationFn: () =>
      cancelTruckLoadDistribution(truckLoadId, {
        sales_invoice_id: numericSalesInvoiceId,
      }),
    onSuccess: () => {
      toast.success(t('Distribution cancelled.'))
      setCancelConfirmOpen(false)
      invalidate()
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, t('Failed to cancel distribution'))),
  })

  const canCancelDistribution =
    !load.released_at &&
    load.phase !== 'delivered' &&
    load.phase !== 'cancelled' &&
    allocatedQty > 0

  const cancelDistributionButton = canCancelDistribution ? (
    <Button
      type="button"
      size={size}
      variant="outline"
      className={operationalPanelActionButtonClass('cancel')}
      disabled={cancelDistributionMutation.isPending}
      onClick={(e) => {
        e.stopPropagation()
        setCancelConfirmOpen(true)
      }}
    >
      {cancelDistributionMutation.isPending ? t('Cancelling...') : t('Cancel distribution')}
    </Button>
  ) : null

  if (load.released_at) {
    return (
      <span className="text-xs font-medium text-muted-foreground">{t('Truck released')}</span>
    )
  }

  if (isAwaitingFullTruckLoad(load, numericSalesInvoiceId)) {
    return (
      <>
        <div className="flex flex-col items-start gap-1">
          <Button
            type="button"
            size={size}
            variant="link"
            className="h-auto p-0 text-xs font-medium text-amber-700 dark:text-amber-400"
            onClick={(e) => {
              e.stopPropagation()
              setAwaitingDialogOpen(true)
            }}
          >
            {t('Awaiting Full truck load')}
          </Button>
          {cancelDistributionButton}
        </div>
        <AwaitingFullTruckLoadDialog
          open={awaitingDialogOpen}
          onOpenChange={setAwaitingDialogOpen}
          load={load}
          allocatedQty={allocatedQty}
        />
        <ConfirmationDialog
          open={cancelConfirmOpen}
          onOpenChange={setCancelConfirmOpen}
          title={t('Cancel distribution?')}
          message={t(
            'Are you sure you want to cancel this distribution? Stock balance will be restored.',
          )}
          confirmText={t('Cancel distribution')}
          variant="destructive"
          loading={cancelDistributionMutation.isPending}
          onConfirm={() => cancelDistributionMutation.mutate()}
        />
      </>
    )
  }

  if (isTruckLoadInDistribution(load.phase)) {
    return (
      <>
        <div className="flex flex-col items-start gap-1">
          <Button
            type="button"
            size={size}
            variant="outline"
            className={operationalPanelActionButtonClass('confirm_delivery')}
            disabled={deliverMutation.isPending}
            onClick={(e) => {
              e.stopPropagation()
              deliverMutation.mutate()
            }}
          >
            {deliverMutation.isPending ? t('Confirming...') : t('Confirm delivery')}
          </Button>
          {cancelDistributionButton}
        </div>
        <ConfirmationDialog
          open={cancelConfirmOpen}
          onOpenChange={setCancelConfirmOpen}
          title={t('Cancel distribution?')}
          message={t(
            'Are you sure you want to cancel this distribution? Stock balance will be restored.',
          )}
          confirmText={t('Cancel distribution')}
          variant="destructive"
          loading={cancelDistributionMutation.isPending}
          onConfirm={() => cancelDistributionMutation.mutate()}
        />
      </>
    )
  }

  if (load.phase === 'delivered') {
    return (
      <Button
        type="button"
        size={size}
        variant="outline"
        className={operationalPanelActionButtonClass('release')}
        disabled={releaseMutation.isPending}
        onClick={(e) => {
          e.stopPropagation()
          releaseMutation.mutate()
        }}
      >
        {releaseMutation.isPending ? t('Releasing...') : t('Release truck')}
      </Button>
    )
  }

  if (canCancelDistribution) {
    return (
      <>
        {cancelDistributionButton}
        <ConfirmationDialog
          open={cancelConfirmOpen}
          onOpenChange={setCancelConfirmOpen}
          title={t('Cancel distribution?')}
          message={t(
            'Are you sure you want to cancel this distribution? Stock balance will be restored.',
          )}
          confirmText={t('Cancel distribution')}
          variant="destructive"
          loading={cancelDistributionMutation.isPending}
          onConfirm={() => cancelDistributionMutation.mutate()}
        />
      </>
    )
  }

  return null
}
