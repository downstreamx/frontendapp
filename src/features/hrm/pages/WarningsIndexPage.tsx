import { useMemo } from 'react'
import { ResourceIndexPage } from '@/components/resource/resource-index-page'
import type { CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import type { Column } from '@/components/ui/data-table'
import { employeeColumn, dateColumn } from '../hrm-list-columns'
import { useHrmMeta } from '../hooks/use-hrm-meta'

export function WarningsIndexPage() {
  const { employeeOptions, warningTypeOptions } = useHrmMeta()

  const fields: CrudFieldDef[] = useMemo(
    () => [
      { name: 'employee_id', label: 'Employee', type: 'select', required: true, options: employeeOptions },
      { name: 'warning_type_id', label: 'Type', type: 'select', required: true, options: warningTypeOptions },
      { name: 'subject', label: 'Subject', required: true },
      { name: 'warning_date', label: 'Date', type: 'date', required: true },
      { name: 'severity', label: 'Severity' },
    ],
    [employeeOptions, warningTypeOptions],
  )

  const showPath = (id: number | string) => `/hrm/warnings/${id}`

  const columns: Column<Record<string, unknown>>[] = useMemo(
    () => [
      employeeColumn(showPath),
      { key: 'subject', header: 'Subject', render: (_, row) => String(row.subject ?? '—') },
      {
        key: 'warning_type',
        header: 'Type',
        render: (_, row) =>
          String((row.warning_type as { warning_type_name?: string })?.warning_type_name ?? '—'),
      },
      dateColumn('warning_date', 'Date'),
    ],
    [showPath],
  )

  return (
    <ResourceIndexPage
      title="Warnings"
      listKey="hrm-warnings"
      apiEndpoint="/hrm/warnings"
      labelKeys={['subject', 'id']}
      showPath={showPath}
      fields={fields}
      columns={columns}
    />
  )
}
