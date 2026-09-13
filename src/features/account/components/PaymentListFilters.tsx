import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'

type Props = {
  value: string
  onChange: (status: string) => void
}

export function PaymentListFilters({ value, onChange }: Props) {
  const { t } = useTranslation()

  return (
    <div className="max-w-xs">
      <Label htmlFor="payment-status-filter">{t('Status')}</Label>
      <select
        id="payment-status-filter"
        className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t('All')}</option>
        <option value="pending">{t('Pending')}</option>
        <option value="cleared">{t('Cleared')}</option>
        <option value="voided">{t('Voided')}</option>
        <option value="cancelled">{t('Cancelled')}</option>
      </select>
    </div>
  )
}
