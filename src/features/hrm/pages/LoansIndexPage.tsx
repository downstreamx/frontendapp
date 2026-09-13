import { useMemo } from 'react'
import { ResourceIndexPage } from '@/components/resource/resource-index-page'
import type { CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import type { Column } from '@/components/ui/data-table'
import { employeeColumn, dateColumn } from '../hrm-list-columns'
import { useHrmMeta } from '../hooks/use-hrm-meta'

export function LoansIndexPage() {
  const { employeeOptions, loanTypeOptions } = useHrmMeta()

  const fields: CrudFieldDef[] = useMemo(
    () => [
      { name: 'title', label: 'Title', required: true },
      { name: 'employee_id', label: 'Employee', type: 'select', required: true, options: employeeOptions },
      { name: 'loan_type_id', label: 'Loan type', type: 'select', required: true, options: loanTypeOptions },
      { name: 'amount', label: 'Amount', type: 'number', required: true },
      { name: 'start_date', label: 'Start date', type: 'date', required: true },
      { name: 'end_date', label: 'End date', type: 'date' },
      { name: 'reason', label: 'Reason' },
    ],
    [employeeOptions, loanTypeOptions],
  )

  const columns: Column<Record<string, unknown>>[] = useMemo(
    () => [
      { key: 'title', header: 'Title', render: (_, row) => String(row.title ?? '—') },
      employeeColumn(),
      {
        key: 'loan_type',
        header: 'Type',
        render: (_, row) => String((row.loan_type as { name?: string })?.name ?? '—'),
      },
      {
        key: 'amount',
        header: 'Amount',
        render: (_, row) =>
          row.amount != null ? Number(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—',
      },
      dateColumn('start_date', 'Start'),
    ],
    [],
  )

  return (
    <ResourceIndexPage
      title="Loans"
      listKey="hrm-loans"
      apiEndpoint="/hrm/loans"
      labelKeys={['title', 'id']}
      fields={fields}
      columns={columns}
    />
  )
}
