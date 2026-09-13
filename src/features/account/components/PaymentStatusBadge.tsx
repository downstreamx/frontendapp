import { Badge } from '@/components/ui/badge'

type Variant = 'default' | 'secondary' | 'destructive' | 'outline'

function variantForStatus(status: string): Variant {
  if (status === 'cleared') return 'default'
  if (status === 'pending') return 'secondary'
  if (status === 'cancelled' || status === 'voided') return 'destructive'
  return 'outline'
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={variantForStatus(status)} className="capitalize">
      {status}
    </Badge>
  )
}
