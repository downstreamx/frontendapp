import { ExternalLink, Receipt } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAppContext } from '@/contexts/app-context'
import { resolveMediaUrl } from '@/features/media/media-url'
import { formatCurrency, formatDate } from '@/utils/helpers'
import {
  formatExpenseStatusLabel,
  getExpenseStatusBadgeClasses,
} from '../expense-utils'
import type { Expense } from '../expenses-api'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: Expense | null
}

export function ExpenseViewDialog({ open, onOpenChange, expense }: Props) {
  const { t } = useTranslation()
  const { imageUrlPrefix } = useAppContext()

  if (!expense) return null

  const attachmentUrl = expense.attachment
    ? resolveMediaUrl(expense.attachment, imageUrlPrefix)
    : null

  const fields: Array<{ label: string; value: string }> = [
    { label: t('Expense Number'), value: expense.expense_number ?? `#${expense.id}` },
    { label: t('Expense Date'), value: formatDate(expense.expense_date) },
    { label: t('Category'), value: expense.category?.category_name ?? '—' },
    { label: t('Bank Account'), value: expense.bank_account?.account_name ?? '—' },
    {
      label: t('Chart of Account'),
      value: expense.chart_of_account
        ? `${expense.chart_of_account.account_code} — ${expense.chart_of_account.account_name}`
        : '—',
    },
    { label: t('Amount'), value: formatCurrency(Number(expense.amount)) },
    { label: t('Reference Number'), value: expense.reference_number || '—' },
    { label: t('Description'), value: expense.description || '—' },
    { label: t('Approved By'), value: expense.approved_by_user?.name ?? '—' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">{t('Expense Details')}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {expense.expense_number ?? `#${expense.id}`}
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
              <span className={getExpenseStatusBadgeClasses(expense.status)}>
                {formatExpenseStatusLabel(expense.status, t)}
              </span>
            </p>
          </div>
          {attachmentUrl ? (
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t('Receipt attachment')}
              </label>
              <Button variant="outline" size="sm" asChild>
                <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t('View receipt')}
                </a>
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
