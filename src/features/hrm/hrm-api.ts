import { api, submitFormDataUpdate, type ApiSuccess } from '@/lib/api'
import { extractListRows, extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type HrmMeta = {
  branches: Array<{ id: number; branch_name: string }>
  departments: Array<{ id: number; department_name: string; branch_id: number }>
  designations: Array<{ id: number; designation_name: string; branch_id: number; department_id: number }>
  leave_types: Array<{ id: number; name: string }>
  award_types: Array<{ id: number; name: string }>
  loan_types: Array<{ id: number; name: string }>
  termination_types: Array<{ id: number; name: string }>
  warning_types: Array<{ id: number; name: string }>
  complaint_types: Array<{ id: number; name: string }>
  document_categories: Array<{ id: number; name: string }>
  announcement_categories: Array<{ id: number; name: string }>
  event_types: Array<{ id: number; name: string }>
  hrm_documents: Array<{ id: number; title: string }>
  employees: Array<{ id: number; name: string; email?: string }>
}

export async function fetchHrmMeta(): Promise<HrmMeta> {
  const { data } = await api.get<ApiSuccess<HrmMeta>>('/hrm/create-meta')
  return data.data
}

export async function listBranches() {
  const { data } = await api.get<ApiSuccess<unknown>>('/hrm/branches')
  return extractListRows<{ id: number; branch_name: string }>(data)
}

export async function createBranch(payload: { branch_name: string }) {
  const { data } = await api.post<ApiSuccess<{ id: number; branch_name: string }>>('/hrm/branches', payload)
  return data.data
}

export async function listDepartments() {
  const { data } = await api.get<ApiSuccess<unknown>>('/hrm/departments')
  return extractListRows<{ id: number; department_name: string; branch?: { branch_name: string } }>(data)
}

export async function createDepartment(payload: { department_name: string; branch_id: number }) {
  const { data } = await api.post<ApiSuccess<{ id: number; department_name: string }>>('/hrm/departments', payload)
  return data.data
}

export async function listDesignations() {
  const { data } = await api.get<ApiSuccess<unknown>>('/hrm/designations')
  return extractListRows<{ id: number; designation_name: string; branch?: { branch_name: string }; department?: { department_name: string } }>(data)
}

export async function createDesignation(payload: { designation_name: string; branch_id: number; department_id: number }) {
  const { data } = await api.post<ApiSuccess<{ id: number; designation_name: string }>>('/hrm/designations', payload)
  return data.data
}

export async function listShifts() {
  const { data } = await api.get<ApiSuccess<unknown>>('/hrm/shifts')
  return extractListRows<{ id: number; shift_name: string; start_time?: string; end_time?: string }>(data)
}

export async function createShift(payload: { shift_name: string; start_time: string; end_time: string }) {
  const { data } = await api.post<ApiSuccess<{ id: number; shift_name: string }>>('/hrm/shifts', payload)
  return data.data
}

export async function listLeaveTypes() {
  const { data } = await api.get<ApiSuccess<unknown>>('/hrm/leave-types')
  return extractListRows<{ id: number; name: string }>(data)
}

export async function createLeaveType(payload: { name: string; description?: string; max_days_per_year?: number }) {
  const { data } = await api.post<ApiSuccess<{ id: number; name: string }>>('/hrm/leave-types', payload)
  return data.data
}

export type LeaveApplicationRow = {
  id: number
  status: string
  start_date?: string
  end_date?: string
  total_days?: number
  reason?: string
  attachment?: string | null
  approver_comment?: string
  approved_at?: string
  employee?: { id?: number; name: string; email?: string }
  leave_type?: { id?: number; name: string }
  approved_by?: { id?: number; name: string }
}

export type LeaveApplicationFormValues = {
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  reason: string
  attachment?: File | null
  remove_attachment?: boolean
}

function buildLeaveApplicationFormData(values: LeaveApplicationFormValues): FormData {
  const form = new FormData()
  form.append('employee_id', values.employee_id)
  form.append('leave_type_id', values.leave_type_id)
  form.append('start_date', values.start_date)
  form.append('end_date', values.end_date)
  form.append('reason', values.reason)
  if (values.attachment) {
    form.append('attachment', values.attachment)
  }
  if (values.remove_attachment) {
    form.append('remove_attachment', '1')
  }
  return form
}

export type LeaveBalance = {
  total_leaves: number
  approved_leaves: number
  pending_leaves: number
  used_leaves: number
  available_leaves: number
}

export type AttendanceRow = {
  id: number
  date?: string
  clock_in?: string
  clock_out?: string
  break_hour?: number | string
  total_hour?: number | string
  status?: string
  notes?: string
  employee_id?: number
  user?: { id: number; name: string; email?: string }
  shift?: { id: number; shift_name: string }
}

export async function listAttendances(params?: Record<string, string>) {
  const { data } = await api.get<ApiSuccess<unknown>>('/hrm/attendances', { params: { per_page: 100, ...params } })
  return extractListRows<AttendanceRow>(data)
}

export async function listAttendancesPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<AttendanceRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/hrm/attendances', { params })
  return extractPaginatedList<AttendanceRow>(data)
}

