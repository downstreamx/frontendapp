import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { cn } from '@/lib/utils'
import { truckLabel } from '@/features/shared/lib/entity-labels'
import type { TruckLocationRow } from '../fleet-api'
import {
  FLEET_MAP_LAYER_CLASS,
  FLEET_MAP_TILE_ATTRIBUTION,
  FLEET_MAP_TILE_URL,
  FitTruckBounds,
  truckMarkerIcon,
} from './fleet-leaflet-map'

type Props = {
  locations: TruckLocationRow[]
  selectedId?: number | null
  onSelect?: (row: TruckLocationRow) => void
  className?: string
}

type PlottedLocation = {
  row: TruckLocationRow
  latitude: number
  longitude: number
}

const LIVE_MAP_HEIGHT_CLASS = 'h-[520px]'

function toCoordinate(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function hasCoordinates(row: TruckLocationRow): boolean {
  return toCoordinate(row.latitude) != null && toCoordinate(row.longitude) != null
}

function TruckLocationsMap({
  plotted,
  selectedId,
  onSelect,
}: {
  plotted: PlottedLocation[]
  selectedId?: number | null
  onSelect?: (row: TruckLocationRow) => void
}) {
  const positions = useMemo(
    () => plotted.map((p) => [p.latitude, p.longitude] as [number, number]),
    [plotted],
  )
  const defaultCenter = positions[0] ?? ([6.5244, 3.3792] as [number, number])

  return (
    <MapContainer
      center={defaultCenter}
      zoom={10}
      className={cn('w-full rounded-md', LIVE_MAP_HEIGHT_CLASS)}
      scrollWheelZoom
    >
      <TileLayer attribution={FLEET_MAP_TILE_ATTRIBUTION} url={FLEET_MAP_TILE_URL} />
      <FitTruckBounds points={positions} />
      {plotted.map((point) => (
        <Marker
          key={point.row.id}
          position={[point.latitude, point.longitude]}
          icon={truckMarkerIcon(selectedId === point.row.id)}
          eventHandlers={{
            click: (event) => {
              L.DomEvent.stopPropagation(event.originalEvent)
              onSelect?.(point.row)
            },
          }}
          title={truckLabel(point.row.truck, point.row.truck_id)}
        />
      ))}
    </MapContainer>
  )
}

export function TruckLocationsLiveMap({ locations, selectedId, onSelect, className }: Props) {
  const { t } = useTranslation()

  const plotted = useMemo(
    () =>
      locations
        .filter(hasCoordinates)
        .map((row) => ({
          row,
          latitude: toCoordinate(row.latitude)!,
          longitude: toCoordinate(row.longitude)!,
        })),
    [locations],
  )

  if (plotted.length === 0) {
    return (
      <div
        className={cn(
          'flex min-h-[200px] items-center justify-center rounded-md border border-dashed bg-muted/30 text-sm text-muted-foreground',
          className,
        )}
      >
        {t('No GPS coordinates recorded yet.')}
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'relative isolate z-0 overflow-hidden rounded-md border bg-muted/20',
          FLEET_MAP_LAYER_CLASS,
          '[&_.leaflet-control-attribution]:text-[10px]',
        )}
      >
        <TruckLocationsMap plotted={plotted} selectedId={selectedId} onSelect={onSelect} />
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {plotted.map(({ row, latitude, longitude }) => (
          <li key={row.id}>
            <button
              type="button"
              className={cn(
                'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50',
                selectedId === row.id && 'border-primary bg-primary/5',
              )}
              onClick={() => onSelect?.(row)}
            >
              <p className="font-medium">{truckLabel(row.truck, row.truck_id)}</p>
              <p className="text-muted-foreground">
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
