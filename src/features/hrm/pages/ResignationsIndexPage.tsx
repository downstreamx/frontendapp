import { useMemo } from 'react'
import { ResourceIndexPage } from '@/components/resource/resource-index-page'
import type { CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import type { Column } from '@/components/ui/data-table'
import { employeeColumn, dateColumn, statusColumn } from '../hrm-list-columns'
import { useHrmMeta } from '../hooks/use-hrm-meta'

export function ResignationsIndexPage() {
  const { employeeOptions } = useHrmMeta()

  const fields: CrudFieldDef[] = useMemo(
    () => [
      { name: 'employee_id', label: 'Employee', type: 'select', required: true, options: employeeOptions },
      { name: 'last_working_date', label: 'Last working day', type: 'date', required: true },
      { name: 'reason', label: 'Reason' },
    ],
    [employeeOptions],
  )

  const showPath = (id: number | string) => `/hrm/resignations/${id}`

  const columns = useMemo(
    () => [employeeColumn(showPath), dateColumn('last_working_date', 'Last day'), statusColumn()],
    [showPath],
  )

  return (
    <ResourceIndexPage
      title="Resignations"
      listKey="hrm-resignations"
      apiEndpoint="/hrm/resignations"
      labelKeys={['id']}
      showPath={showPath}
      fields={fields}
      columns={columns}
    />
  )
}
