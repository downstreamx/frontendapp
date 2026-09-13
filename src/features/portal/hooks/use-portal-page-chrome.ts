import { useTranslation } from 'react-i18next'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'

export function usePortalPageChrome(pageTitle: string, section?: string) {
  const { t } = useTranslation()
  usePageChrome({
    pageTitle,
    breadcrumbs: section
      ? [{ label: t('Portal'), url: paths.portal.dashboard }, { label: section }]
      : [{ label: t('Portal'), url: paths.portal.dashboard }, { label: pageTitle }],
  })
}
