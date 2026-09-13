import { useMemo } from 'react'
import { ResourceIndexPage } from '@/components/resource/resource-index-page'
import type { CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import type { Column } from '@/components/ui/data-table'
import { employeeColumn, dateColumn, statusColumn } from '../hrm-list-columns'
import { personName } from '@/features/shared/lib/entity-labels'
import { useHrmMeta } from '../hooks/use-hrm-meta'

export function ComplaintsIndexPage() {
  const { employeeOptions, complaintTypeOptions } = useHrmMeta()

  const fields: CrudFieldDef[] = useMemo(
    () => [
      { name: 'employee_id', label: 'Complainant', type: 'select', required: true, options: employeeOptions },
      { name: 'against_employee_id', label: 'Against', type: 'select', required: true, options: employeeOptions },
      { name: 'complaint_type_id', label: 'Type', type: 'select', required: true, options: complaintTypeOptions },
      { name: 'subject', label: 'Subject', required: true },
      { name: 'complaint_date', label: 'Date', type: 'date', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    [employeeOptions, complaintTypeOptions],
  )

  const showPath = (id: number | string) => `/hrm/complaints/${id}`

  const columns: Column<Record<string, unknown>>[] = useMemo(
    () => [
      employeeColumn(showPath),
      {
        key: 'against',
        header: 'Against',
        render: (_, row) =>
          personName(row.against_employee as { name?: string; email?: string }, row.against_employee_id as number),
      },
      { key: 'subject', header: 'Subject', render: (_, row) => String(row.subject ?? '—') },
      dateColumn('complaint_date', 'Date'),
      statusColumn(),
    ],
    [showPath],
  )

  return (
    <ResourceIndexPage
      title="Complaints"
      listKey="hrm-complaints"
      apiEndpoint="/hrm/complaints"
      labelKeys={['subject', 'id']}
      showPath={showPath}
      fields={fields}
      columns={columns}
    />
  )
}
