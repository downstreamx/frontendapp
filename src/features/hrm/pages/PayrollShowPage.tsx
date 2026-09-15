import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CreditCard, Eye, Play, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { formatCurrency } from '@/utils/helpers'
import { formatShortDate } from '@/features/shared/lib/entity-labels'
import { PayslipDialog } from '../components/PayslipDialog'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import {
  deletePayrollEntry,
  getPayroll,
  payPayrollEntry,
  runPayroll,
  type PayrollEntryRow,
} from '../hrm-api'

export function PayrollShowPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const payrollId = Number(id)
  const queryClient = useQueryClient()
  const [payslipEntry, setPayslipEntry] = useState<PayrollEntryRow | null>(null)
  const [deleteEntryId, setDeleteEntryId] = useState<number | null>(null)
  const [confirmRun, setConfirmRun] = useState(false)

  const { data: payroll, isLoading, error } = useQuery({
    queryKey: ['hrm-payroll', payrollId],
    queryFn: () => getPayroll(payrollId),
    enabled: Number.isFinite(payrollId),
  })

  usePageChrome({
    pageTitle: payroll?.title ?? t('Payroll'),
    breadcrumbs: [
      { label: t('Hrm') },
      { label: t('Payrolls'), url: '/hrm/payrolls' },
      { label: payroll?.title ?? t('Payroll') },
    ],
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['hrm-payroll', payrollId] })
    void queryClient.invalidateQueries({ queryKey: ['hrm-payrolls'] })
  }

  const runMutation = useMutation({
    mutationFn: () => runPayroll(payrollId),
    onSuccess: (result) => {
      toast.success(
        result.new_entries > 0
          ? t('Payroll processed. {{new}} new payslips.', { new: result.new_entries })
          : t('All employee payslips already exist.'),
      )
      setConfirmRun(false)
      invalidate()
    },
    onError: () => toast.error(t('Could not run payroll')),
  })

  const payMutation = useMutation({
    mutationFn: (entryId: number) => payPayrollEntry(entryId),
    onSuccess: () => {
      toast.success(t('Marked as paid'))
      invalidate()
    },
    onError: () => toast.error(t('Could not update payment')),
  })

  const deleteMutation = useMutation({
    mutationFn: (entryId: number) => deletePayrollEntry(entryId),
    onSuccess: () => {
      toast.success(t('Payslip removed'))
      setDeleteEntryId(null)
      invalidate()
    },
    onError: () => toast.error(t('Could not delete payslip')),
  })

  const entries = payroll?.payroll_entries ?? []

  const columns: Column<PayrollEntryRow>[] = useMemo(
    () => [
      {
        key: 'employee',
        header: t('Employee'),
        render: (_, row) => (
          <div>
            <p className="font-medium">{row.employee?.user?.name ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{row.employee?.user?.email ?? ''}</p>
          </div>
        ),
      },
      {
        key: 'gross_pay',
        header: t('Gross'),
        render: (_, row) => formatCurrency(Number(row.gross_pay ?? 0)),
      },
      {
        key: 'net_pay',
        header: t('Net pay'),
        render: (_, row) => formatCurrency(Number(row.net_pay ?? 0)),
      },
      {
        key: 'status',
        header: t('Status'),
        render: (_, row) => (
          <Badge variant={row.status === 'paid' ? 'default' : 'outline'} className="capitalize">
            {row.status ?? 'unpaid'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: t('Action'),
        render: (_, row) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" title={t('View payslip')} onClick={() => setPayslipEntry(row)}>
              <Eye className="h-4 w-4" />
            </Button>
            {row.status !== 'paid' ? (
              <Button
                variant="ghost"
                size="icon"
                title={t('Mark paid')}
                onClick={() => payMutation.mutate(row.id)}
              >
                <CreditCard className="h-4 w-4 text-green-600" />
              </Button>
            ) : null}
            <Button variant="ghost" size="icon" title={t('Delete')} onClick={() => setDeleteEntryId(row.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [payMutation, t],
  )

  if (isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  if (error || !payroll) {
    return <p className="text-sm text-destructive">{t('Record not found.')}</p>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>{payroll.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatShortDate(payroll.pay_period_start)} — {formatShortDate(payroll.pay_period_end)}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge className="capitalize">{payroll.status ?? 'draft'}</Badge>
              {payroll.payroll_frequency ? <Badge variant="outline">{payroll.payroll_frequency}</Badge> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {payroll.status !== 'completed' ? (
              <Button size="sm" onClick={() => setConfirmRun(true)} disabled={runMutation.isPending}>
                <Play className="mr-1 h-4 w-4" />
                {t('Run payroll')}
              </Button>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link to="/hrm/payrolls">{t('Back to list')}</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Stat label={t('Gross pay')} value={formatCurrency(Number(payroll.total_gross_pay ?? 0))} />
          <Stat label={t('Deductions')} value={formatCurrency(Number(payroll.total_deductions ?? 0))} />
          <Stat label={t('Net pay')} value={formatCurrency(Number(payroll.total_net_pay ?? 0))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('Payslips')} ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length ? (
            <DataTable data={entries} columns={columns} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('No payslips yet. Run payroll to generate entries.')}
            </p>
          )}
        </CardContent>
      </Card>

      <PayslipDialog
        open={payslipEntry != null}
        onOpenChange={(open) => !open && setPayslipEntry(null)}
        entry={payslipEntry}
        payroll={payroll}
      />

      <ConfirmationDialog
        open={confirmRun}
        onOpenChange={setConfirmRun}
        title={t('Run payroll')}
        description={t('Generate payslips for all employees?')}
        onConfirm={() => runMutation.mutate()}
      />

      <ConfirmationDialog
        open={deleteEntryId != null}
        onOpenChange={(open) => !open && setDeleteEntryId(null)}
        title={t('Delete payslip')}
        description={t('Remove this employee from the payroll run?')}
        onConfirm={() => deleteEntryId != null && deleteMutation.mutate(deleteEntryId)}
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}
