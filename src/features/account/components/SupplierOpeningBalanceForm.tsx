import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiErrorMessage } from '@/lib/errors'
import { patchSupplierOpeningBalance } from '../account-customer-limits-api'

type Props = {
  supplierId: number
  openingBalanceDebit?: number
  openingBalanceCredit?: number
  openingBalanceAsOf?: string | null
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function SupplierOpeningBalanceForm({
  supplierId,
  openingBalanceDebit = 0,
  openingBalanceCredit = 0,
  openingBalanceAsOf,
}: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [debit, setDebit] = useState(String(openingBalanceDebit))
  const [credit, setCredit] = useState(String(openingBalanceCredit))
  const [asOf, setAsOf] = useState(openingBalanceAsOf?.slice(0, 10) ?? todayIso())

  const mutation = useMutation({
    mutationFn: () =>
      patchSupplierOpeningBalance(supplierId, {
        opening_balance_debit: Number(debit) || 0,
        opening_balance_credit: Number(credit) || 0,
        opening_balance_as_of: asOf,
      }),
    onSuccess: () => {
      toast.success(t('Opening balance updated.'))
      void queryClient.invalidateQueries({ queryKey: ['account', 'suppliers', String(supplierId)] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to update opening balance'))),
  })

  return (
    <form
      className="grid gap-4 md:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault()
        mutation.mutate()
      }}
    >
      <div className="space-y-2">
        <Label>{t('Opening balance debit')}</Label>
        <Input type="number" min="0" step="0.01" value={debit} onChange={(e) => setDebit(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>{t('Opening balance credit')}</Label>
        <Input type="number" min="0" step="0.01" value={credit} onChange={(e) => setCredit(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>{t('As of date')}</Label>
        <Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
      </div>
      <div className="flex items-end">
        <Button type="submit" size="sm" disabled={mutation.isPending}>
          {mutation.isPending ? t('Saving...') : t('Save opening balance')}
        </Button>
      </div>
    </form>
  )
}
