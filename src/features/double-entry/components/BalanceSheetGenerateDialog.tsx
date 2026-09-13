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
  onSubmit: (input: { balance_sheet_date: string; financial_year: string }) => void
  isPending?: boolean
}

export function BalanceSheetGenerateDialog({ open, onOpenChange, onSubmit, isPending }: Props) {
  const { t } = useTranslation()
  const today = new Date().toISOString().slice(0, 10)
  const [asOf, setAsOf] = useState(today)
  const [financialYear, setFinancialYear] = useState(String(new Date().getFullYear()))

  const handleSubmit = () => {
    if (!asOf || !financialYear.trim()) return
    onSubmit({ balance_sheet_date: asOf, financial_year: financialYear.trim() })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Generate balance sheet')}</DialogTitle>
          <DialogDescription>
            {t('Create a balance sheet snapshot as of the selected date.')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="bs-as-of">{t('As of date')}</Label>
            <Input
              id="bs-as-of"
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bs-fy">{t('Financial year')}</Label>
            <Input
              id="bs-fy"
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending || !asOf || !financialYear}>
            {isPending ? t('Generating…') : t('Generate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
