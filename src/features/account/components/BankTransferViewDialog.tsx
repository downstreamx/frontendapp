import { ArrowLeftRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/utils/helpers'
import {
  formatBankTransferStatusLabel,
  getBankTransferStatusBadgeClasses,
} from '../bank-transfer-utils'
import type { BankTransfer } from '../bank-transfers-api'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transfer: BankTransfer | null
}

export function BankTransferViewDialog({ open, onOpenChange, transfer }: Props) {
  const { t } = useTranslation()

  if (!transfer) return null

  const fields: Array<{ label: string; value: string }> = [
    { label: t('Transfer Number'), value: transfer.transfer_number ?? `#${transfer.id}` },
    { label: t('Transfer Date'), value: transfer.transfer_date?.slice(0, 10) ?? '—' },
    {
      label: t('From Account'),
      value: transfer.from_account
        ? `${transfer.from_account.account_name}${transfer.from_account.account_number ? ` (${transfer.from_account.account_number})` : ''}`
        : '—',
    },
    {
      label: t('To Account'),
      value: transfer.to_account
        ? `${transfer.to_account.account_name}${transfer.to_account.account_number ? ` (${transfer.to_account.account_number})` : ''}`
        : '—',
    },
    {
      label: t('Transfer Amount'),
      value: formatCurrency(Number(transfer.transfer_amount ?? 0)),
    },
    {
      label: t('Transfer Charges'),
      value: formatCurrency(Number(transfer.transfer_charges ?? 0)),
    },
    { label: t('Reference Number'), value: transfer.reference_number || '—' },
    { label: t('Description'), value: transfer.description || '—' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {t('Bank Transfer Details')}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {transfer.transfer_number ?? `#${transfer.id}`}
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
              <span className={getBankTransferStatusBadgeClasses(transfer.status)}>
                {formatBankTransferStatusLabel(transfer.status, t)}
              </span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
