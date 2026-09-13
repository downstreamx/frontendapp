import { Navigate, Route } from 'react-router-dom'
import { paths } from '@/lib/paths'
import { hrmEntities } from '@/lib/entity-registry'
import { EntityCrudIndexPage } from '@/features/shared/pages/EntityCrudIndexPage'
import { ModuleIndexPage } from '@/features/shared/pages/ModuleIndexPage'
import { BranchesIndexPage } from '@/features/hrm/pages/BranchesIndexPage'
import { DepartmentsIndexPage } from '@/features/hrm/pages/DepartmentsIndexPage'
import { DesignationsIndexPage } from '@/features/hrm/pages/DesignationsIndexPage'
import { AttendancesIndexPage } from '@/features/hrm/pages/AttendancesIndexPage'
import { AttendanceBulkMarkPage } from '@/features/hrm/pages/AttendanceBulkMarkPage'
import { ShiftAssignPage } from '@/features/hrm/pages/ShiftAssignPage'
import { HolidaysIndexPage } from '@/features/hrm/pages/HolidaysIndexPage'
import { AwardsIndexPage } from '@/features/hrm/pages/AwardsIndexPage'
import { AwardShowPage } from '@/features/hrm/pages/AwardShowPage'
import { PromotionShowPage } from '@/features/hrm/pages/PromotionShowPage'
import { ResignationShowPage } from '@/features/hrm/pages/ResignationShowPage'
import { TerminationShowPage } from '@/features/hrm/pages/TerminationShowPage'
import { WarningShowPage } from '@/features/hrm/pages/WarningShowPage'
import { ComplaintShowPage } from '@/features/hrm/pages/ComplaintShowPage'
import { EmployeeTransferShowPage } from '@/features/hrm/pages/EmployeeTransferShowPage'
import { PayrollsIndexPage } from '@/features/hrm/pages/PayrollsIndexPage'
import { PayrollShowPage } from '@/features/hrm/pages/PayrollShowPage'
import { PromotionsIndexPage } from '@/features/hrm/pages/PromotionsIndexPage'
import { LoansIndexPage } from '@/features/hrm/pages/LoansIndexPage'
import { ResignationsIndexPage } from '@/features/hrm/pages/ResignationsIndexPage'
import { TerminationsIndexPage } from '@/features/hrm/pages/TerminationsIndexPage'
import { WarningsIndexPage } from '@/features/hrm/pages/WarningsIndexPage'
import { ComplaintsIndexPage } from '@/features/hrm/pages/ComplaintsIndexPage'
import { EmployeeTransfersIndexPage } from '@/features/hrm/pages/EmployeeTransfersIndexPage'
import { DocumentsIndexPage } from '@/features/hrm/pages/DocumentsIndexPage'
import { HrmDocumentShowPage } from '@/features/hrm/pages/HrmDocumentShowPage'
import { AcknowledgmentsIndexPage } from '@/features/hrm/pages/AcknowledgmentsIndexPage'
import { AcknowledgmentShowPage } from '@/features/hrm/pages/AcknowledgmentShowPage'
import { AnnouncementsIndexPage } from '@/features/hrm/pages/AnnouncementsIndexPage'
import { AnnouncementShowPage } from '@/features/hrm/pages/AnnouncementShowPage'
import { EventsIndexPage } from '@/features/hrm/pages/EventsIndexPage'
import { EventShowPage } from '@/features/hrm/pages/EventShowPage'
import { LeaveBalanceIndexPage } from '@/features/hrm/pages/LeaveBalanceIndexPage'
import { LeaveApplicationsIndexPage } from '@/features/hrm/pages/LeaveApplicationsIndexPage'
import { LeaveApplicationFormPage } from '@/features/hrm/pages/LeaveApplicationFormPage'
import { LeaveApplicationShowPage } from '@/features/hrm/pages/LeaveApplicationShowPage'
import { SetSalaryIndexPage } from '@/features/hrm/pages/SetSalaryIndexPage'
import { SetSalaryShowPage } from '@/features/hrm/pages/SetSalaryShowPage'
import { LeaveTypesIndexPage } from '@/features/hrm/pages/LeaveTypesIndexPage'
import { ShiftsIndexPage } from '@/features/hrm/pages/ShiftsIndexPage'
import { HrmDashboardPage } from '@/features/dashboard/pages/HrmDashboardPage'
import { EmployeesIndexPage } from '@/features/hrm/pages/EmployeesIndexPage'
import { EmployeeCreateRedirect } from '@/features/hrm/pages/EmployeeCreateRedirect'
import { EmployeeViewRedirect } from '@/features/hrm/pages/EmployeeViewRedirect'
import { EmployeeFormPage } from '@/features/hrm/pages/EmployeeFormPage'
import { SystemSetupLayout } from '@/features/shared/components/SystemSetupLayout'
import { hrmSetupRoutes } from '@/routes/modules/hrm-setup-routes'

