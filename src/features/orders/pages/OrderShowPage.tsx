import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { paths } from '@/lib/paths'
import { getOrder } from '@/features/saas/saas-api'

export function OrderShowPage() {
  const { id } = useParams<{ id: string }>()

  const { data: order, isLoading } = useQuery({
    queryKey: ['saas', 'order', id],
    queryFn: () => getOrder(id!),
    enabled: Boolean(id),
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{order?.order_id ?? 'Order'}</CardTitle>
        <Link to={paths.orders} className="text-sm text-primary hover:underline">
          Back to orders
        </Link>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {order && (
          <>
            <p>Plan: {order.plan?.name ?? order.plan_name ?? '—'}</p>
            <p>Customer: {order.name ?? '—'}</p>
            <p>Email: {order.email ?? '—'}</p>
            <p>Price: {order.price != null ? `$${order.price}` : '—'}</p>
            <p>Payment: {order.payment_status ?? 'pending'}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
