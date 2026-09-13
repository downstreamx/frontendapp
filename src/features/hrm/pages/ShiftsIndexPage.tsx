import { SystemSetupEntityPage } from '@/features/shared/pages/SystemSetupEntityPage'

export function ShiftsIndexPage() {
  return (
    <SystemSetupEntityPage
      moduleKey="hrm"
      itemKey="shifts"
      fields={[
        { name: 'shift_name', label: 'Shift name', required: true },
        { name: 'start_time', label: 'Start time', type: 'time', required: true },
        { name: 'end_time', label: 'End time', type: 'time', required: true },
      ]}
      permissions={{
        create: 'create-shifts',
        edit: 'edit-shifts',
        delete: 'delete-shifts',
      }}
    />
  )
}