export type BulkMarkAttendanceResult = {
  created: number[]
  skipped: Array<{ employee_id: number; reason: string }>
}

export async function bulkMarkAttendances(payload: {
  date: string
  status: 'present' | 'half day' | 'absent'
  employee_ids: number[]
  notes?: string
  skip_existing?: boolean
}) {
  const { data } = await api.post<ApiSuccess<BulkMarkAttendanceResult>>('/hrm/attendances/bulk-mark', payload)
  return data.data
}

export type AssignShiftResult = {
  shift_id: number
  shift_name: string
  updated: number
}

export async function assignEmployeeShift(payload: { shift_id: number; employee_ids: number[] }) {
  const { data } = await api.post<ApiSuccess<AssignShiftResult>>('/hrm/employees/assign-shift', payload)
  return data.data
}

export async function createAttendance(payload: {
  employee_id: number
  date: string
  clock_in: string
  clock_out: string
  break_hour?: number
  notes?: string
  status?: string
}) {
  const { data } = await api.post<ApiSuccess<AttendanceRow>>('/hrm/attendances', payload)
  return data.data
}

export async function updateAttendance(id: number, payload: {
  employee_id: number
  date: string
  clock_in: string
  clock_out: string
  break_hour?: number
  notes?: string
  status?: string
}) {
  const { data } = await api.put<ApiSuccess<AttendanceRow>>(`/hrm/attendances/${id}`, payload)
  return data.data
}

export async function deleteAttendance(id: number) {
  await api.delete(`/hrm/attendances/${id}`)
}

export async function listLeaveApplications(params?: Record<string, string>) {
  const { data } = await api.get<ApiSuccess<unknown>>('/hrm/leave-applications', { params: { per_page: 100, ...params } })
  return extractListRows<LeaveApplicationRow>(data)
}

export async function getLeaveApplication(id: number | string) {
  const { data } = await api.get<ApiSuccess<LeaveApplicationRow>>(`/hrm/leave-applications/${id}`)
  return data.data
}

