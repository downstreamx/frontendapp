import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { truckLabel } from '@/features/shared/lib/entity-labels'
import type { TruckLocationRow } from '../fleet-api'
import { SingleTruckMap } from './fleet-leaflet-map'

type Props = {
  location: TruckLocationRow | null
  onOpenChange: (open: boolean) => void
}

function toCoordinate(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function TruckLocationMapDialog({ location, onOpenChange }: Props) {
  const { t } = useTranslation()

  const latitude = location ? toCoordinate(location.latitude) : null
  const longitude = location ? toCoordinate(location.longitude) : null
  const hasCoordinates = latitude != null && longitude != null

  const externalUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : null

  return (
    <Dialog open={Boolean(location)} onOpenChange={onOpenChange}>
      <DialogContent className="z-[100] max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Truck location')}</DialogTitle>
          <DialogDescription>
            {location
              ? truckLabel(location.truck, location.truck_id)
              : t('GPS coordinates for the selected truck location.')}
          </DialogDescription>
        </DialogHeader>

        {hasCoordinates ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t('Latitude')}</p>
                <p className="font-medium">{latitude.toFixed(5)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('Longitude')}</p>
                <p className="font-medium">{longitude.toFixed(5)}</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-md border">
              <SingleTruckMap latitude={latitude} longitude={longitude} className="h-[320px]" />
            </div>
            {externalUrl ? (
              <Button variant="outline" size="sm" asChild>
                <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t('Open in Google Maps')}
                </a>
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('No GPS coordinates available.')}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
