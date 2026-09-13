import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/utils/helpers'
import { DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react'

type SummaryCard = {
  label: string
  value: string
  icon: typeof DollarSign
  className: string
}

export function PosReportSummaryCards({ cards }: { cards: SummaryCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className={card.className}>
            <Icon className="absolute right-3 top-3 h-5 w-5 opacity-70" />
            <CardHeader className="pb-1 pt-4 text-center">
              <div className="text-2xl font-bold">{card.value}</div>
            </CardHeader>
            <CardContent className="pb-4 text-center">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function usePosCustomerSummaryCards(
  rows: Array<{ total_spent: number; order_count: number }>,
) {
  const { t } = useTranslation()
  const totalRevenue = rows.reduce((sum, r) => sum + Number(r.total_spent ?? 0), 0)
  const totalOrders = rows.reduce((sum, r) => sum + Number(r.order_count ?? 0), 0)
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const cards: SummaryCard[] = [
    {
      label: t('Total customers'),
      value: String(rows.length),
      icon: Users,
      className: 'relative overflow-hidden border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700',
    },
    {
      label: t('Total revenue'),
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      className: 'relative overflow-hidden border-green-200 bg-gradient-to-r from-green-50 to-green-100 text-green-700',
    },
    {
      label: t('Total orders'),
      value: String(totalOrders),
      icon: ShoppingCart,
      className: 'relative overflow-hidden border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700',
    },
    {
      label: t('Avg order'),
      value: formatCurrency(avgOrder),
      icon: TrendingUp,
      className: 'relative overflow-hidden border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700',
    },
  ]

  return cards
}

export function usePosProductSummaryCards(
  rows: Array<{ total_revenue: number; total_quantity: number; total_orders: number }>,
) {
  const { t } = useTranslation()
  const totalRevenue = rows.reduce((sum, r) => sum + Number(r.total_revenue ?? 0), 0)
  const totalQty = rows.reduce((sum, r) => sum + Number(r.total_quantity ?? 0), 0)
  const totalOrders = rows.reduce((sum, r) => sum + Number(r.total_orders ?? 0), 0)

  const cards: SummaryCard[] = [
    {
      label: t('Products tracked'),
      value: String(rows.length),
      icon: ShoppingCart,
      className: 'relative overflow-hidden border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700',
    },
    {
      label: t('Total revenue'),
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      className: 'relative overflow-hidden border-green-200 bg-gradient-to-r from-green-50 to-green-100 text-green-700',
    },
    {
      label: t('Units sold'),
      value: String(Math.round(totalQty)),
      icon: TrendingUp,
      className: 'relative overflow-hidden border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700',
    },
    {
      label: t('Line items'),
      value: String(totalOrders),
      icon: Users,
      className: 'relative overflow-hidden border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700',
    },
  ]

  return cards
}
