import { useTranslation } from 'react-i18next'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import { StatusPage } from '@/components/status-page'
import { CircleAlert } from 'lucide-react'

export function DashboardLoading() {
  const { t } = useTranslation()
  return <PageContentLoader label={t('Loading dashboard…')} />
}

export function DashboardError({ message }: { message?: string }) {
  const { t } = useTranslation()
  return (
    <StatusPage
      icon={CircleAlert}
      title={t('Could not load dashboard.')}
      description={message}
      className="min-h-[16rem]"
    />
  )
}
