import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

type Props = {
  fromDate: string
  toDate: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onRun: () => void
  isLoading?: boolean
  requireBoth?: boolean
}

export function DateRangeReportForm({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onRun,
  isLoading,
  requireBoth = true,
}: Props) {
  const { t } = useTranslation()
  const disabled = requireBoth ? !fromDate || !toDate : false

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="space-y-2">
        <Label htmlFor="from_date">{t('From')}</Label>
        <Input
          id="from_date"
          type="date"
          value={fromDate}
          onChange={(e) => onFromChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="to_date">{t('To')}</Label>
        <Input
          id="to_date"
          type="date"
          value={toDate}
          onChange={(e) => onToChange(e.target.value)}
        />
      </div>
      <Button type="button" onClick={onRun} disabled={disabled || isLoading}>
        {isLoading ? t('Loading…') : t('Run report')}
      </Button>
    </div>
  )
}
