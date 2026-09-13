import { useMemo } from 'react'
import { ResourceIndexPage } from '@/components/resource/resource-index-page'
import type { CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import type { Column } from '@/components/ui/data-table'
import { employeeColumn, dateColumn, statusColumn } from '../hrm-list-columns'
import { useHrmMeta } from '../hooks/use-hrm-meta'

export function TerminationsIndexPage() {
  const { employeeOptions, terminationTypeOptions } = useHrmMeta()

  const fields: CrudFieldDef[] = useMemo(
    () => [
      { name: 'employee_id', label: 'Employee', type: 'select', required: true, options: employeeOptions },
      { name: 'termination_type_id', label: 'Type', type: 'select', required: true, options: terminationTypeOptions },
      { name: 'notice_date', label: 'Notice date', type: 'date', required: true },
      { name: 'termination_date', label: 'Termination date', type: 'date', required: true },
      { name: 'reason', label: 'Reason' },
    ],
    [employeeOptions, terminationTypeOptions],
  )

  const showPath = (id: number | string) => `/hrm/terminations/${id}`

  const columns: Column<Record<string, unknown>>[] = useMemo(
    () => [
      employeeColumn(showPath),
      {
        key: 'termination_type',
        header: 'Type',
        render: (_, row) =>
          String((row.termination_type as { termination_type?: string })?.termination_type ?? '—'),
      },
      dateColumn('termination_date', 'Terminated'),
      statusColumn(),
    ],
    [showPath],
  )

  return (
    <ResourceIndexPage
      title="Terminations"
      listKey="hrm-terminations"
      apiEndpoint="/hrm/terminations"
      labelKeys={['id']}
      showPath={showPath}
      fields={fields}
      columns={columns}
    />
  )
}
