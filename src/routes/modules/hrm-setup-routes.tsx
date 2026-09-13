import { Route } from 'react-router-dom'
import { SystemSetupLayout } from '@/features/shared/components/SystemSetupLayout'
import { SystemSetupEntityPage } from '@/features/shared/pages/SystemSetupEntityPage'
import { HrmWorkingDaysPage } from '@/features/hrm/pages/HrmWorkingDaysPage'
import { HRM_SETUP_FIELDS } from '@/features/hrm/config/hrm-setup-fields'

const genericSetupRoutes: Array<{
  path: string
  itemKey: string
  permissions?: { create?: string; edit?: string; delete?: string }
}> = [
  { path: '/hrm/employee-document-types', itemKey: 'employee-document-types' },
  { path: '/hrm/award-types', itemKey: 'award-types' },
  { path: '/hrm/termination-types', itemKey: 'termination-types' },
  { path: '/hrm/warning-types', itemKey: 'warning-types' },
  { path: '/hrm/complaint-types', itemKey: 'complaint-types' },
  { path: '/hrm/holiday-types', itemKey: 'holiday-types' },
  { path: '/hrm/document-categories', itemKey: 'document-categories' },
  { path: '/hrm/announcement-categories', itemKey: 'announcement-categories' },
  { path: '/hrm/event-types', itemKey: 'event-types' },
  { path: '/hrm/allowance-types', itemKey: 'allowance-types' },
  { path: '/hrm/deduction-types', itemKey: 'deduction-types' },
  { path: '/hrm/loan-types', itemKey: 'loan-types' },
  {
    path: '/hrm/ip-restricts',
    itemKey: 'ip-restricts',
    permissions: {
      create: 'create-ip-restricts',
      edit: 'edit-ip-restricts',
      delete: 'delete-ip-restricts',
    },
  },
]

export const hrmSetupRoutes = (
  <>
    {genericSetupRoutes.map(({ path, itemKey, permissions }) => (
      <Route
        key={path}
        path={path}
        element={
          <SystemSetupLayout moduleKey="hrm">
            <SystemSetupEntityPage
              moduleKey="hrm"
              itemKey={itemKey}
              fields={HRM_SETUP_FIELDS[itemKey]}
              permissions={permissions}
            />
          </SystemSetupLayout>
        }
      />
    ))}
    <Route
      path="/hrm/working-days"
      element={
        <SystemSetupLayout moduleKey="hrm">
          <HrmWorkingDaysPage />
        </SystemSetupLayout>
      }
    />
  </>
)
