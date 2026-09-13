import { useTranslation } from 'react-i18next'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'

export function usePurchasePageChrome(
  pageTitle: string,
  sectionLabel?: string,
  options?: { centerPageTitle?: boolean },
) {
  const { t } = useTranslation()

  usePageChrome({
    pageTitle,
    centerPageTitle: options?.centerPageTitle,
    breadcrumbs: [
      { label: t('Purchase'), url: paths.purchase.invoices },
      ...(sectionLabel ? [{ label: sectionLabel }] : []),
    ],
  })
}
