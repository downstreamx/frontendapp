import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { paths } from '@/lib/paths'
import { fetchAssetDashboard } from '../asset-management-api'
import { usePageChrome } from '@/contexts/page-chrome-context'

export function AssetManagementDashboardPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['asset-management', 'dashboard'],
    queryFn: fetchAssetDashboard,
  })

  usePageChrome(t('Dashboard'), t('Assets'))

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to={paths.assetManagement.assets}>{t('Assets')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={paths.assetManagement.maintenanceOrders}>{t('Maintenance orders')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={paths.assetManagement.reports}>{t('Reports')}</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('Loading...')}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('Total assets')}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{data?.total_assets ?? 0}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('Open maintenance')}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {data?.open_maintenance_orders ?? 0}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('Overdue plans')}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-destructive">
              {data?.overdue_maintenance_plans ?? 0}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('Active')}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {data?.by_status?.active ?? 0}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
