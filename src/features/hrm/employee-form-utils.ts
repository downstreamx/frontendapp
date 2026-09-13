export type DocumentRow = {
  document_type_id: string
  file: File | null
}

export type EmployeeFormState = {
  employee_id: string
  date_of_birth: string
  avatar: string
  gender: string
  shift_id: string
  date_of_joining: string
  employment_type: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  country: string
  postal_code: string
  emergency_contact_name: string
  emergency_contact_relationship: string
  emergency_contact_number: string
  bank_name: string
  account_holder_name: string
  account_number: string
  bank_identifier_code: string
  bank_branch: string
  tax_payer_id: string
  basic_salary: string
  hours_per_day: string
  days_per_week: string
  rate_per_hour: string
  user_id: string
  branch_id: string
  department_id: string
  designation_id: string
  documents: DocumentRow[]
}

export const initialEmployeeFormState: EmployeeFormState = {
  employee_id: '',
  date_of_birth: '',
  avatar: '',
  gender: 'Male',
  shift_id: '',
  date_of_joining: '',
  employment_type: 'Full Time',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  country: '',
  postal_code: '',
  emergency_contact_name: '',
  emergency_contact_relationship: '',
  emergency_contact_number: '',
  bank_name: '',
  account_holder_name: '',
  account_number: '',
  bank_identifier_code: '',
  bank_branch: '',
  tax_payer_id: '',
  basic_salary: '',
  hours_per_day: '',
  days_per_week: '',
  rate_per_hour: '',
  user_id: '',
  branch_id: '',
  department_id: '',
  designation_id: '',
  documents: [{ document_type_id: '', file: null }],
}

function dateInputValue(value?: string | null): string {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function relationId(
  employee: Record<string, unknown>,
  field: string,
  relation?: string,
): string {
  const nestedKey = relation ?? field
  const direct = employee[field]

  if (direct != null && direct !== '') {
    if (typeof direct === 'object' && 'id' in direct) {
      return String((direct as { id: number }).id)
    }
    if (typeof direct !== 'object') {
      return String(direct)
    }
  }

  const nested = employee[nestedKey]
  if (nested && typeof nested === 'object' && 'id' in nested) {
    return String((nested as { id: number }).id)
  }

  return ''
}

function shiftIdFromEmployee(employee: Record<string, unknown>): string {
  return relationId(employee, 'shift_id', 'shift') || relationId(employee, 'shift')
}

export function employeeToFormState(employee: Record<string, unknown>): EmployeeFormState {
  const user = employee.user as { avatar?: string } | undefined

  return {
    employee_id: String(employee.employee_id ?? ''),
    date_of_birth: dateInputValue(employee.date_of_birth as string),
    avatar: String(employee.avatar ?? user?.avatar ?? ''),
    gender: String(employee.gender ?? 'Male'),
    shift_id: shiftIdFromEmployee(employee),
    date_of_joining: dateInputValue(employee.date_of_joining as string),
    employment_type: String(employee.employment_type ?? 'Full Time'),
    address_line_1: String(employee.address_line_1 ?? ''),
    address_line_2: String(employee.address_line_2 ?? ''),
    city: String(employee.city ?? ''),
    state: String(employee.state ?? ''),
    country: String(employee.country ?? ''),
    postal_code: String(employee.postal_code ?? ''),
    emergency_contact_name: String(employee.emergency_contact_name ?? ''),
    emergency_contact_relationship: String(employee.emergency_contact_relationship ?? ''),
    emergency_contact_number: String(employee.emergency_contact_number ?? ''),
    bank_name: String(employee.bank_name ?? ''),
    account_holder_name: String(employee.account_holder_name ?? ''),
    account_number: String(employee.account_number ?? ''),
    bank_identifier_code: String(employee.bank_identifier_code ?? ''),
    bank_branch: String(employee.bank_branch ?? ''),
    tax_payer_id: String(employee.tax_payer_id ?? ''),
    basic_salary: employee.basic_salary != null ? String(employee.basic_salary) : '',
    hours_per_day: employee.hours_per_day != null ? String(employee.hours_per_day) : '',
    days_per_week: employee.days_per_week != null ? String(employee.days_per_week) : '',
    rate_per_hour: employee.rate_per_hour != null ? String(employee.rate_per_hour) : '',
    user_id: relationId(employee, 'user_id', 'user'),
    branch_id: relationId(employee, 'branch_id', 'branch'),
    department_id: relationId(employee, 'department_id', 'department'),
    designation_id: relationId(employee, 'designation_id', 'designation'),
    documents: [{ document_type_id: '', file: null }],
  }
}

export function buildEmployeeFormData(data: EmployeeFormState, options?: { isEdit?: boolean }): FormData {
  const formData = new FormData()
  const skip = new Set<keyof EmployeeFormState>(['documents'])

  if (options?.isEdit) {
    skip.add('employee_id')
    skip.add('user_id')
  }

  ;(Object.keys(data) as Array<keyof EmployeeFormState>).forEach((key) => {
    if (skip.has(key)) return
    const value = data[key]
    if (typeof value === 'string' && value !== '') {
      formData.append(key, value)
    }
  })

  data.documents.forEach((document, index) => {
    if (document.document_type_id) {
      formData.append(`documents[${index}][document_type_id]`, document.document_type_id)
    }
    if (document.file) {
      formData.append(`documents[${index}][file]`, document.file)
    }
  })

  return formData
}
