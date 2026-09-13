import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { cn } from '@/lib/utils'
import 'leaflet/dist/leaflet.css'

export const FLEET_MAP_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
export const FLEET_MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

/** Keeps Leaflet layers below app modals (Radix dialog uses z-50). */
export const FLEET_MAP_LAYER_CLASS =
  '[&_.leaflet-pane]:!z-[1] [&_.leaflet-marker-pane]:!z-[2] [&_.leaflet-popup-pane]:!z-[3] [&_.leaflet-control]:!z-[4]'

export function truckMarkerIcon(selected: boolean): L.DivIcon {
  const fill = selected ? '#2563eb' : '#ef4444'
  const stroke = selected ? '#1d4ed8' : '#b91c1c'

  return L.divIcon({
    className: 'truck-location-marker',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="${fill}" stroke="${stroke}" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5" fill="white"/>
    </svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  })
}

export function FitTruckBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  const pointsKey = points.map((p) => p.join(',')).join('|')

  useEffect(() => {
    if (points.length === 0) return

    if (points.length === 1) {
      map.setView(points[0], 14)
      return
    }

    const bounds = L.latLngBounds(points)
    if (bounds.getNorth() === bounds.getSouth() && bounds.getEast() === bounds.getWest()) {
      map.setView(bounds.getCenter(), 14)
      return
    }

    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 })
  }, [map, pointsKey, points])

  return null
}

function InvalidateMapSize() {
  const map = useMap()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize()
    }, 100)

    return () => window.clearTimeout(timer)
  }, [map])

  return null
}

type SingleTruckMapProps = {
  latitude: number
  longitude: number
  className?: string
}

export function SingleTruckMap({ latitude, longitude, className }: SingleTruckMapProps) {
  const center = useMemo(() => [latitude, longitude] as [number, number], [latitude, longitude])

  return (
    <div className={cn('relative isolate z-0 overflow-hidden rounded-md', FLEET_MAP_LAYER_CLASS, className)}>
      <MapContainer
        key={`${latitude},${longitude}`}
        center={center}
        zoom={14}
        className="h-full min-h-[280px] w-full"
        scrollWheelZoom
      >
        <TileLayer attribution={FLEET_MAP_TILE_ATTRIBUTION} url={FLEET_MAP_TILE_URL} />
        <InvalidateMapSize />
        <Marker position={center} icon={truckMarkerIcon(false)} />
      </MapContainer>
    </div>
  )
}
