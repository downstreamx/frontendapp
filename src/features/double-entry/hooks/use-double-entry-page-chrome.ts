import { useTranslation } from 'react-i18next'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'

export function useDoubleEntryPageChrome(pageTitle: string, sectionLabel?: string) {
  const { t } = useTranslation()

  usePageChrome({
    pageTitle,
    breadcrumbs: [
      { label: t('Double entry'), url: paths.doubleEntry.reports },
      ...(sectionLabel ? [{ label: sectionLabel }] : []),
    ],
  })
}
