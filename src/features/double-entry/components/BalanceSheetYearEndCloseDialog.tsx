import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: { financial_year: string; closing_date: string }) => void
  isPending?: boolean
}

export function BalanceSheetYearEndCloseDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: Props) {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()
  const [financialYear, setFinancialYear] = useState(String(currentYear))
  const [closingDate, setClosingDate] = useState(`${currentYear}-12-31`)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!financialYear.trim() || !closingDate) return
    onSubmit({ financial_year: financialYear.trim(), closing_date: closingDate })
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('Year-end close')}</DialogTitle>
          <DialogDescription>
            {t('Close revenue and expense accounts and roll balances into the next financial year.')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="yec-financial-year">{t('Financial year to close')}</Label>
            <Input
              id="yec-financial-year"
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              placeholder={t('e.g., 2024')}
              maxLength={4}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yec-closing-date">{t('Closing date')}</Label>
            <Input
              id="yec-closing-date"
              type="date"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              required
            />
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h4 className="mb-2 font-medium text-yellow-900">{t('Warning')}</h4>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• {t('This will close all revenue and expense accounts')}</li>
              <li>• {t('Net income will be transferred to retained earnings')}</li>
              <li>• {t('Opening balances will be created for next year')}</li>
              <li>• {t('This action cannot be undone')}</li>
            </ul>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('Cancel')}
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? t('Closing…') : t('Close year')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
