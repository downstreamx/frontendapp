import { CreditCard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/utils/helpers'
import {
  formatBankAccountType,
  getBankAccountActiveBadgeClasses,
} from '../bank-account-utils'
import type { BankAccount } from '../bank-accounts-api'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: BankAccount | null
}

export function BankAccountViewDialog({ open, onOpenChange, account }: Props) {
  const { t } = useTranslation()

  if (!account) return null

  const fields: Array<{ label: string; value: string }> = [
    { label: t('Account Number'), value: account.account_number },
    { label: t('Account Name'), value: account.account_name },
    { label: t('Bank Name'), value: account.bank_name },
    { label: t('Branch Name'), value: account.branch_name || '—' },
    {
      label: t('Account Type'),
      value: formatBankAccountType(account.account_type, t),
    },
    { label: t('Payment Gateway'), value: account.payment_gateway || '—' },
    {
      label: t('Opening Balance'),
      value: formatCurrency(Number(account.opening_balance ?? 0)),
    },
    {
      label: t('Current Balance'),
      value: formatCurrency(Number(account.current_balance ?? 0)),
    },
    { label: t('IBAN'), value: account.iban || '—' },
    { label: t('SWIFT Code'), value: account.swift_code || '—' },
    { label: t('Routing Number'), value: account.routing_number || '—' },
    {
      label: t('GL Account'),
      value: account.gl_account
        ? `${account.gl_account.account_code} — ${account.gl_account.account_name}`
        : '—',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {t('Bank Account Details')}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{account.account_name}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 p-1 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label} className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {field.label}
              </label>
              <p className="rounded bg-muted/50 p-2 text-sm">{field.value}</p>
            </div>
          ))}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{t('Status')}</label>
            <p>
              <span className={getBankAccountActiveBadgeClasses(Boolean(account.is_active))}>
                {account.is_active ? t('Active') : t('Inactive')}
              </span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
