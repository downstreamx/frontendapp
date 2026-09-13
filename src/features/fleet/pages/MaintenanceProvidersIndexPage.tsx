import { useTranslation } from 'react-i18next'
import { FleetProviderListPage } from '../components/FleetProviderListPage'

export function MaintenanceProvidersIndexPage() {
  const { t } = useTranslation()

  return (
    <FleetProviderListPage
      kind="maintenance"
      title={t('Maintenance Providers')}
      breadcrumb={t('Maintenance Providers')}
    />
  )
}
