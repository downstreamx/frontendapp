import { useTranslation } from 'react-i18next'
import {
  truckOperationalStatusBadgeClass,
  truckOperationalStatusLabel,
} from '../truck-operational-status-ui'

type Props = {
  status?: string | null
}

export function TruckOperationalStatusBadge({ status }: Props) {
  const { t } = useTranslation()
  if (!status) return <span className="text-muted-foreground">—</span>

  return (
    <span className={truckOperationalStatusBadgeClass(status)}>
      {truckOperationalStatusLabel(status, t)}
    </span>
  )
}
