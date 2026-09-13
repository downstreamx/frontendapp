import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { CrudFormDialog, type CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { UserAvatar } from '@/features/shared/components/table-avatar-cells'
import { formatCurrency } from '@/utils/helpers'
import {
  createSetSalaryAllowance,
  createSetSalaryDeduction,
  createSetSalaryOvertime,
  deleteSetSalaryAllowance,
  deleteSetSalaryDeduction,
  deleteSetSalaryOvertime,
  fetchSetSalaryShow,
  updateSetSalaryAllowance,
  updateSetSalaryBasic,
  updateSetSalaryDeduction,
  updateSetSalaryOvertime,
  type AllowanceRow,
  type DeductionRow,
  type OvertimeRow,
  type SalaryComponentType,
} from '../hrm-api'

const amountTypeOptions = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'percentage', label: 'Percentage' },
]

function typeOptions(types: SalaryComponentType[]) {
  return types.map((t) => ({ value: String(t.id), label: t.name }))
}

export function SetSalaryShowPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const employeeId = Number(id)
  const queryClient = useQueryClient()
  const [editingBasic, setEditingBasic] = useState(false)
  const [basicDraft, setBasicDraft] = useState('')
  const [dialog, setDialog] = useState<{
    section: 'allowance' | 'deduction' | 'overtime'
    mode: 'add' | 'edit'
    row?: AllowanceRow | DeductionRow | OvertimeRow
  } | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['hrm', 'set-salary', employeeId],
    queryFn: () => fetchSetSalaryShow(employeeId),
    enabled: Number.isFinite(employeeId),
  })

  const employee = data?.employee
  const displayName = employee?.user?.name ?? employee?.employee_id ?? t('Employee')

  usePageChrome({
    pageTitle: displayName,
    breadcrumbs: [
      { label: t('Hrm') },
      { label: t('Set Salary'), url: '/hrm/set-salary' },
      { label: displayName },
    ],
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['hrm', 'set-salary', employeeId] })
  }

  const basicMutation = useMutation({
    mutationFn: (value: number) => updateSetSalaryBasic(employeeId, value),
    onSuccess: () => {
      toast.success(t('Basic salary updated'))
      setEditingBasic(false)
      invalidate()
    },
    onError: () => toast.error(t('Could not update basic salary')),
  })

  const allowanceFields: CrudFieldDef[] = useMemo(
    () => [
      {
        name: 'allowance_type_id',
        label: t('Allowance type'),
        type: 'select',
        required: true,
        options: typeOptions(data?.allowance_types ?? []),
      },
      { name: 'type', label: t('Type'), type: 'select', required: true, options: amountTypeOptions },
      { name: 'amount', label: t('Amount'), type: 'number', required: true, min: 0 },
    ],
    [data?.allowance_types, t],
  )

  const deductionFields: CrudFieldDef[] = useMemo(
    () => [
      {
        name: 'deduction_type_id',
        label: t('Deduction type'),
        type: 'select',
        required: true,
        options: typeOptions(data?.deduction_types ?? []),
      },
      { name: 'type', label: t('Type'), type: 'select', required: true, options: amountTypeOptions },
      { name: 'amount', label: t('Amount'), type: 'number', required: true, min: 0 },
    ],
    [data?.deduction_types, t],
  )

  const overtimeFields: CrudFieldDef[] = useMemo(
    () => [
      { name: 'title', label: t('Title'), required: true },
      { name: 'total_days', label: t('Total days'), type: 'number', required: true, min: 1 },
      { name: 'hours', label: t('Hours'), type: 'number', required: true, min: 0 },
      { name: 'rate', label: t('Rate'), type: 'number', required: true, min: 0 },
      { name: 'start_date', label: t('Start date'), type: 'date', required: true },
      { name: 'end_date', label: t('End date'), type: 'date' },
      { name: 'notes', label: t('Notes'), type: 'textarea' },
    ],
    [t],
  )

  const componentMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      if (!dialog) return
      const amount = Number(values.amount)
      if (dialog.section === 'allowance') {
        const payload = {
          allowance_type_id: Number(values.allowance_type_id),
          type: String(values.type),
          amount,
        }
        if (dialog.mode === 'add') {
          return createSetSalaryAllowance(employeeId, payload)
        }
        return updateSetSalaryAllowance(employeeId, (dialog.row as AllowanceRow).id, payload)
      }
      if (dialog.section === 'deduction') {
        const payload = {
          deduction_type_id: Number(values.deduction_type_id),
          type: String(values.type),
          amount,
        }
        if (dialog.mode === 'add') {
          return createSetSalaryDeduction(employeeId, payload)
        }
        return updateSetSalaryDeduction(employeeId, (dialog.row as DeductionRow).id, payload)
      }
      const overtimePayload = {
        title: String(values.title),
        total_days: Number(values.total_days),
        hours: Number(values.hours),
        rate: Number(values.rate),
        start_date: String(values.start_date),
        end_date: values.end_date ? String(values.end_date) : undefined,
        notes: values.notes ? String(values.notes) : undefined,
      }
      if (dialog.mode === 'add') {
        return createSetSalaryOvertime(employeeId, overtimePayload)
      }
      return updateSetSalaryOvertime(employeeId, (dialog.row as OvertimeRow).id, overtimePayload)
    },
    onSuccess: () => {
      toast.success(t('Saved'))
      setDialog(null)
      invalidate()
    },
    onError: () => toast.error(t('Could not save')),
  })

  const deleteMutation = useMutation({
    mutationFn: async (target: { section: 'allowance' | 'deduction' | 'overtime'; id: number }) => {
      if (target.section === 'allowance') {
        await deleteSetSalaryAllowance(employeeId, target.id)
      } else if (target.section === 'deduction') {
        await deleteSetSalaryDeduction(employeeId, target.id)
      } else {
        await deleteSetSalaryOvertime(employeeId, target.id)
      }
    },
    onSuccess: () => {
      toast.success(t('Deleted'))
      invalidate()
    },
    onError: () => toast.error(t('Could not delete')),
  })

  const allowanceColumns: Column<AllowanceRow>[] = [
    {
      key: 'type_name',
      header: t('Type'),
      render: (_, row) => row.allowance_type?.name ?? '—',
    },
    { key: 'type', header: t('Calculation'), render: (_, row) => String(row.type ?? '—') },
    {
      key: 'amount',
      header: t('Amount'),
      render: (_, row) => formatCurrency(Number(row.amount ?? 0)),
    },
    {
      key: 'actions',
      header: t('Action'),
      render: (_, row) => (
        <RowActions
          onEdit={() => setDialog({ section: 'allowance', mode: 'edit', row })}
          onDelete={() => deleteMutation.mutate({ section: 'allowance', id: row.id })}
        />
      ),
    },
  ]

  const deductionColumns: Column<DeductionRow>[] = [
    {
      key: 'type_name',
      header: t('Type'),
      render: (_, row) => row.deduction_type?.name ?? '—',
    },
    { key: 'type', header: t('Calculation'), render: (_, row) => String(row.type ?? '—') },
    {
      key: 'amount',
      header: t('Amount'),
      render: (_, row) => formatCurrency(Number(row.amount ?? 0)),
    },
    {
      key: 'actions',
      header: t('Action'),
      render: (_, row) => (
        <RowActions
          onEdit={() => setDialog({ section: 'deduction', mode: 'edit', row })}
          onDelete={() => deleteMutation.mutate({ section: 'deduction', id: row.id })}
        />
      ),
    },
  ]

  const overtimeColumns: Column<OvertimeRow>[] = [
    { key: 'title', header: t('Title'), render: (_, row) => String(row.title ?? '—') },
    { key: 'hours', header: t('Hours'), render: (_, row) => String(row.hours ?? '—') },
    { key: 'rate', header: t('Rate'), render: (_, row) => formatCurrency(Number(row.rate ?? 0)) },
    { key: 'status', header: t('Status'), render: (_, row) => String(row.status ?? '—') },
    {
      key: 'actions',
      header: t('Action'),
      render: (_, row) => (
        <RowActions
          onEdit={() => setDialog({ section: 'overtime', mode: 'edit', row })}
          onDelete={() => deleteMutation.mutate({ section: 'overtime', id: row.id })}
        />
      ),
    },
  ]

  const dialogFields =
    dialog?.section === 'allowance'
      ? allowanceFields
      : dialog?.section === 'deduction'
        ? deductionFields
        : overtimeFields

  const dialogInitial =
    dialog?.row && dialog.section === 'allowance'
      ? {
          allowance_type_id: (dialog.row as AllowanceRow).allowance_type_id,
          type: (dialog.row as AllowanceRow).type,
          amount: (dialog.row as AllowanceRow).amount,
        }
      : dialog?.row && dialog.section === 'deduction'
        ? {
            deduction_type_id: (dialog.row as DeductionRow).deduction_type_id,
            type: (dialog.row as DeductionRow).type,
            amount: (dialog.row as DeductionRow).amount,
          }
        : dialog?.row && dialog.section === 'overtime'
          ? (dialog.row as OvertimeRow)
          : undefined

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  if (error || !employee) {
    return <p className="text-sm text-destructive">{t('Record not found.')}</p>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserAvatar avatar={employee.user?.avatar} name={employee.user?.name ?? ''} size="lg" />
            <div>
              <CardTitle>{employee.user?.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {[employee.branch?.branch_name, employee.department?.department_name, employee.designation?.designation_name]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/hrm/set-salary">{t('Back to list')}</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-md border p-4">
            <div className="min-w-[200px] flex-1 space-y-1">
              <Label>{t('Basic salary')}</Label>
              {editingBasic ? (
                <Input
                  type="number"
                  min={0}
                  value={basicDraft}
                  onChange={(e) => setBasicDraft(e.target.value)}
                />
              ) : (
                <p className="text-lg font-semibold">
                  {employee.basic_salary != null ? formatCurrency(Number(employee.basic_salary)) : '—'}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {editingBasic ? (
                <>
                  <Button
                    size="sm"
                    disabled={basicMutation.isPending}
                    onClick={() => basicMutation.mutate(Number(basicDraft))}
                  >
                    {t('Save')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingBasic(false)}>
                    {t('Cancel')}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setBasicDraft(String(employee.basic_salary ?? ''))
                    setEditingBasic(true)
                  }}
                >
                  <Pencil className="mr-1 h-4 w-4" />
                  {t('Edit')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <SalarySection
        title={t('Allowances')}
        onAdd={() => setDialog({ section: 'allowance', mode: 'add' })}
        rows={data.allowances}
        columns={allowanceColumns}
      />
      <SalarySection
        title={t('Deductions')}
        onAdd={() => setDialog({ section: 'deduction', mode: 'add' })}
        rows={data.deductions}
        columns={deductionColumns}
      />
      <SalarySection
        title={t('Loans')}
        rows={data.loans}
        columns={[
          { key: 'title', header: t('Title'), render: (_, row) => String(row.title ?? '—') },
          {
            key: 'loan_type',
            header: t('Type'),
            render: (_, row) => String((row as { loan_type?: { name?: string } }).loan_type?.name ?? '—'),
          },
          {
            key: 'amount',
            header: t('Amount'),
            render: (_, row) => formatCurrency(Number((row as { amount?: number }).amount ?? 0)),
          },
        ]}
        hideAdd
        footer={
          <p className="text-xs text-muted-foreground">
            {t('Manage loans from')}{' '}
            <Link to="/hrm/loans" className="text-primary hover:underline">
              {t('Loans')}
            </Link>
          </p>
        }
      />
      <SalarySection
        title={t('Overtime')}
        onAdd={() => setDialog({ section: 'overtime', mode: 'add' })}
        rows={data.overtimes}
        columns={overtimeColumns}
      />

      {dialog ? (
        <CrudFormDialog
          open
          mode={dialog.mode}
          title={
            dialog.mode === 'add'
              ? t('Add {{section}}', { section: dialog.section })
              : t('Edit {{section}}', { section: dialog.section })
          }
          fields={dialogFields}
          initialValues={dialogInitial as Record<string, unknown> | undefined}
          isPending={componentMutation.isPending}
          onOpenChange={(open) => !open && setDialog(null)}
          onSubmit={(values) => componentMutation.mutate(values)}
        />
      ) : null}
    </div>
  )
}

function SalarySection<T extends { id: number }>({
  title,
  rows,
  columns,
  onAdd,
  hideAdd,
  footer,
}: {
  title: string
  rows: T[]
  columns: Column<T>[]
  onAdd?: () => void
  hideAdd?: boolean
  footer?: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        {!hideAdd && onAdd ? (
          <Button size="sm" onClick={onAdd}>
            <Plus className="mr-1 h-4 w-4" />
            {t('Add')}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length ? <DataTable data={rows} columns={columns} /> : <p className="text-sm text-muted-foreground">{t('No records')}</p>}
        {footer}
      </CardContent>
    </Card>
  )
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" onClick={onEdit} title={t('Edit')}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} title={t('Delete')}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}