export async function createLeaveApplication(values: LeaveApplicationFormValues) {
  const { data } = await api.post<ApiSuccess<LeaveApplicationRow>>(
    '/hrm/leave-applications',
    buildLeaveApplicationFormData(values),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data.data
}

export async function updateLeaveApplication(id: number, values: LeaveApplicationFormValues) {
  const { data } = await api.put<ApiSuccess<LeaveApplicationRow>>(
    `/hrm/leave-applications/${id}`,
    buildLeaveApplicationFormData(values),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data.data
}

export async function updateLeaveApplicationStatus(
  id: number,
  payload: { status: 'pending' | 'approved' | 'rejected'; approver_comment?: string },
) {
  const { data } = await api.put<ApiSuccess<LeaveApplicationRow>>(`/hrm/leave-applications/${id}/status`, payload)
  return data.data
}

export async function deleteLeaveApplication(id: number) {
  await api.delete(`/hrm/leave-applications/${id}`)
}

export async function fetchLeaveBalance(params: {
  employee_id: number
  leave_type_id: number
  exclude_id?: number
}) {
  const { data } = await api.get<ApiSuccess<LeaveBalance>>('/hrm/leave-balance', { params })
  return data.data
}

export type LeaveBalanceEmployeeRow = {
  employee_id: number
  employee_name: string
  avatar?: string | null
  leave_types: Array<{
    leave_type_name: string
    leave_type_color?: string | null
    total_days: number
    used_days: number
    available_days: number
  }>
}

export async function fetchLeaveBalanceIndex(): Promise<LeaveBalanceEmployeeRow[]> {
  const { data } = await api.get<ApiSuccess<LeaveBalanceEmployeeRow[]>>('/hrm/leave-balance/index')
  return data.data ?? []
}

export async function updateLeaveType(
  id: number,
  payload: { name: string; description?: string; max_days_per_year?: number },
) {
  const { data } = await api.put<ApiSuccess<{ id: number; name: string }>>(`/hrm/leave-types/${id}`, payload)
  return data.data
}

export async function deleteLeaveType(id: number) {
  await api.delete(`/hrm/leave-types/${id}`)
}

export type EmployeeCreateMeta = {
  users: Array<{ id: number; name: string }>
  branches: Array<{ id: number; branch_name: string }>
  departments: Array<{ id: number; department_name: string; branch_id: number }>
  designations: Array<{ id: number; designation_name: string; branch_id: number; department_id: number }>
  shifts: Array<{ id: number; shift_name: string }>
  document_types: Array<{ id: number; document_name: string; is_required?: boolean }>
  generated_employee_id: string
}

export type EmployeeDocumentRow = {
  id: number
  document_type_id: number
  file_path: string
  document_type?: { id: number; document_name: string }
}

export type EmployeeDetail = {
  id: number
  employee_id: string
  date_of_birth?: string
  date_of_joining?: string
  gender?: string
  employment_type?: string
  avatar?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  emergency_contact_name?: string
  emergency_contact_relationship?: string
  emergency_contact_number?: string
  bank_name?: string
  account_holder_name?: string
  account_number?: string
  bank_identifier_code?: string
  bank_branch?: string
  tax_payer_id?: string
  basic_salary?: number | string
  hours_per_day?: number | string
  days_per_week?: number | string
  rate_per_hour?: number | string
  user_id?: number
  branch_id?: number
  department_id?: number
  designation_id?: number
  shift?: number | { id: number; shift_name: string }
  user?: { id: number; name: string; email?: string; avatar?: string; is_disable?: boolean }
  branch?: { branch_name: string }
  department?: { department_name: string }
  designation?: { designation_name: string }
  documents?: EmployeeDocumentRow[]
}

export type EmployeeRow = Pick<
  EmployeeDetail,
  | 'id'
  | 'employee_id'
  | 'employment_type'
  | 'date_of_joining'
  | 'gender'
  | 'user'
  | 'branch'
  | 'department'
  | 'designation'
  | 'shift'
>

export type EmployeeEditMeta = EmployeeCreateMeta & {
  employee: EmployeeDetail
}

export async function fetchEmployeeCreateMeta() {
  const { data } = await api.get<ApiSuccess<EmployeeCreateMeta>>('/hrm/employees/create-meta')
  return data.data
}

export async function listEmployees(params?: Record<string, string>) {
  const { data } = await api.get<ApiSuccess<unknown>>('/hrm/employees', { params: { per_page: 100, ...params } })
  return extractListRows<EmployeeRow>(data)
}

export async function listEmployeesPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<EmployeeRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/hrm/employees', { params })
  return extractPaginatedList<EmployeeRow>(data)
}

export async function deleteEmployee(id: number | string) {
  await api.delete(`/hrm/employees/${id}`)
}

export async function getEmployee(id: string | number) {
  const { data } = await api.get<ApiSuccess<EmployeeDetail>>(`/hrm/employees/${id}`)
  return data.data
}

export async function fetchEmployeeEditMeta(id: string | number) {
  const { data } = await api.get<ApiSuccess<EmployeeEditMeta>>(`/hrm/employees/${id}/edit-meta`)
  return data.data
}

export async function createEmployee(formData: FormData) {
  const { data } = await api.post<ApiSuccess<EmployeeDetail>>('/hrm/employees', formData)
  return data.data
}

export async function updateEmployee(id: string | number, formData: FormData) {
  return submitFormDataUpdate<EmployeeDetail>(`/hrm/employees/${id}`, formData)
}

export type AwardRow = {
  id: number
  employee_id?: number
  award_type_id?: number
  award_date?: string
  employee?: { name?: string; email?: string }
  award_type?: { name?: string }
}

export type PromotionRow = {
  id: number
  employee_id?: number
  effective_date?: string
  reason?: string
  status?: string
  employee?: { name?: string; email?: string }
  previous_branch?: { branch_name?: string }
  previous_department?: { department_name?: string }
  previous_designation?: { designation_name?: string }
  current_branch?: { branch_name?: string }
  current_department?: { department_name?: string }
  current_designation?: { designation_name?: string }
}

export async function listAwards() {
  const { data } = await api.get<ApiSuccess<unknown>>('/hrm/awards')
  return extractListRows<AwardRow>(data.data)
}

export async function listPromotions() {
  const { data } = await api.get<ApiSuccess<unknown>>('/hrm/promotions')
  return extractListRows<PromotionRow>(data.data)
}

async function fetchHrmRecord<T>(endpoint: string, id: number): Promise<T> {
  const { data } = await api.get<ApiSuccess<T>>(`/hrm/${endpoint}/${id}`)
  return data.data
}

export type AwardDetail = AwardRow & { description?: string; certificate?: string | null }

export type ResignationDetail = {
  id: number
  employee_id?: number
  last_working_date?: string
  reason?: string
  description?: string
  status?: string
  employee?: { name?: string; email?: string }
  approved_by?: { id?: number; name?: string }
}

export type TerminationDetail = {
  id: number
  employee_id?: number
  notice_date?: string
  termination_date?: string
  reason?: string
  description?: string
  status?: string
  employee?: { name?: string; email?: string }
  termination_type?: { termination_type?: string }
}

export type WarningDetail = {
  id: number
  employee_id?: number
  subject?: string
  warning_date?: string
  severity?: string
  description?: string
  employee?: { name?: string; email?: string }
  warning_type?: { warning_type_name?: string }
}

export type ComplaintDetail = {
  id: number
  employee_id?: number
  against_employee_id?: number
  subject?: string
  complaint_date?: string
  description?: string
  status?: string
  employee?: { name?: string; email?: string }
  against_employee?: { name?: string; email?: string }
  complaint_type?: { complaint_type?: string }
}

export type EmployeeTransferDetail = {
  id: number
  employee_id?: number
  effective_date?: string
  transfer_date?: string
  reason?: string
  status?: string
  employee?: { name?: string; email?: string }
  from_branch?: { branch_name?: string }
  from_department?: { department_name?: string }
  from_designation?: { designation_name?: string }
  to_branch?: { branch_name?: string }
  to_department?: { department_name?: string }
  to_designation?: { designation_name?: string }
}

export const getAward = (id: number) => fetchHrmRecord<AwardDetail>('awards', id)
export const getPromotion = (id: number) => fetchHrmRecord<PromotionRow>('promotions', id)
export const getResignation = (id: number) => fetchHrmRecord<ResignationDetail>('resignations', id)
export const getTermination = (id: number) => fetchHrmRecord<TerminationDetail>('terminations', id)
export const getWarning = (id: number) => fetchHrmRecord<WarningDetail>('warnings', id)
export const getComplaint = (id: number) => fetchHrmRecord<ComplaintDetail>('complaints', id)
export const getEmployeeTransfer = (id: number) =>
  fetchHrmRecord<EmployeeTransferDetail>('employee-transfers', id)

export type AnnouncementDetail = {
  id: number
  title?: string
  description?: string
  start_date?: string
  end_date?: string
  priority?: string
  status?: string
  announcement_category?: { announcement_category?: string }
  approved_by?: { name?: string }
}

export type EventDetail = {
  id: number
  title?: string
  description?: string
  start_date?: string
  end_date?: string
  start_time?: string
  end_time?: string
  location?: string
  status?: string
  event_type?: { event_type?: string }
}

export type HrmDocumentDetail = {
  id: number
  title?: string
  description?: string
  document?: string | null
  document_category_id?: number
  effective_date?: string
  status?: string
  document_category?: { document_type?: string }
  uploaded_by?: { name?: string; email?: string }
  approved_by?: { name?: string }
}

export type AcknowledgmentDetail = {
  id: number
  status?: string
  acknowledgment_note?: string
  employee?: { name?: string; email?: string }
  document?: { id?: number; title?: string; document?: string | null; description?: string }
}

export const getAnnouncement = (id: number) => fetchHrmRecord<AnnouncementDetail>('announcements', id)
export const getEvent = (id: number) => fetchHrmRecord<EventDetail>('events', id)
export const getHrmDocument = (id: number) => fetchHrmRecord<HrmDocumentDetail>('documents', id)
export const getAcknowledgment = (id: number) => fetchHrmRecord<AcknowledgmentDetail>('acknowledgments', id)

export async function createHrmDocument(formData: FormData) {
  const { data } = await api.post<ApiSuccess<HrmDocumentDetail>>('/hrm/documents', formData)
  return data.data
}

export async function updateHrmDocument(id: number, formData: FormData) {
  return submitFormDataUpdate<HrmDocumentDetail>(`/hrm/documents/${id}`, formData)
}

export type SalaryComponentType = { id: number; name: string }

export type AllowanceRow = {
  id: number
  allowance_type_id?: number
  type?: string
  amount?: number | string
  allowance_type?: { name?: string }
}

export type DeductionRow = {
  id: number
  deduction_type_id?: number
  type?: string
  amount?: number | string
  deduction_type?: { name?: string }
}

export type OvertimeRow = {
  id: number
  title?: string
  total_days?: number
  hours?: number | string
  rate?: number | string
  start_date?: string
  end_date?: string
  notes?: string
  status?: string
}

export type SetSalaryShowPayload = {
  employee: EmployeeDetail
  allowance_types: SalaryComponentType[]
  deduction_types: SalaryComponentType[]
  loan_types: SalaryComponentType[]
  allowances: AllowanceRow[]
  deductions: DeductionRow[]
  loans: Array<{
    id: number
    title?: string
    amount?: number | string
    type?: string
    start_date?: string
    end_date?: string
    loan_type?: { name?: string }
  }>
  overtimes: OvertimeRow[]
}

export async function fetchSetSalaryShow(employeeId: number | string) {
  const { data } = await api.get<ApiSuccess<SetSalaryShowPayload>>(`/hrm/set-salary/${employeeId}`)
  return data.data
}

export async function updateSetSalaryBasic(employeeId: number | string, basicSalary: number) {
  const { data } = await api.put<ApiSuccess<EmployeeDetail>>(`/hrm/set-salary/${employeeId}`, {
    basic_salary: basicSalary,
  })
  return data.data
}

export async function createSetSalaryAllowance(
  employeeId: number | string,
  payload: { allowance_type_id: number; type: string; amount: number },
) {
  const { data } = await api.post<ApiSuccess<AllowanceRow>>(`/hrm/set-salary/${employeeId}/allowances`, payload)
  return data.data
}

export async function updateSetSalaryAllowance(
  employeeId: number | string,
  allowanceId: number,
  payload: Partial<{ allowance_type_id: number; type: string; amount: number }>,
) {
  const { data } = await api.put<ApiSuccess<AllowanceRow>>(
    `/hrm/set-salary/${employeeId}/allowances/${allowanceId}`,
    payload,
  )
  return data.data
}

export async function deleteSetSalaryAllowance(employeeId: number | string, allowanceId: number) {
  await api.delete(`/hrm/set-salary/${employeeId}/allowances/${allowanceId}`)
}

export async function createSetSalaryDeduction(
  employeeId: number | string,
  payload: { deduction_type_id: number; type: string; amount: number },
) {
  const { data } = await api.post<ApiSuccess<DeductionRow>>(`/hrm/set-salary/${employeeId}/deductions`, payload)
  return data.data
}

export async function updateSetSalaryDeduction(
  employeeId: number | string,
  deductionId: number,
  payload: Partial<{ deduction_type_id: number; type: string; amount: number }>,
) {
  const { data } = await api.put<ApiSuccess<DeductionRow>>(
    `/hrm/set-salary/${employeeId}/deductions/${deductionId}`,
    payload,
  )
  return data.data
}

export async function deleteSetSalaryDeduction(employeeId: number | string, deductionId: number) {
  await api.delete(`/hrm/set-salary/${employeeId}/deductions/${deductionId}`)
}

export async function createSetSalaryOvertime(
  employeeId: number | string,
  payload: {
    title: string
    total_days: number
    hours: number
    rate: number
    start_date: string
    end_date?: string
    notes?: string
    status?: string
  },
) {
  const { data } = await api.post<ApiSuccess<OvertimeRow>>(`/hrm/set-salary/${employeeId}/overtimes`, payload)
  return data.data
}

export async function updateSetSalaryOvertime(
  employeeId: number | string,
  overtimeId: number,
  payload: Partial<{
    title: string
    total_days: number
    hours: number
    rate: number
    start_date: string
    end_date?: string
    notes?: string
    status?: string
  }>,
) {
  const { data } = await api.put<ApiSuccess<OvertimeRow>>(
    `/hrm/set-salary/${employeeId}/overtimes/${overtimeId}`,
    payload,
  )
  return data.data
}

export async function deleteSetSalaryOvertime(employeeId: number | string, overtimeId: number) {
  await api.delete(`/hrm/set-salary/${employeeId}/overtimes/${overtimeId}`)
}

export type PayrollRow = {
  id: number
  title?: string
  payroll_frequency?: string
  pay_period_start?: string
  pay_period_end?: string
  pay_date?: string
  status?: string
  is_payroll_paid?: string
  total_gross_pay?: number | string
  total_deductions?: number | string
  total_net_pay?: number | string
  employee_count?: number
  notes?: string
}

export type PayrollEntryRow = {
  id: number
  payroll_id?: number
  employee_id?: number
  basic_salary?: number | string
  total_allowances?: number | string
  total_manual_overtimes?: number | string
  total_deductions?: number | string
  total_loans?: number | string
  gross_pay?: number | string
  net_pay?: number | string
  attendance_overtime_amount?: number | string
  working_days?: number
  present_days?: number
  half_days?: number | string
  absent_days?: number
  paid_leave_days?: number
  unpaid_leave_days?: number
  overtime_hours?: number | string
  per_day_salary?: number | string
  unpaid_leave_deduction?: number | string
  half_day_deduction?: number | string
  absent_day_deduction?: number | string
  allowances_breakdown?: Record<string, number>
  deductions_breakdown?: Record<string, number>
  manual_overtimes_breakdown?: Record<string, number>
  loans_breakdown?: Record<string, number>
  status?: string
  employee?: {
    user?: { name?: string; email?: string }
    designation?: { designation_name?: string }
  }
}

export type PayrollDetail = PayrollRow & {
  payroll_entries?: PayrollEntryRow[]
}

export type PayrollEntryDetail = PayrollEntryRow & {
  payroll?: PayrollRow
}

export async function listPayrollsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<PayrollRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/hrm/payrolls', { params })
  return extractPaginatedList<PayrollRow>(data)
}

