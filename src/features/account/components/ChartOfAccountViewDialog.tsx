import { Calculator } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/utils/helpers'
import {
  formatChartOfAccountNormalBalanceLabel,
  getChartOfAccountActiveBadgeClasses,
  getChartOfAccountNormalBalanceBadgeClasses,
} from '../chart-of-account-utils'
import type { ChartOfAccount } from '../chart-of-accounts-api'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: ChartOfAccount | null
}

export function ChartOfAccountViewDialog({ open, onOpenChange, account }: Props) {
  const { t } = useTranslation()

  if (!account) return null

  const fields: Array<{ label: string; value: string }> = [
    { label: t('Account Code'), value: account.account_code },
    { label: t('Account Name'), value: account.account_name },
    { label: t('Account Type'), value: account.account_type?.name ?? '—' },
    {
      label: t('Parent Account'),
      value: account.parent_account?.account_name ?? '—',
    },
    {
      label: t('Level'),
      value: account.level != null ? String(account.level) : '—',
    },
    {
      label: t('Opening Balance'),
      value: formatCurrency(Number(account.opening_balance ?? 0)),
    },
    {
      label: t('Current Balance'),
      value: formatCurrency(Number(account.current_balance ?? 0)),
    },
    { label: t('Description'), value: account.description || '—' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {t('Chart Of Account Details')}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {account.account_code} — {account.account_name}
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
            <label className="text-sm font-medium text-muted-foreground">{t('Normal Balance')}</label>
            <p>
              <span className={getChartOfAccountNormalBalanceBadgeClasses(account.normal_balance)}>
                {formatChartOfAccountNormalBalanceLabel(account.normal_balance, t)}
              </span>
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{t('Status')}</label>
            <p>
              <span className={getChartOfAccountActiveBadgeClasses(Boolean(account.is_active))}>
                {account.is_active ? t('Active') : t('Inactive')}
              </span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
