import { useTranslation } from 'react-i18next'

export function DashboardLoading() {
  const { t } = useTranslation()
  return <p className="text-sm text-muted-foreground">{t('Loading dashboard…')}</p>
}

export function DashboardError({ message }: { message?: string }) {
  const { t } = useTranslation()
  return (
    <p className="text-sm text-destructive">{message ?? t('Could not load dashboard.')}</p>
  )
}
