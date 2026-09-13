import { ResourceIndexPage } from '@/components/resource/resource-index-page'
import type { CrudFieldDef } from '@/features/shared/components/CrudFormDialog'

const fields: CrudFieldDef[] = [
  { name: 'name', label: 'Holiday name', required: true },
  { name: 'start_date', label: 'Start date', type: 'date', required: true },
  { name: 'end_date', label: 'End date', type: 'date', required: true },
]

export function HolidaysIndexPage() {
  return (
    <ResourceIndexPage
      title="Holidays"
      listKey="hrm-holidays"
      apiEndpoint="/hrm/holidays"
      labelKeys={['name', 'start_date', 'id']}
      fields={fields}
    />
  )
}
