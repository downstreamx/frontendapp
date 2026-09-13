import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, Package, Receipt, Wallet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { paths } from '@/lib/paths'
import { getSubscription } from '@/features/saas/saas-api'

const links = [
  {
    title: 'Subscription',
    description: 'Current plan, checkout, and payment methods',
    href: paths.subscription,
    icon: CreditCard,
  },
  {
    title: 'Plans',
    description: 'Manage subscription plans and included modules',
    href: paths.plans,
    icon: Package,
  },
  {
    title: 'Orders',
    description: 'Billing orders and payment status',
    href: paths.orders,
    icon: Receipt,
  },
  {
    title: 'Bank transfers',
    description: 'Pending and completed bank transfer payments',
    href: paths.bankTransfer,
    icon: Wallet,
  },
  {
    title: 'Modules',
    description: 'Activate or deactivate Workdo modules',
    href: paths.modules,
    icon: Package,
  },
  {
    title: 'Coupons',
    description: 'Discount codes for subscription checkout',
    href: paths.coupons,
    icon: Receipt,
  },
]

export function BillingOverviewPage() {
  const subscriptionQuery = useQuery({ queryKey: ['saas', 'subscription'], queryFn: getSubscription })
  const sub = subscriptionQuery.data

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Billing & SaaS</CardTitle>
          <CardDescription>Manage subscriptions, plans, orders, and payment methods.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>
            Status: <span className="font-medium">{sub?.active ? 'Active' : 'Inactive'}</span>
          </p>
          {sub?.plan ? (
            <p>
              Plan: <span className="font-medium">{sub.plan.name}</span>
              {sub.plan.package_price_monthly != null ? ` · $${sub.plan.package_price_monthly}/mo` : ''}
            </p>
          ) : (
            <p className="text-muted-foreground">No plan assigned.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => (
          <Link key={item.href} to={item.href} className="block">
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
