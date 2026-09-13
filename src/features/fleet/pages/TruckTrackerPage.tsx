import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { EntitySelect } from '@/components/forms/entity-select'
import { toTruckLookupOptions } from '@/features/_shared/operations-lookups'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TruckOperationalStatusBadge } from '../components/TruckOperationalStatusBadge'
import {
  TRUCK_OPERATIONAL_STATUSES,
  truckOperationalStatusLabel,
} from '../truck-operational-status-ui'
import { paths } from '@/lib/paths'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { getApiErrorMessage } from '@/lib/errors'
import { formatDate } from '@/utils/helpers'
import { truckLabel } from '@/features/shared/lib/entity-labels'
import {
  createTruckLocation,
  fetchTruckLocationsIndexMeta,
  listTruckLocationsPaginated,
  type TruckLocationRow,
} from '../fleet-api'
import { TruckLocationMapDialog } from '../components/TruckLocationMapDialog'
import { TruckLocationsLiveMap } from '../components/TruckLocationsLiveMap'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { TableTruckAvatarCell } from '@/features/shared/components/table-avatar-cells'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'

function hasCoordinates(row: TruckLocationRow): boolean {
  const lat = row.latitude != null ? Number(row.latitude) : NaN
  const lng = row.longitude != null ? Number(row.longitude) : NaN
  return Number.isFinite(lat) && Number.isFinite(lng)
}

function canAccessFleet(auth: ReturnType<typeof useAppContext>['auth']) {
  return (
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-fleet') ||
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-trucks')
  )
}

export function TruckTrackerPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [truckId, setTruckId] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<TruckLocationRow | null>(null)
  const [operationalStatusFilter, setOperationalStatusFilter] = useState('')

  const canManage = canAccessFleet(auth)

  usePageChrome({
    pageTitle: t('Truck Tracker'),
    breadcrumbs: [{ label: t('Fleet') }, { label: t('Truck Tracker') }],
  })

  const { data: indexMeta } = useQuery({
    queryKey: ['fleet', 'truck-locations', 'index-meta'],
    queryFn: fetchTruckLocationsIndexMeta,
    enabled: canManage,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['fleet', 'truck-locations', 'latest'],
    queryFn: () =>
      listTruckLocationsPaginated({
        latest_only: '1',
        per_page: '100',
      }),
    enabled: canManage,
  })

  const truckOptions = useMemo(
    () => toTruckLookupOptions(indexMeta?.trucks ?? []),
    [indexMeta?.trucks],
  )

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'fleet.truck-locations.destroy',
      defaultMessage: t('Are you sure you want to delete this truck location?'),
      onSuccess: () => {
        toast.success(t('Location deleted'))
        void queryClient.invalidateQueries({ queryKey: ['fleet', 'truck-locations'] })
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete location'))),
    })

  const createMutation = useMutation({
    mutationFn: createTruckLocation,
    onSuccess: () => {
      toast.success(t('Location recorded'))
      void queryClient.invalidateQueries({ queryKey: ['fleet', 'truck-locations'] })
      setTruckId('')
      setLatitude('')
      setLongitude('')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to record location'))),
  })

  const allRows = data?.rows ?? []

  const rows = useMemo(() => {
    if (!operationalStatusFilter) return allRows
    return allRows.filter((row) => row.truck?.operational_status === operationalStatusFilter)
  }, [allRows, operationalStatusFilter])

  const columns: Column<TruckLocationRow>[] = [
    {
      key: 'truck_id',
      header: t('Truck'),
      render: (_, row) => (
        <div className="space-y-1">
          {row.truck_id ? (
            <Link
              to={paths.fleet.truckShow(row.truck_id)}
              className="inline-flex"
              onClick={(e) => e.stopPropagation()}
            >
              <TableTruckAvatarCell
                avatar={row.truck?.avatar}
                label={truckLabel(row.truck, row.truck_id)}
              />
            </Link>
          ) : (
            <TableTruckAvatarCell
              avatar={row.truck?.avatar}
              label={truckLabel(row.truck, row.truck_id)}
            />
          )}
          <TruckOperationalStatusBadge status={row.truck?.operational_status} />
        </div>
      ),
    },
    {
      key: 'latitude',
      header: t('Latitude'),
      render: (value) => (value != null ? Number(value).toFixed(5) : '—'),
    },
    {
      key: 'longitude',
      header: t('Longitude'),
      render: (value) => (value != null ? Number(value).toFixed(5) : '—'),
    },
    {
      key: 'recorded_at',
      header: t('Recorded'),
      render: (value) => (value ? formatDate(String(value)) : '—'),
    },
    {
      key: 'source',
      header: t('Source'),
      render: (value) => (value ? String(value) : '—'),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <div
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          role="presentation"
        >
          <TableRowActions
            onDelete={() => openDeleteDialog(row.id)}
            deletePermission="manage-fleet"
          />
        </div>
      ),
    },
  ]

  if (!canManage) {
    return <p className="text-sm text-muted-foreground">{t('Permission denied')}</p>
  }

  return (
    <div className="space-y-6">
      <TruckLocationMapDialog
        location={selectedLocation}
        onOpenChange={(open) => !open && setSelectedLocation(null)}
      />

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete truck location')}
        description={deleteState.message}
        confirmText={t('Delete')}
        onConfirm={async () => {
          const deletedId = deleteState.id
          await confirmDelete()
          if (deletedId != null) {
            setSelectedLocation((current) => (current?.id === deletedId ? null : current))
          }
        }}
        loading={isDeleting}
        variant="destructive"
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t('Live map')}
            </CardTitle>
            <CardDescription>
              {t('Latest recorded coordinates for each truck. Filter by downstream operational status.')}
            </CardDescription>
          </div>
          <div className="w-full space-y-1 sm:max-w-xs">
            <Label>{t('Operational status')}</Label>
            <Select
              value={operationalStatusFilter || 'all'}
              onValueChange={(value) => setOperationalStatusFilter(value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('All operational statuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All operational statuses')}</SelectItem>
                {TRUCK_OPERATIONAL_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {truckOperationalStatusLabel(status, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t('Loading...')}</p>
          ) : (
            <TruckLocationsLiveMap
              locations={rows}
              selectedId={selectedLocation?.id ?? null}
              onSelect={setSelectedLocation}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Record manual location')}</CardTitle>
          <CardDescription>
            {t('Update a truck’s GPS coordinates manually until live tracking is enabled.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate({
                truck_id: Number(truckId),
                latitude: Number(latitude),
                longitude: Number(longitude),
                source: 'manual',
              })
            }}
          >
            <div className="space-y-1 sm:col-span-2">
              <Label>{t('Truck')}</Label>
              <EntitySelect
                value={truckId}
                onValueChange={setTruckId}
                options={truckOptions}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>{t('Latitude')}</Label>
              <Input
                type="number"
                step="any"
                min="-90"
                max="90"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>{t('Longitude')}</Label>
              <Input
                type="number"
                step="any"
                min="-180"
                max="180"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {t('Save location')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Latest truck locations')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t('Loading...')}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('No locations recorded yet.')}</p>
          ) : (
            <DataTable
              columns={columns}
              data={rows}
              rowProps={(row) => ({
                className: cn(hasCoordinates(row) && 'cursor-pointer hover:bg-muted/50'),
                onClick: () => {
                  if (hasCoordinates(row)) {
                    setSelectedLocation(row)
                    return
                  }
                  toast.message(t('No GPS coordinates recorded for this location.'))
                },
              })}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
