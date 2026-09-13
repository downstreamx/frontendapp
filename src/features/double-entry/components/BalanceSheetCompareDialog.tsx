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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BalanceSheetSummary } from '../balance-sheets-api'
import { formatDate } from '@/utils/helpers'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sheets: BalanceSheetSummary[]
  defaultCurrentId?: number
  onSubmit: (input: { current_period_id: number; previous_period_id: number }) => void
  isPending?: boolean
}

export function BalanceSheetCompareDialog({
  open,
  onOpenChange,
  sheets,
  defaultCurrentId,
  onSubmit,
  isPending,
}: Props) {
  const { t } = useTranslation()
  const finalized = sheets.filter((s) => s.status === 'finalized')
  const [currentId, setCurrentId] = useState(String(defaultCurrentId ?? ''))
  const [previousId, setPreviousId] = useState('')

  const handleSubmit = () => {
    const current = Number(currentId)
    const previous = Number(previousId)
    if (!current || !previous || current === previous) return
    onSubmit({ current_period_id: current, previous_period_id: previous })
  }

  const labelFor = (sheet: BalanceSheetSummary) =>
    `${formatDate(sheet.balance_sheet_date)} — ${t('FY')} ${sheet.financial_year}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Compare balance sheets')}</DialogTitle>
          <DialogDescription>
            {t('Select a current period and a finalized previous period to compare.')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t('Current period')}</Label>
            <Select value={currentId} onValueChange={setCurrentId}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select current period')} />
              </SelectTrigger>
              <SelectContent>
                {sheets.map((sheet) => (
                  <SelectItem key={sheet.id} value={String(sheet.id)}>
                    {labelFor(sheet)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('Previous period')}</Label>
            <Select value={previousId} onValueChange={setPreviousId}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select previous period')} />
              </SelectTrigger>
              <SelectContent>
                {finalized
                  .filter((sheet) => String(sheet.id) !== currentId)
                  .map((sheet) => (
                    <SelectItem key={sheet.id} value={String(sheet.id)}>
                      {labelFor(sheet)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !currentId || !previousId || currentId === previousId}
          >
            {isPending ? t('Comparing…') : t('Compare')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
