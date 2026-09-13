import { SystemSetupEntityPage } from '@/features/shared/pages/SystemSetupEntityPage'

export function LeaveTypesIndexPage() {
  return (
    <SystemSetupEntityPage
      moduleKey="hrm"
      itemKey="leave-types"
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'max_days_per_year', label: 'Max days per year', type: 'number' },
      ]}
      permissions={{
        create: 'create-leave-types',
        edit: 'edit-leave-types',
        delete: 'delete-leave-types',
      }}
    />
  )
}
