import { Route } from 'react-router-dom'
import { paths } from '@/lib/paths'
import { TimesheetsIndexPage } from '@/features/timesheet/pages/TimesheetsIndexPage'
import { TimesheetFormPage } from '@/features/timesheet/pages/TimesheetFormPage'
import { TimesheetShowPage } from '@/features/timesheet/pages/TimesheetShowPage'

export const timesheetRoutes = (
  <>
    <Route path={paths.timesheet.index} element={<TimesheetsIndexPage />} />
    <Route path={paths.timesheet.create} element={<TimesheetFormPage />} />
    <Route path="/timesheet/timesheets/:id/edit" element={<TimesheetFormPage />} />
    <Route path="/timesheet/timesheets/:id" element={<TimesheetShowPage />} />
  </>
)
