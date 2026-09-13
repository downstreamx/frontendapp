import { useTranslation } from 'react-i18next'
import { formatQuantity } from '@/lib/format-quantity'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { TruckLoad } from '../bridging-api'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  load: TruckLoad
  allocatedQty: number
}

export function AwaitingFullTruckLoadDialog({
  open,
  onOpenChange,
  load,
  allocatedQty,
}: Props) {
  const { t } = useTranslation()
  const truckCapacity = load.quantity
  const loadedSoFar = load.assigned_qty ?? 0
  const remaining = Math.max(0, truckCapacity - loadedSoFar)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('Awaiting Full truck load')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            {t(
              'This truck is not fully loaded yet. Delivery can be confirmed only after the full truck capacity has been assigned through distribution.',
            )}
          </p>
          <dl className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t('Assigned to this invoice')}</dt>
              <dd className="font-medium">{formatQuantity(allocatedQty, { unit: 'L' })}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t('Truck load capacity')}</dt>
              <dd className="font-medium">{formatQuantity(truckCapacity, { unit: 'L' })}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t('Distributed on truck')}</dt>
              <dd className="font-medium">{formatQuantity(loadedSoFar, { unit: 'L' })}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-2">
              <dt className="font-medium">{t('Remaining before full load')}</dt>
              <dd className="font-semibold text-amber-700 dark:text-amber-400">
                {formatQuantity(remaining, { unit: 'L' })}
              </dd>
            </div>
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  )
}
