import { useTranslation } from 'react-i18next'
import { usePageChrome } from '@/contexts/page-chrome-context'

export function useFleetPageChrome(pageTitle: string) {
  const { t } = useTranslation()

  usePageChrome({
    pageTitle,
    breadcrumbs: [{ label: t('Fleet') }, { label: pageTitle }],
  })
}
