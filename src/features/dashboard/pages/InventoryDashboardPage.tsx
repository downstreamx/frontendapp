import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Boxes, Layers, Package, PackageX } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardChartLegend } from '../components/DashboardChartLegend'
import { DashboardMetricCard } from '../components/DashboardMetricCard'
import { DashboardQuickLinks } from '../components/DashboardQuickLinks'
import { DashboardError, DashboardLoading } from '../components/DashboardLoading'
import { useDashboardPageChrome } from '../hooks/use-dashboard-page-chrome'
import { fetchInventoryDashboard } from '../dashboard-api'
import { paths } from '@/lib/paths'
import { formatQuantity } from '@/lib/format-quantity'
import { formatCurrency } from '@/utils/helpers'

export function InventoryDashboardPage() {
  const { t } = useTranslation()
  useDashboardPageChrome(t('Inventory Dashboard'), t('Inventory'))

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'inventory'],
    queryFn: fetchInventoryDashboard,
  })

  if (isLoading) return <DashboardLoading />
  if (error || !data) return <DashboardError message={t('Could not load inventory dashboard.')} />

  const stats = data.stats

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardMetricCard
          title={t('Total products')}
          value={stats.total_products ?? 0}
          variant="blue"
          icon={Package}
          href={paths.inventory.products}
        />
        <DashboardMetricCard
          title={t('Active products')}
          value={stats.active_products ?? 0}
          variant="green"
          icon={Package}
        />
        <DashboardMetricCard
          title={t('Inactive products')}
          value={stats.inactive_products ?? 0}
          variant="orange"
          icon={PackageX}
        />
        <DashboardMetricCard
          title={t('Categories')}
          value={stats.total_categories ?? 0}
          variant="purple"
          icon={Layers}
          href={paths.inventory.categories}
        />
        <DashboardMetricCard
          title={t('Low stock items')}
          value={stats.low_stock_items ?? 0}
          variant="red"
          icon={Boxes}
          href={paths.inventory.reorderLevels}
        />
        <DashboardMetricCard
          title={t('Total stock quantity')}
          value={stats.total_stock_quantity ?? 0}
          variant="teal"
          href={paths.inventory.stock}
        />
      </div>

      <DashboardQuickLinks
        links={[
          { label: t('Products'), href: paths.inventory.products },
          { label: t('Stock levels'), href: paths.inventory.stock },
          { label: t('Reorder levels'), href: paths.inventory.reorderLevels },
          { label: t('Categories'), href: paths.inventory.categories },
          { label: t('System setup'), href: paths.inventory.systemSetup },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Products by category')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChartLegend items={data.category_breakdown} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Low stock alerts')}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.low_stock.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('No low stock items.')}</p>
            ) : (
              <ul className="divide-y text-sm">
                {data.low_stock.map((row, i) => (
                  <li key={i} className="flex justify-between gap-2 py-2">
                    <span>
                      {row.product} {row.sku ? `(${row.sku})` : ''} @ {row.depot}
                    </span>
                    <span className="tabular-nums font-medium">
                      {formatQuantity(row.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Recently added products')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {data.recent_products.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-2 py-2">
                <Link
                  to={paths.inventory.productShow(product.id)}
                  className="font-medium text-primary hover:underline"
                >
                  {product.name}
                  {product.sku ? ` (${product.sku})` : ''}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums text-muted-foreground">
                    {formatCurrency(product.sale_price)}
                  </span>
                  <Badge variant={product.is_active ? 'default' : 'secondary'}>
                    {product.is_active ? t('Active') : t('Inactive')}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
