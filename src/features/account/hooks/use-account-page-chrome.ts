import { useTranslation } from 'react-i18next'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'

export function useAccountPageChrome(pageTitle: string, sectionLabel?: string) {
  const { t } = useTranslation()

  usePageChrome({
    pageTitle,
    breadcrumbs: [
      { label: t('Account'), url: paths.account.index },
      ...(sectionLabel ? [{ label: sectionLabel }] : []),
    ],
  })
}
