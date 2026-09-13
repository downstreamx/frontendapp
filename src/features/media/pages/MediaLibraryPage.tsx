import { useTranslation } from 'react-i18next'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { MediaLibraryCore } from '../components/MediaLibraryCore'

export function MediaLibraryPage() {
  const { t } = useTranslation()

  usePageChrome({
    pageTitle: t('Manage Media Library'),
    breadcrumbs: [{ label: t('Media Library') }],
  })

  return <MediaLibraryCore />
}
