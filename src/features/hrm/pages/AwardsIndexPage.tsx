import { useMemo } from 'react'
import { ResourceIndexPage } from '@/components/resource/resource-index-page'
import type { CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import type { Column } from '@/components/ui/data-table'
import { employeeColumn, dateColumn } from '../hrm-list-columns'
import { useHrmMeta } from '../hooks/use-hrm-meta'

export function AwardsIndexPage() {
  const { employeeOptions, awardTypeOptions } = useHrmMeta()

  const fields: CrudFieldDef[] = useMemo(
    () => [
      { name: 'employee_id', label: 'Employee', type: 'select', required: true, options: employeeOptions },
      { name: 'award_type_id', label: 'Award type', type: 'select', required: true, options: awardTypeOptions },
      { name: 'award_date', label: 'Award date', type: 'date', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    [employeeOptions, awardTypeOptions],
  )

  const showPath = (id: number | string) => `/hrm/awards/${id}`

  const columns: Column<Record<string, unknown>>[] = useMemo(
    () => [
      employeeColumn(showPath),
      {
        key: 'award_type',
        header: 'Type',
        render: (_, row) => String((row.award_type as { name?: string })?.name ?? '—'),
      },
      dateColumn('award_date', 'Date'),
      {
        key: 'description',
        header: 'Description',
        render: (_, row) => String(row.description ?? '—'),
      },
    ],
    [],
  )

  return (
    <ResourceIndexPage
      title="Awards"
      listKey="hrm-awards"
      apiEndpoint="/hrm/awards"
      labelKeys={['description', 'id']}
      showPath={showPath}
      fields={fields}
      columns={columns}
    />
  )
}
