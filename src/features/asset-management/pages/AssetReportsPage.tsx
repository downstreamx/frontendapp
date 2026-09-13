import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { fetchAssetRegisterReport } from '../asset-management-api'
import { usePageChrome } from '@/contexts/page-chrome-context'

export function AssetReportsPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['asset-register-report'],
    queryFn: () => fetchAssetRegisterReport(),
  })

  usePageChrome(t('Reports'), t('Assets'))

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'asset_tag', header: t('Tag') },
    { key: 'name', header: t('Name') },
    { key: 'status', header: t('Status') },
    { key: 'category', header: t('Category') },
    { key: 'depot', header: t('Depot') },
  ]

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('Asset register')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t('Loading...')}</p>
          ) : (
            <DataTable embedded data={(data?.rows ?? []) as Record<string, unknown>[]} columns={columns} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
