import type { TFunction } from 'i18next'
import type { Column } from '@/components/ui/data-table'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import {
  TableProductAvatarCell,
  TableTruckAvatarCell,
} from '@/features/shared/components/table-avatar-cells'
import { truckLabel } from '@/features/shared/lib/entity-labels'
import { formatQuantity } from '@/lib/format-quantity'
import { formatDate } from '@/utils/helpers'
import type { DistributionRow } from '../distribution-api'
import type { ScheduleColumnKey, ScheduleViewProfile } from '../schedule-view-profiles'
import { resolveScheduleDestination } from './distribution-show-utils'

type BuildArgs = {
  profile: ScheduleViewProfile
  t: TFunction
  rows: DistributionRow[]
  page: number
  perPage: string
  entityKey: 'loading-schedules' | 'receiving-schedules'
}

function sourceLabel(row: DistributionRow, entityKey: BuildArgs['entityKey']): string {
  if (entityKey === 'loading-schedules') {
    return String((row.depot as { name?: string })?.name ?? '—')
  }
  return String(
    (row.loadingDepot as { name?: string })?.name ??
      (row.loading_depot as { name?: string })?.name ??
      '—',
  )
}

function dateValue(row: DistributionRow, entityKey: BuildArgs['entityKey']): string {
  const raw =
    entityKey === 'loading-schedules'
      ? row.scheduled_date
      : row.arrival_date
  return raw ? formatDate(String(raw)) : '—'
}

function qtyValue(row: DistributionRow, entityKey: BuildArgs['entityKey']): string {
  const raw =
    entityKey === 'loading-schedules' ? row.planned_quantity : row.quantity
  return formatQuantity(raw as number | string | undefined)
}

export function buildScheduleProfileColumns({
  profile,
  t,
  rows,
  page,
  perPage,
  entityKey,
}: Omit<BuildArgs, 'isLoading'>): Column<DistributionRow>[] {
  const perPageNum = Number(perPage) || 15

  const columnBuilders: Record<ScheduleColumnKey, Column<DistributionRow>> = {
    sn: {
      key: 'sn',
      header: t('S/N'),
      render: (_, row) => {
        const index = rows.findIndex((r) => r.id === row.id)
        return String((page - 1) * perPageNum + (index >= 0 ? index : 0) + 1)
      },
    },
    date: {
      key: 'date',
      header: t('Date'),
      sortable: entityKey === 'loading-schedules',
      render: (_, row) => dateValue(row, entityKey),
    },
    product: {
      key: 'product',
      header: t('Product'),
      render: (_, row) => {
        const product = row.product as { name?: string; image?: string | null } | undefined
        return (
          <TableProductAvatarCell image={product?.image} name={product?.name ?? '—'} />
        )
      },
    },
    source: {
      key: 'source',
      header: t('From location / source'),
      render: (_, row) => sourceLabel(row, entityKey),
    },
    qty: {
      key: 'qty',
      header: t('Qty'),
      render: (_, row) => qtyValue(row, entityKey),
    },
    truck_plate: {
      key: 'truck_plate',
      header: t('Truck plate number'),
      render: (_, row) => (
        <TableTruckAvatarCell
          avatar={(row.truck as { avatar?: string | null } | undefined)?.avatar}
          label={truckLabel(row.truck as Parameters<typeof truckLabel>[0], row.truck_id as number)}
        />
      ),
    },
    destination: {
      key: 'destination',
      header: t('Destination'),
      render: (_, row) => resolveScheduleDestination(row),
    },
    arrival_depot: {
      key: 'arrival_depot',
      header: t('Arrival depot'),
      render: (_, row) =>
        String(
          (row.receivingDepot as { name?: string })?.name ??
            (row.receiving_depot as { name?: string })?.name ??
            '—',
        ),
    },
    status: {
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => {
        const status = String(row.status ?? '')
        return (
          <FleetStatusBadge
            status={status}
            label={profile.statusLabels[status] ?? undefined}
          />
        )
      },
    },
  }

  return profile.columns.map((key) => columnBuilders[key])
}
