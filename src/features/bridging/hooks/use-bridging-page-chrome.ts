import { useTranslation } from 'react-i18next'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'

export function useBridgingPageChrome(pageTitle: string, sectionLabel?: string) {
  const { t } = useTranslation()

  usePageChrome({
    pageTitle,
    breadcrumbs: [
      { label: t('Distributed Trucks'), url: paths.bridging.index },
      ...(sectionLabel ? [{ label: sectionLabel }] : []),
    ],
  })
}