export async function getPayroll(id: number | string) {
  const { data } = await api.get<ApiSuccess<PayrollDetail>>(`/hrm/payrolls/${id}`)
  return data.data
}

export async function createPayroll(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<PayrollRow>>('/hrm/payrolls', payload)
  return data.data
}

export async function updatePayroll(id: number | string, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<PayrollRow>>(`/hrm/payrolls/${id}`, payload)
  return data.data
}

export async function deletePayroll(id: number | string) {
  await api.delete(`/hrm/payrolls/${id}`)
}

export async function runPayroll(id: number | string) {
  const { data } = await api.post<
    ApiSuccess<{ payroll: PayrollDetail; new_entries: number; total_entries: number }>
  >(`/hrm/payrolls/${id}/run`)
  return data.data
}

export async function getPayrollEntry(id: number | string) {
  const { data } = await api.get<ApiSuccess<PayrollEntryDetail>>(`/hrm/payroll-entries/${id}`)
  return data.data
}

export async function deletePayrollEntry(id: number | string) {
  await api.delete(`/hrm/payroll-entries/${id}`)
}

export async function payPayrollEntry(id: number | string) {
  const { data } = await api.patch<ApiSuccess<PayrollEntryRow>>(`/hrm/payroll-entries/${id}/pay`)
  return data.data
}
