const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  '0': 'Full Time',
  '1': 'Part Time',
  '2': 'Temporary',
  '3': 'Contract',
  'Full Time': 'Full Time',
  'Part Time': 'Part Time',
  Temporary: 'Temporary',
  Contract: 'Contract',
}

const GENDER_LABELS: Record<string, string> = {
  '0': 'Male',
  '1': 'Female',
  '2': 'Other',
  Male: 'Male',
  Female: 'Female',
  Other: 'Other',
}

export function formatEmploymentType(value: string | null | undefined): string {
  if (value == null || value === '') return '—'
  return EMPLOYMENT_TYPE_LABELS[value] ?? value
}

export function formatEmployeeGender(value: string | null | undefined): string {
  if (value == null || value === '') return '—'
  return GENDER_LABELS[value] ?? value
}

export function exportEmployeesCsv(
  rows: Array<{
    employee_id?: string
    user?: { name?: string; email?: string }
    branch?: { branch_name?: string }
    department?: { department_name?: string }
    designation?: { designation_name?: string }
    employment_type?: string
    date_of_joining?: string
  }>,
  filename = 'employees.csv',
): void {
  const headers = [
    'Employee ID',
    'Name',
    'Email',
    'Branch',
    'Department',
    'Designation',
    'Employment Type',
    'Date of Joining',
  ]
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      [
        row.employee_id ?? '',
        row.user?.name ?? '',
        row.user?.email ?? '',
        row.branch?.branch_name ?? '',
        row.department?.department_name ?? '',
        row.designation?.designation_name ?? '',
        formatEmploymentType(row.employment_type),
        row.date_of_joining ?? '',
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(','),
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
