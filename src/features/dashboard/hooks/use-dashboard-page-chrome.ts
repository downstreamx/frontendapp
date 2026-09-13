import { useTranslation } from 'react-i18next'
import { usePageChrome } from '@/contexts/page-chrome-context'

export function useDashboardPageChrome(pageTitle: string, section?: string) {
  const { t } = useTranslation()
  usePageChrome({
    pageTitle,
    breadcrumbs: section ? [{ label: t('Dashboard') }, { label: section }] : [{ label: pageTitle }],
  })
}
