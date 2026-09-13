import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/utils/helpers'
import { formatShortDate } from '@/features/shared/lib/entity-labels'
import type { PayrollEntryRow, PayrollRow } from '../hrm-api'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: PayrollEntryRow | null
  payroll: PayrollRow | null
}

function BreakdownList({
  title,
  items,
}: {
  title: string
  items: Record<string, number> | undefined
}) {
  const { t } = useTranslation()
  const entries = Object.entries(items ?? {})

  if (!entries.length) return null

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="space-y-1 text-sm">
        {entries.map(([name, amount]) => (
          <li key={name} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{name}</span>
            <span>{formatCurrency(Number(amount))}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PayslipDialog({ open, onOpenChange, entry, payroll }: Props) {
  const { t } = useTranslation()

  if (!entry || !payroll) return null

  const employeeName = entry.employee?.user?.name ?? '—'
  const employeeEmail = entry.employee?.user?.email ?? ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('Payslip')} — {employeeName}
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-semibold">{employeeName}</p>
                {employeeEmail ? <p className="text-sm text-muted-foreground">{employeeEmail}</p> : null}
                {entry.employee?.designation?.designation_name ? (
                  <p className="text-sm text-muted-foreground">{entry.employee.designation.designation_name}</p>
                ) : null}
              </div>
              <div className="text-right text-sm">
                <p className="font-medium">{payroll.title}</p>
                <p className="text-muted-foreground">
                  {formatShortDate(payroll.pay_period_start)} — {formatShortDate(payroll.pay_period_end)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <Row label={t('Basic salary')} value={formatCurrency(Number(entry.basic_salary ?? 0))} />
              <Row label={t('Working days')} value={String(entry.working_days ?? '—')} />
              <Row label={t('Present days')} value={String(entry.present_days ?? '—')} />
              <Row label={t('Absent days')} value={String(entry.absent_days ?? '—')} />
              <Row label={t('Allowances')} value={formatCurrency(Number(entry.total_allowances ?? 0))} />
              <Row label={t('Manual overtime')} value={formatCurrency(Number(entry.total_manual_overtimes ?? 0))} />
              <Row
                label={t('Attendance overtime')}
                value={formatCurrency(Number(entry.attendance_overtime_amount ?? 0))}
              />
              <Row label={t('Deductions')} value={formatCurrency(Number(entry.total_deductions ?? 0))} />
              <Row label={t('Loans')} value={formatCurrency(Number(entry.total_loans ?? 0))} />
            </div>

            <BreakdownList title={t('Allowances breakdown')} items={entry.allowances_breakdown} />
            <BreakdownList title={t('Deductions breakdown')} items={entry.deductions_breakdown} />
            <BreakdownList title={t('Overtime breakdown')} items={entry.manual_overtimes_breakdown} />
            <BreakdownList title={t('Loans breakdown')} items={entry.loans_breakdown} />

            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>{t('Gross pay')}</span>
              <span>{formatCurrency(Number(entry.gross_pay ?? 0))}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-primary">
              <span>{t('Net pay')}</span>
              <span>{formatCurrency(Number(entry.net_pay ?? 0))}</span>
            </div>
            <p className="text-xs capitalize text-muted-foreground">
              {t('Status')}: {entry.status ?? '—'}
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