const dedicatedPaths = new Set([
  '/hrm/employees',
  '/hrm/branches',
  '/hrm/departments',
  '/hrm/designations',
  '/hrm/shifts',
  '/hrm/leave-types',
  '/hrm/leave-applications',
  '/hrm/leave-applications/create',
  '/hrm/attendances',
  '/hrm/attendances/bulk-mark',
  '/hrm/shifts/assign',
  '/hrm/holidays',
  '/hrm/awards',
  '/hrm/payrolls',
  '/hrm/promotions',
  '/hrm/resignations',
  '/hrm/terminations',
  '/hrm/warnings',
  '/hrm/complaints',
  '/hrm/award-types',
  '/hrm/employee-document-types',
  '/hrm/termination-types',
  '/hrm/warning-types',
  '/hrm/complaint-types',
  '/hrm/holiday-types',
  '/hrm/document-categories',
  '/hrm/announcement-categories',
  '/hrm/event-types',
  '/hrm/allowance-types',
  '/hrm/deduction-types',
  '/hrm/loan-types',
  '/hrm/working-days',
  '/hrm/ip-restricts',
  '/hrm/loans',
  '/hrm/resignations',
  '/hrm/terminations',
  '/hrm/warnings',
  '/hrm/complaints',
  '/hrm/employee-transfers',
  '/hrm/documents',
  '/hrm/documents/create',
  '/hrm/acknowledgments',
  '/hrm/announcements',
  '/hrm/events',
  '/hrm/leave-balance',
  '/hrm/set-salary',
])
const listEntities = hrmEntities.filter((e) => !dedicatedPaths.has(e.listPath))

export const hrmRoutes = (
  <>
    <Route path={paths.hrm.index} element={<HrmDashboardPage />} />
    <Route
      path="/hrm/branches"
      element={
        <SystemSetupLayout moduleKey="hrm">
          <BranchesIndexPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/hrm/departments"
      element={
        <SystemSetupLayout moduleKey="hrm">
          <DepartmentsIndexPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/hrm/designations"
      element={
        <SystemSetupLayout moduleKey="hrm">
          <DesignationsIndexPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/hrm/shifts"
      element={
        <SystemSetupLayout moduleKey="hrm">
          <ShiftsIndexPage />
        </SystemSetupLayout>
      }
    />
    <Route
      path="/hrm/leave-types"
      element={
        <SystemSetupLayout moduleKey="hrm">
          <LeaveTypesIndexPage />
        </SystemSetupLayout>
      }
    />
    <Route path="/hrm/attendances/bulk-mark" element={<AttendanceBulkMarkPage />} />
    <Route path="/hrm/shifts/assign" element={<ShiftAssignPage />} />
    <Route path="/hrm/attendances" element={<AttendancesIndexPage />} />
    <Route path="/hrm/holidays" element={<HolidaysIndexPage />} />
    <Route path="/hrm/awards/:id" element={<AwardShowPage />} />
    <Route path={paths.hrm.awards} element={<AwardsIndexPage />} />
    <Route path={paths.hrm.payrolls} element={<PayrollsIndexPage />} />
    <Route path="/hrm/payrolls/:id" element={<PayrollShowPage />} />
    <Route path="/hrm/promotions/:id" element={<PromotionShowPage />} />
    <Route path={paths.hrm.promotions} element={<PromotionsIndexPage />} />
    <Route path="/hrm/loans" element={<LoansIndexPage />} />
    <Route path="/hrm/resignations/:id" element={<ResignationShowPage />} />
    <Route path="/hrm/resignations" element={<ResignationsIndexPage />} />
    <Route path="/hrm/terminations/:id" element={<TerminationShowPage />} />
    <Route path="/hrm/terminations" element={<TerminationsIndexPage />} />
    <Route path="/hrm/warnings/:id" element={<WarningShowPage />} />
    <Route path="/hrm/warnings" element={<WarningsIndexPage />} />
    <Route path="/hrm/complaints/:id" element={<ComplaintShowPage />} />
    <Route path="/hrm/complaints" element={<ComplaintsIndexPage />} />
    <Route path="/hrm/employee-transfers/:id" element={<EmployeeTransferShowPage />} />
    <Route path="/hrm/employee-transfers" element={<EmployeeTransfersIndexPage />} />
    <Route path="/hrm/documents/create" element={<Navigate to="/hrm/documents" replace />} />
    <Route path="/hrm/documents/:id/edit" element={<Navigate to="/hrm/documents" replace />} />
    <Route path="/hrm/documents/:id" element={<HrmDocumentShowPage />} />
    <Route path="/hrm/documents" element={<DocumentsIndexPage />} />
    <Route path="/hrm/acknowledgments/:id" element={<AcknowledgmentShowPage />} />
    <Route path="/hrm/acknowledgments" element={<AcknowledgmentsIndexPage />} />
    <Route path="/hrm/announcements/:id" element={<AnnouncementShowPage />} />
    <Route path="/hrm/announcements" element={<AnnouncementsIndexPage />} />
    <Route path="/hrm/events/:id" element={<EventShowPage />} />
    <Route path="/hrm/events" element={<EventsIndexPage />} />
    <Route path="/hrm/leave-applications/create" element={<LeaveApplicationFormPage />} />
    <Route path="/hrm/leave-applications/:id/edit" element={<LeaveApplicationFormPage />} />
    <Route path="/hrm/leave-applications/:id" element={<LeaveApplicationShowPage />} />
    <Route path="/hrm/leave-applications" element={<LeaveApplicationsIndexPage />} />
    <Route path="/hrm/leave-balance" element={<LeaveBalanceIndexPage />} />
    <Route path="/hrm/set-salary" element={<SetSalaryIndexPage />} />
    <Route path="/hrm/set-salary/:id" element={<SetSalaryShowPage />} />
    <Route path="/hrm/employees/create" element={<EmployeeCreateRedirect />} />
    <Route path="/hrm/employees/:id/edit" element={<EmployeeFormPage />} />
    <Route path="/hrm/employees/:id" element={<EmployeeViewRedirect />} />
    <Route path="/hrm/employees" element={<EmployeesIndexPage />} />
    {hrmSetupRoutes}
    {listEntities.map((entity) => (
      <Route
        key={entity.listPath}
        path={entity.listPath}
        element={<EntityCrudIndexPage {...entity} />}
      />
    ))}
    <Route path="/hrm/*" element={<ModuleIndexPage />} />
  </>
)
