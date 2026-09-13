import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { paths } from '@/lib/paths'
import {
  distributionListQuery,
  truckLoadCreatePrefill,
  truckLoadListFilter,
} from '@/features/distribution/distribution-truck-load'
import { operationalPanelActionButtonClass } from '../bridging-status-ui'
import { isTruckLoadArrivedAtDepot, isTruckLoadInDistribution } from '../bridging-phase-helpers'
import type { TruckLoad } from '../types'

type Props = {
  load: TruckLoad
}

function deliveryQty(load: TruckLoad): string {
  const qty = load.assigned_qty > 0 ? load.assigned_qty : load.quantity
  return String(qty)
}

export function TruckLoadDistributionPanel({ load }: Props) {
  const { t } = useTranslation()
  const id = load.id
  const phase = load.phase

  const canUseDistribution =
    isTruckLoadInDistribution(phase) ||
    phase === 'delivered' ||
    isTruckLoadArrivedAtDepot(phase)

  const canConfirmDelivery = isTruckLoadInDistribution(phase)

  const loadingScheduleCreate = `${paths.distribution.loadingSchedules}${distributionListQuery(
    truckLoadCreatePrefill(id, {
      ...(load.truck_id ? { truck_id: String(load.truck_id) } : {}),
      ...(load.driver_id ? { driver_id: String(load.driver_id) } : {}),
      ...(load.loading_depot_id ? { depot_id: String(load.loading_depot_id) } : {}),
      ...(load.destination ? { destination: load.destination } : {}),
      planned_quantity: String(load.quantity),
    }),
  )}`

  const deliveryConfirmationCreate = `${paths.distribution.deliveryConfirmations}${distributionListQuery(
    truckLoadCreatePrefill(id, {
      quantity_delivered: deliveryQty(load),
      delivered_at: new Date().toISOString().slice(0, 16),
    }),
  )}`

  const loadingSchedulesFiltered = `${paths.distribution.loadingSchedules}${distributionListQuery(
    truckLoadListFilter(id),
  )}`

  const deliveryConfirmationsFiltered = `${paths.distribution.deliveryConfirmations}${distributionListQuery(
    truckLoadListFilter(id),
  )}`

  if (!canUseDistribution && phase !== 'awaiting_load') {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('Distribution')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          asChild
          variant="outline"
          size="sm"
          className={operationalPanelActionButtonClass('view')}
        >
          <Link to={paths.distribution.informationWithTruckLoad(id)}>
            {t('View distribution trail')}
          </Link>
        </Button>
        {canUseDistribution ? (
          <Button
            asChild
            variant="outline"
            size="sm"
            className={operationalPanelActionButtonClass('view')}
          >
            <Link to={loadingSchedulesFiltered}>{t('Loading schedules')}</Link>
          </Button>
        ) : null}
        {canUseDistribution ? (
          <Button
            asChild
            variant="outline"
            size="sm"
            className={operationalPanelActionButtonClass('view')}
          >
            <Link to={deliveryConfirmationsFiltered}>{t('Delivery confirmations')}</Link>
          </Button>
        ) : null}
        {isTruckLoadInDistribution(phase) ? (
          <Button
            asChild
            variant="outline"
            size="sm"
            className={operationalPanelActionButtonClass('provision')}
          >
            <Link to={loadingScheduleCreate}>{t('Create loading schedule')}</Link>
          </Button>
        ) : null}
        {canConfirmDelivery ? (
          <Button
            asChild
            variant="outline"
            size="sm"
            className={cn(operationalPanelActionButtonClass('confirm_delivery'))}
          >
            <Link to={deliveryConfirmationCreate}>{t('Record delivery confirmation')}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
