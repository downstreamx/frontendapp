import { SystemSetupEntityPage } from '@/features/shared/pages/SystemSetupEntityPage'

export function BranchesIndexPage() {
  return (
    <SystemSetupEntityPage
      moduleKey="hrm"
      itemKey="branches"
      fields={[{ name: 'branch_name', label: 'Branch name', required: true }]}
      permissions={{
        create: 'create-branches',
        edit: 'edit-branches',
        delete: 'delete-branches',
      }}
    />
  )
}
