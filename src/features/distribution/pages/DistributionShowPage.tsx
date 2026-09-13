import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'
import {
  advanceDistributionStatus,
  distributionAdvanceLabels,
  getDistributionResource,
  postInventoryMovement,
  type DistributionRow,
} from '../distribution-api'
import { DistributionFormDialog } from '../components/DistributionFormDialog'
import { DistributionWorkflowTimeline } from '../components/DistributionWorkflowTimeline'
import { distributionEntityByKey } from '../distribution-entities'
import { canEditDistributionRecord } from '../distribution-workflow'
import {
  depotLink,
  loadingScheduleLink,
  personDisplayName,
  resolveScheduleDestination,
  rowTitle,
  scalarDetails,
  transitLink,
  truckDisplay,
  type DetailItem,
} from '../components/distribution-show-utils'

type Props = {
  title: string
  apiPath: string
  listPath: string
  /** Kept for route config spread; create/edit use modals. */
  createPath?: string
  editPath?: (id: number) => string
  entityKey?: string
  labelKeys?: string[]
  postAction?: boolean
}

function DetailGrid({ items }: { items: DetailItem[] }) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function RelatedList({
  title: sectionTitle,
  items,
  renderItem,
}: {
  title: string
  items: unknown[]
  renderItem: (row: Record<string, unknown>) => ReactNode
}) {
  if (!items.length) return null
  return (
    <div className="space-y-2 border-t pt-4">
      <h3 className="text-sm font-semibold">{sectionTitle}</h3>
      <ul className="divide-y rounded-md border text-sm">
        {items.map((row) => {
          const record = row as Record<string, unknown>
          return (
            <li key={String(record.id ?? record.transit_number ?? record.delivery_number)} className="px-3 py-2">
              {renderItem(record)}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function buildDetailSections(apiPath: string, data: DistributionRow, t: (k: string) => string): DetailItem[] {
  const skip = new Set([
    'id',
    'company_id',
    'created_by',
    'creator_id',
    'created_at',
    'updated_at',
    'depot',
    'product',
    'truck',
    'transit',
    'loading_schedule',
    'loadingSchedule',
    'truck_load',
    'truckLoad',
    'driver',
    'driver_id',
    'destination',
    'movement_type',
    'movementType',
    'from_depot',
    'to_depot',
    'fromDepot',
    'toDepot',
    'transits',
    'delivery_schedules',
    'deliverySchedules',
    'shortages',
    'overages',
  ])

  const items: DetailItem[] = []

  if (apiPath.includes('loading-schedules')) {
    items.push(
      { label: t('Depot'), value: depotLink(data.depot as { id?: number; name?: string }) },
      { label: t('Product'), value: String((data.product as { name?: string })?.name ?? '—') },
      {
        label: t('Truck'),
        value: truckDisplay(
          data.truck as Parameters<typeof truckDisplay>[0],
          data.truck_id as number,
        ),
      },
      { label: t('Destination'), value: resolveScheduleDestination(data) },
      {
        label: t('Driver'),
        value: personDisplayName(
          data.driver as { first_name?: string; last_name?: string; email?: string },
        ),
      },
    )
    items.push(
      ...scalarDetails(
        data,
        ['schedule_number', 'scheduled_date', 'planned_quantity', 'notes', 'status'],
        skip,
      ),
    )
  } else if (apiPath.includes('receiving-schedules')) {
    items.push(
      {
        label: t('From location / source'),
        value: depotLink(
          (data.loadingDepot ?? data.loading_depot) as { id?: number; name?: string },
        ),
      },
      {
        label: t('Arrival depot'),
        value: depotLink(
          (data.receivingDepot ?? data.receiving_depot) as { id?: number; name?: string },
        ),
      },
      { label: t('Product'), value: String((data.product as { name?: string })?.name ?? '—') },
      {
        label: t('Truck plate number'),
        value: truckDisplay(
          data.truck as Parameters<typeof truckDisplay>[0],
          data.truck_id as number,
        ),
      },
      { label: t('Destination'), value: resolveScheduleDestination(data) },
    )
    items.push(
      ...scalarDetails(
        data,
        ['schedule_number', 'arrival_date', 'quantity', 'notes', 'status'],
        skip,
      ),
    )
  } else if (apiPath.includes('transits')) {
    items.push(
      {
        label: t('From depot'),
        value: depotLink((data.from_depot ?? data.fromDepot) as { id?: number; name?: string }),
      },
      {
        label: t('To depot'),
        value: depotLink((data.to_depot ?? data.toDepot) as { id?: number; name?: string }),
      },
      {
        label: t('Truck'),
        value: truckDisplay(
          data.truck as Parameters<typeof truckDisplay>[0],
          data.truck_id as number,
        ),
      },
      {
        label: t('Loading schedule'),
        value: loadingScheduleLink(
          (data.loading_schedule ?? data.loadingSchedule) as { id?: number; schedule_number?: string },
        ),
      },
    )
    items.push(
      ...scalarDetails(
        data,
        ['transit_number', 'departed_at', 'arrived_at', 'quantity', 'notes', 'status'],
        skip,
      ),
    )
  } else if (apiPath.includes('delivery-schedules')) {
    items.push(
      { label: t('Depot'), value: depotLink(data.depot as { id?: number; name?: string }) },
      { label: t('Transit'), value: transitLink(data.transit as { id?: number; transit_number?: string }) },
    )
    items.push(
      ...scalarDetails(
        data,
        ['delivery_number', 'scheduled_at', 'delivered_at', 'quantity', 'notes', 'status'],
        skip,
      ),
    )
  } else if (apiPath.includes('shortages') || apiPath.includes('overages')) {
    const qtyKey = apiPath.includes('shortages') ? 'shortage_quantity' : 'overage_quantity'
    items.push(
      { label: t('Transit'), value: transitLink(data.transit as { id?: number; transit_number?: string }) },
      { label: t('Product'), value: String((data.product as { name?: string })?.name ?? '—') },
    )
    items.push(
      ...scalarDetails(data, ['expected_quantity', 'actual_quantity', qtyKey, 'reason', 'status'], skip),
    )
  } else if (apiPath.includes('inventory-movements')) {
    items.push(
      {
        label: t('Movement type'),
        value: String(
          (data.movement_type as { name?: string })?.name ??
            (data.movementType as { name?: string })?.name ??
            '—',
        ),
      },
      { label: t('Depot'), value: depotLink(data.depot as { id?: number; name?: string }) },
      { label: t('Product'), value: String((data.product as { name?: string })?.name ?? '—') },
    )
    items.push(
      ...scalarDetails(data, ['reference_number', 'movement_at', 'quantity', 'notes', 'status'], skip),
    )
  } else {
    items.push(...scalarDetails(data, Object.keys(data), skip))
  }

  return items
}

export function DistributionShowPage({
  title,
  apiPath,
  listPath,
  entityKey,
  labelKeys = ['id'],
  postAction = false,
}: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const recordId = Number(id)
  const queryClient = useQueryClient()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const entity = entityKey ? distributionEntityByKey(entityKey) : undefined

  const { data, isLoading, error } = useQuery({
    queryKey: ['distribution', apiPath, recordId],
    queryFn: () => getDistributionResource(apiPath, recordId),
    enabled: Number.isFinite(recordId),
  })

  const displayTitle = data ? rowTitle(data, labelKeys) : title

  usePageChrome({
    pageTitle: displayTitle,
    breadcrumbs: [
      { label: t('Depots & Distribution') },
      { label: title, url: listPath },
      { label: displayTitle },
    ],
  })

  const advanceMutation = useMutation({
    mutationFn: () => advanceDistributionStatus(apiPath, recordId),
    onSuccess: () => {
      toast.success(t('Status updated'))
      void queryClient.invalidateQueries({ queryKey: ['distribution', apiPath, recordId] })
      void queryClient.invalidateQueries({ queryKey: ['distribution', apiPath] })
    },
    onError: () => toast.error(t('Could not update status')),
  })

  const postMutation = useMutation({
    mutationFn: () => postInventoryMovement(recordId),
    onSuccess: () => {
      toast.success(t('Movement posted'))
      void queryClient.invalidateQueries({ queryKey: ['distribution', apiPath, recordId] })
      void queryClient.invalidateQueries({ queryKey: ['distribution', apiPath] })
    },
    onError: () => toast.error(t('Could not post movement')),
  })

  const status = data?.status ? String(data.status) : ''
  const advanceLabel = distributionAdvanceLabels[apiPath]?.[status]
  const detailItems = data ? buildDetailSections(apiPath, data, t) : []
  const editable = status ? canEditDistributionRecord(apiPath, status) : false

  const transitCreateHref =
    entityKey === 'loading-schedules' && data
      ? `${paths.distribution.transitCreate}?loading_schedule_id=${data.id}&from_depot_id=${data.depot_id ?? ''}&truck_id=${data.truck_id ?? ''}&quantity=${data.planned_quantity ?? ''}`
      : null

  const deliveryCreateHref =
    entityKey === 'transits' && data
      ? `${paths.distribution.deliveryScheduleCreate}?transit_id=${data.id}&depot_id=${(data.to_depot as { id?: number })?.id ?? data.to_depot_id ?? ''}&quantity=${data.quantity ?? ''}`
      : null

  const transits = (data?.transits ?? []) as Record<string, unknown>[]
  const deliveries = (data?.delivery_schedules ?? data?.deliverySchedules ?? []) as Record<string, unknown>[]
  const shortages = (data?.shortages ?? []) as Record<string, unknown>[]
  const overages = (data?.overages ?? []) as Record<string, unknown>[]

  return (
    <>
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{displayTitle}</CardTitle>
          {status ? <FleetStatusBadge status={status} /> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {transitCreateHref ? (
            <Button type="button" size="sm" variant="secondary" onClick={() => navigate(transitCreateHref)}>
              {t('Create transit')}
            </Button>
          ) : null}
          {deliveryCreateHref ? (
            <Button type="button" size="sm" variant="secondary" onClick={() => navigate(deliveryCreateHref)}>
              {t('Create delivery')}
            </Button>
          ) : null}
          {editable && entity ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setEditDialogOpen(true)}>
              {t('Edit')}
            </Button>
          ) : null}
          {postAction && status === 'draft' ? (
            <Button type="button" size="sm" disabled={postMutation.isPending} onClick={() => postMutation.mutate()}>
              {t('Post movement')}
            </Button>
          ) : null}
          {advanceLabel ? (
            <Button
              type="button"
              size="sm"
              disabled={advanceMutation.isPending}
              onClick={() => advanceMutation.mutate()}
            >
              {advanceLabel}
            </Button>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link to={listPath}>{t('Back to list')}</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">{t('Loading…')}</p>}
        {error && <p className="text-sm text-destructive">{t('Record not found.')}</p>}
        {data ? (
          <>
            <DistributionWorkflowTimeline apiPath={apiPath} record={data} />
            <DetailGrid items={detailItems} />
            <RelatedList
              title={t('Related transits')}
              items={transits}
              renderItem={(row) => (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {transitLink(row as { id?: number; transit_number?: string })}
                  <Badge variant="outline" className="capitalize">
                    {String(row.status ?? '').replace(/_/g, ' ') || '—'}
                  </Badge>
                </div>
              )}
            />
            <RelatedList
              title={t('Delivery schedules')}
              items={deliveries}
              renderItem={(row) => (
                <Link
                  to={paths.distribution.deliveryScheduleShow(Number(row.id))}
                  className="text-primary hover:underline"
                >
                  {String(row.delivery_number ?? `#${row.id}`)}
                </Link>
              )}
            />
            <RelatedList
              title={t('Shortages')}
              items={shortages}
              renderItem={(row) => (
                <Link
                  to={paths.distribution.shortageShow(Number(row.id))}
                  className="text-primary hover:underline"
                >
                  {String((row.product as { name?: string })?.name ?? t('Shortage'))} —{' '}
                  {String(row.shortage_quantity ?? '—')}
                </Link>
              )}
            />
            <RelatedList
              title={t('Overages')}
              items={overages}
              renderItem={(row) => (
                <Link
                  to={paths.distribution.overageShow(Number(row.id))}
                  className="text-primary hover:underline"
                >
                  {String((row.product as { name?: string })?.name ?? t('Overage'))} —{' '}
                  {String(row.overage_quantity ?? '—')}
                </Link>
              )}
            />
          </>
        ) : null}
      </CardContent>
    </Card>

    {entity ? (
      <DistributionFormDialog
        title={entity.singularTitle}
        apiPath={apiPath}
        fields={entity.fields}
        mode="edit"
        recordId={recordId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: ['distribution', apiPath, recordId] })
          void queryClient.invalidateQueries({ queryKey: ['distribution', apiPath] })
        }}
      />
    ) : null}
    </>
  )
}
