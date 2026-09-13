import { useTranslation } from 'react-i18next'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'

export function useSalesPageChrome(
  pageTitle: string,
  sectionLabel?: string,
  options?: { centerPageTitle?: boolean },
) {
  const { t } = useTranslation()

  usePageChrome({
    pageTitle,
    centerPageTitle: options?.centerPageTitle,
    breadcrumbs: [
      { label: t('Sales'), url: paths.sales.invoices },
      ...(sectionLabel ? [{ label: sectionLabel }] : []),
    ],
  })
}
