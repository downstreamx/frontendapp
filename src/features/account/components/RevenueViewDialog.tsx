import { DollarSign } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/utils/helpers'
import {
  formatRevenueStatusLabel,
  getRevenueStatusBadgeClasses,
} from '../revenue-utils'
import type { Revenue } from '../revenues-api'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  revenue: Revenue | null
}

export function RevenueViewDialog({ open, onOpenChange, revenue }: Props) {
  const { t } = useTranslation()

  if (!revenue) return null

  const fields: Array<{ label: string; value: string }> = [
    { label: t('Revenue Number'), value: revenue.revenue_number ?? `#${revenue.id}` },
    { label: t('Revenue Date'), value: formatDate(revenue.revenue_date) },
    { label: t('Category'), value: revenue.category?.category_name ?? '—' },
    { label: t('Bank Account'), value: revenue.bank_account?.account_name ?? '—' },
    {
      label: t('Chart of Account'),
      value: revenue.chart_of_account
        ? `${revenue.chart_of_account.account_code} — ${revenue.chart_of_account.account_name}`
        : '—',
    },
    { label: t('Amount'), value: formatCurrency(Number(revenue.amount)) },
    { label: t('Reference Number'), value: revenue.reference_number || '—' },
    { label: t('Description'), value: revenue.description || '—' },
    { label: t('Approved By'), value: revenue.approved_by_user?.name ?? '—' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">{t('Revenue Details')}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {revenue.revenue_number ?? `#${revenue.id}`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 p-1 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label} className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{field.label}</label>
              <p className="rounded bg-muted/50 p-2 text-sm">{field.value}</p>
            </div>
          ))}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{t('Status')}</label>
            <p>
              <span className={getRevenueStatusBadgeClasses(revenue.status)}>
                {formatRevenueStatusLabel(revenue.status, t)}
              </span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
