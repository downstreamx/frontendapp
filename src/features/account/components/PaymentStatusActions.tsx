import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { updateCustomerPaymentStatus, updateSupplierPaymentStatus } from '../payments-api'
import { queryKeys } from '@/lib/query-keys'

type Props = {
  kind: 'customer' | 'supplier'
  id: number
  status: string
}

export function PaymentStatusActions({ kind, id, status }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (next: 'cleared' | 'cancelled') =>
      kind === 'customer' ? updateCustomerPaymentStatus(id, next) : updateSupplierPaymentStatus(id, next),
    onSuccess: () => {
      toast.success(t('Payment status updated'))
      queryClient.invalidateQueries({ queryKey: (kind === 'customer' ? queryKeys.account.payments.customer.detail(id) : queryKeys.account.payments.supplier.detail(id)) })
      queryClient.invalidateQueries({ queryKey: (kind === 'customer' ? queryKeys.account.payments.customer.all() : queryKeys.account.payments.supplier.all()) })
    },
    onError: () => toast.error(t('Failed to update status')),
  })

  if (status !== 'pending') {
    return null
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate('cleared')}
      >
        {t('Mark cleared')}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate('cancelled')}
      >
        {t('Cancel')}
      </Button>
    </div>
  )
}
