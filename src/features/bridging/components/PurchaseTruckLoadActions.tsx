import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/errors'
import { queryKeys } from '@/lib/query-keys'
import { isTruckLoadInTransitBridged } from '../bridging-phase-helpers'
import { operationalPanelActionButtonClass } from '../bridging-status-ui'
import {
  approveTruckLoad,
  cancelTruckLoad,
  confirmTruckLoadArrival,
  type TruckLoad,
} from '../bridging-api'

type Props = {
  load: TruckLoad
  purchaseInvoiceId: string | number
  onUpdated?: () => void
  size?: 'sm' | 'default'
}

export function PurchaseTruckLoadActions({
  load,
  purchaseInvoiceId,
  onUpdated,
  size = 'sm',
}: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.bridging.purchaseProgress(purchaseInvoiceId) })
    void queryClient.invalidateQueries({
      queryKey: queryKeys.bridging.truckLoads.byInvoice('purchase', purchaseInvoiceId),
    })
    void queryClient.invalidateQueries({ queryKey: queryKeys.bridging.truckLoads.all() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.bridging.bridgedAvailable.all() })
    onUpdated?.()
  }

  const approveMutation = useMutation({
    mutationFn: () => approveTruckLoad(load.id),
    onSuccess: () => {
      toast.success(t('Truck load approved.'))
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to approve truck load'))),
  })

  const confirmArrivalMutation = useMutation({
    mutationFn: () => confirmTruckLoadArrival(load.id),
    onSuccess: () => {
      toast.success(t('Arrival at depot confirmed.'))
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to confirm arrival'))),
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelTruckLoad(load.id),
    onSuccess: () => {
      toast.success(t('Truck load cancelled.'))
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to cancel truck load'))),
  })

  if (load.phase === 'awaiting_load') {
    return (
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          size={size}
          variant="outline"
          className={operationalPanelActionButtonClass('approve')}
          disabled={approveMutation.isPending}
          onClick={() => approveMutation.mutate()}
        >
          {approveMutation.isPending ? t('Approving...') : t('Approve Bridging')}
        </Button>
        <Button
          type="button"
          size={size}
          variant="outline"
          className={operationalPanelActionButtonClass('cancel')}
          disabled={cancelMutation.isPending}
          onClick={() => cancelMutation.mutate()}
        >
          {cancelMutation.isPending ? t('Cancelling...') : t('Cancel')}
        </Button>
      </div>
    )
  }

  if (isTruckLoadInTransitBridged(load.phase)) {
    return (
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          size={size}
          variant="outline"
          className={operationalPanelActionButtonClass('confirm_delivery')}
          disabled={confirmArrivalMutation.isPending}
          onClick={() => confirmArrivalMutation.mutate()}
        >
          {confirmArrivalMutation.isPending
            ? t('Confirming...')
            : t('Confirm arrival at depot')}
        </Button>
      </div>
    )
  }

  return null
}
