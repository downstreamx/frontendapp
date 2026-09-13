import { useTranslation } from 'react-i18next'
import { FleetProviderListPage } from '../components/FleetProviderListPage'

export function TruckProvidersIndexPage() {
  const { t } = useTranslation()

  return (
    <FleetProviderListPage
      kind="truck"
      title={t('Truck Providers')}
      breadcrumb={t('Truck Providers')}
    />
  )
}
