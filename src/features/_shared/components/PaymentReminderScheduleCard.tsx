import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Bell, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/errors'

export type PaymentReminderSchedule = {
  enabled: boolean
  advance_days: number[]
  send_on_due_date: boolean
  company_reminders_enabled?: boolean
}

type Props = {
  title: string
  description: string
  settings: PaymentReminderSchedule | undefined
  isLoading?: boolean
  canEdit: boolean
  companyMode?: boolean
  partyHintWhenCompanyOff?: string
  onSave: (payload: PaymentReminderSchedule) => Promise<PaymentReminderSchedule>
  onSaved?: () => void
  className?: string
}

function parseAdvanceDays(one: string, two: string, t: (key: string) => string): number[] | null {
  const days = [one, two]
    .map((value) => parseInt(value, 10))
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 90)
  const uniqueDays = [...new Set(days)].sort((a, b) => b - a)
  if (uniqueDays.length === 0) {
    toast.error(t('Enter at least one valid number of days before due date.'))
    return null
  }
  return uniqueDays
}

export function PaymentReminderScheduleCard({
  title,
  description,
  settings,
  isLoading,
  canEdit,
  companyMode = false,
  partyHintWhenCompanyOff,
  onSave,
  onSaved,
  className,
}: Props) {
  const { t } = useTranslation()
  const [enabled, setEnabled] = useState(true)
  const [advanceDayOne, setAdvanceDayOne] = useState('5')
  const [advanceDayTwo, setAdvanceDayTwo] = useState('3')
  const [sendOnDueDate, setSendOnDueDate] = useState(true)

  useEffect(() => {
    if (!settings) return
    const days = [...settings.advance_days].sort((a, b) => b - a)
    setEnabled(settings.enabled)
    setAdvanceDayOne(days[0] != null ? String(days[0]) : '')
    setAdvanceDayTwo(days[1] != null ? String(days[1]) : '')
    setSendOnDueDate(settings.send_on_due_date)
  }, [settings])

  const saveMutation = useMutation({
    mutationFn: onSave,
    onSuccess: () => {
      toast.success(t('Payment reminder schedule saved.'))
      onSaved?.()
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, t('Failed to save payment reminder schedule'))),
  })

  const handleSave = () => {
    const advance_days = parseAdvanceDays(advanceDayOne, advanceDayTwo, t)
    if (advance_days == null) return
    saveMutation.mutate({
      enabled,
      advance_days,
      send_on_due_date: sendOnDueDate,
    })
  }

  const companyRemindersOn = settings?.company_reminders_enabled === true
  const showPartyHint = !companyMode && !companyRemindersOn

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showPartyHint && partyHintWhenCompanyOff ? (
          <Alert>
            <AlertDescription>{partyHintWhenCompanyOff}</AlertDescription>
          </Alert>
        ) : null}

        {companyMode ? (
          <Alert>
            <AlertDescription>
              {enabled
                ? t(
                    'When enabled, one schedule applies company-wide. Individual profiles can still turn reminders off.',
                  )
                : t(
                    'When disabled, each customer or supplier profile controls whether and when reminders are sent.',
                  )}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">
              {companyMode ? t('Enable company-wide reminders') : t('Enable payment reminders')}
            </p>
            <p className="text-sm text-muted-foreground">
              {companyMode
                ? t('Apply one reminder schedule to all customers.')
                : t('Send payment reminder emails for this customer’s open invoices.')}
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={!canEdit || isLoading}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`advance-day-one-${title}`}>
              {t('First reminder (days before due)')}
            </Label>
            <Input
              id={`advance-day-one-${title}`}
              type="number"
              min={1}
              max={90}
              value={advanceDayOne}
              onChange={(e) => setAdvanceDayOne(e.target.value)}
              disabled={!canEdit || isLoading}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor={`advance-day-two-${title}`}>
              {t('Second reminder (days before due)')}
            </Label>
            <Input
              id={`advance-day-two-${title}`}
              type="number"
              min={1}
              max={90}
              value={advanceDayTwo}
              onChange={(e) => setAdvanceDayTwo(e.target.value)}
              disabled={!canEdit || isLoading}
              className="mt-2"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">{t('Reminder on due date')}</p>
            <p className="text-sm text-muted-foreground">
              {t('Send a payment reminder when the invoice due date is today.')}
            </p>
          </div>
          <Switch
            checked={sendOnDueDate}
            onCheckedChange={setSendOnDueDate}
            disabled={!canEdit || isLoading}
          />
        </div>

        {canEdit ? (
          <Button type="button" onClick={handleSave} disabled={saveMutation.isPending || isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {t('Save')}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
