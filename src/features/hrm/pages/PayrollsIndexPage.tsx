import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Eye, Play, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { CrudFormDialog, type CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { formatCurrency } from '@/utils/helpers'
import { formatShortDate } from '@/features/shared/lib/entity-labels'
import {
  createPayroll,
  deletePayroll,
  listPayrollsPaginated,
  runPayroll,
  updatePayroll,
  type PayrollRow,
} from '../hrm-api'

const frequencyOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
]

const fields: CrudFieldDef[] = [
  { name: 'title', label: 'Title', required: true },
  { name: 'payroll_frequency', label: 'Frequency', type: 'select', options: frequencyOptions },
  { name: 'pay_period_start', label: 'Period start', type: 'date', required: true },
  { name: 'pay_period_end', label: 'Period end', type: 'date', required: true },
  { name: 'pay_date', label: 'Pay date', type: 'date' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
]

export function PayrollsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; row?: PayrollRow } | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [runId, setRunId] = useState<number | null>(null)

  const page = Number(searchParams.get('page') ?? '1') || 1

  usePageChrome({
    pageTitle: t('Payrolls'),
    breadcrumbs: [{ label: t('Hrm') }, { label: t('Payrolls') }],
  })

  const listParams = useMemo(
    () => ({
      per_page: toolbar.perPage,
      page: String(page),
      ...(toolbar.search ? { search: toolbar.search } : {}),
    }),
    [page, toolbar.perPage, toolbar.search],
  )

  const { data, isLoading, error } = useQuery({
    queryKey: ['hrm-payrolls', listParams],
    queryFn: () => listPayrollsPaginated(listParams),
  })

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const payload = {
        title: String(values.title),
        payroll_frequency: values.payroll_frequency ? String(values.payroll_frequency) : undefined,
        pay_period_start: String(values.pay_period_start),
        pay_period_end: String(values.pay_period_end),
        pay_date: values.pay_date ? String(values.pay_date) : undefined,
        notes: values.notes ? String(values.notes) : undefined,
      }
      if (modal?.mode === 'edit' && modal.row) {
        return updatePayroll(modal.row.id, payload)
      }
      return createPayroll(payload)
    },
    onSuccess: (row) => {
      toast.success(modal?.mode === 'edit' ? t('Payroll updated') : t('Payroll created'))
      setModal(null)
      void queryClient.invalidateQueries({ queryKey: ['hrm-payrolls'] })
      if (modal?.mode === 'add') {
        navigate(`/hrm/payrolls/${row.id}`)
      }
    },
    onError: () => toast.error(t('Could not save payroll')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePayroll(id),
    onSuccess: () => {
      toast.success(t('Payroll deleted'))
      setDeleteId(null)
      void queryClient.invalidateQueries({ queryKey: ['hrm-payrolls'] })
    },
    onError: () => toast.error(t('Could not delete payroll')),
  })

  const runMutation = useMutation({
    mutationFn: (id: number) => runPayroll(id),
    onSuccess: (result) => {
      toast.success(
        result.new_entries > 0
          ? t('Payroll processed. {{new}} new payslips ({{total}} total).', {
              new: result.new_entries,
              total: result.total_entries,
            })
          : t('Payroll already processed ({{total}} employees).', { total: result.total_entries }),
      )
      setRunId(null)
      void queryClient.invalidateQueries({ queryKey: ['hrm-payrolls'] })
      navigate(`/hrm/payrolls/${result.payroll.id}`)
    },
    onError: () => toast.error(t('Could not run payroll')),
  })

  const statusVariant = (status?: string) => {
    if (status === 'completed') return 'default'
    if (status === 'processing') return 'secondary'
    if (status === 'cancelled') return 'destructive'
    return 'outline'
  }

  const columns: Column<PayrollRow>[] = useMemo(
    () => [
      {
        key: 'title',
        header: t('Title'),
        render: (_, row) => (
          <Link to={`/hrm/payrolls/${row.id}`} className="font-medium text-primary hover:underline">
            {row.title ?? `#${row.id}`}
          </Link>
        ),
      },
      {
        key: 'payroll_frequency',
        header: t('Frequency'),
        render: (_, row) => row.payroll_frequency ?? '—',
      },
      {
        key: 'period',
        header: t('Period'),
        render: (_, row) =>
          `${formatShortDate(row.pay_period_start)} — ${formatShortDate(row.pay_period_end)}`,
      },
      {
        key: 'status',
        header: t('Status'),
        render: (_, row) => (
          <Badge variant={statusVariant(row.status)} className="capitalize">
            {row.status ?? 'draft'}
          </Badge>
        ),
      },
      {
        key: 'total_net_pay',
        header: t('Net pay'),
        render: (_, row) =>
          row.total_net_pay != null ? formatCurrency(Number(row.total_net_pay)) : '—',
      },
      {
        key: 'employee_count',
        header: t('Employees'),
        render: (_, row) => String(row.employee_count ?? 0),
      },
      {
        key: 'actions',
        header: t('Action'),
        render: (_, row) => (
          <div className="flex items-center gap-1">
            {row.status !== 'completed' ? (
              <Button
                variant="ghost"
                size="icon"
                title={t('Run payroll')}
                onClick={() => setRunId(row.id)}
              >
                <Play className="h-4 w-4 text-purple-600" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" asChild title={t('View')}>
                <Link to={`/hrm/payrolls/${row.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <TableRowActions
              onEdit={() => setModal({ mode: 'edit', row })}
              onDelete={() => setDeleteId(row.id)}
            />
          </div>
        ),
      },
    ],
    [t],
  )

  const rows = data?.data ?? []

  return (
  <>
    <ModuleListCard
      title={t('Payrolls')}
      description={t('Create payroll periods and run salary calculations for employees.')}
      isLoading={isLoading}
      error={Boolean(error)}
      onCreateClick={() => setModal({ mode: 'add' })}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: () => {
          toolbar.applySearch()
          const next = new URLSearchParams(searchParams)
          next.set('page', '1')
          setSearchParams(next)
        },
        searchPlaceholder: t('Search payrolls...'),
      }}
      pagination={
        data?.meta
          ? {
              current_page: data.meta.current_page,
              last_page: data.meta.last_page,
              per_page: data.meta.per_page,
              total: data.meta.total,
              onPageChange: (p) => {
                const next = new URLSearchParams(searchParams)
                next.set('page', String(p))
                setSearchParams(next)
              },
            }
          : undefined
      }
    >
      {rows.length === 0 && !isLoading ? (
        <NoRecordsFound
          icon={Wallet}
          title={t('No payrolls found')}
          description={t('Get started by creating your first payroll period.')}
          onCreateClick={() => setModal({ mode: 'add' })}
          createButtonText={t('Create payroll')}
          className="h-auto py-8"
        />
      ) : (
        <DataTable data={rows} columns={columns} />
      )}
    </ModuleListCard>

    {modal ? (
      <CrudFormDialog
        open
        mode={modal.mode}
        title={modal.mode === 'add' ? t('Create payroll') : t('Edit payroll')}
        fields={fields}
        initialValues={modal.row as Record<string, unknown> | undefined}
        isPending={saveMutation.isPending}
        onOpenChange={(open) => !open && setModal(null)}
        onSubmit={(values) => saveMutation.mutate(values)}
      />
    ) : null}

    <ConfirmationDialog
      open={deleteId != null}
      onOpenChange={(open) => !open && setDeleteId(null)}
      title={t('Delete payroll')}
      description={t('This will remove the payroll and all payslip entries.')}
      onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
    />

    <ConfirmationDialog
      open={runId != null}
      onOpenChange={(open) => !open && setRunId(null)}
      title={t('Run payroll')}
      description={t('Generate payslips for all employees in this period?')}
      onConfirm={() => runId != null && runMutation.mutate(runId)}
    />
  </>
  )
}
