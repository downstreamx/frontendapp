import { z } from 'zod'

const documentRowSchema = z.object({
  document_type_id: z.string(),
  file: z.custom<File | null>(),
})

export const employeeFormSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  avatar: z.string().optional(),
  gender: z.string().min(1, 'Gender is required'),
  shift_id: z.string().min(1, 'Shift is required'),
  date_of_joining: z.string().optional(),
  employment_type: z.string().min(1, 'Employment type is required'),
  address_line_1: z.string().min(1, 'Address is required'),
  address_line_2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  emergency_contact_name: z.string().min(1, 'Emergency contact name is required'),
  emergency_contact_relationship: z.string().min(1, 'Relationship is required'),
  emergency_contact_number: z.string().min(1, 'Emergency contact number is required'),
  bank_name: z.string().min(1, 'Bank name is required'),
  account_holder_name: z.string().min(1, 'Account holder name is required'),
  account_number: z.string().min(1, 'Account number is required'),
  bank_identifier_code: z.string().min(1, 'Bank identifier code is required'),
  bank_branch: z.string().min(1, 'Bank branch is required'),
  tax_payer_id: z.string().optional(),
  basic_salary: z.string().min(1, 'Basic salary is required'),
  hours_per_day: z.string().min(1, 'Hours per day is required'),
  days_per_week: z.string().min(1, 'Days per week is required'),
  rate_per_hour: z.string().min(1, 'Rate per hour is required'),
  user_id: z.string().optional(),
  first_name: z.string().optional(),
  middle_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().optional(),
  mobile_no: z.string().optional(),
  password: z.string().optional(),
  password_confirmation: z.string().optional(),
  role_id: z.string().optional(),
  is_enable_login: z.boolean().optional(),
  branch_id: z.string().min(1, 'Branch is required'),
  department_id: z.string().min(1, 'Department is required'),
  designation_id: z.string().min(1, 'Designation is required'),
  documents: z.array(documentRowSchema),
})

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>

type TabId = 'personal' | 'employment' | 'contact' | 'banking' | 'hours' | 'documents'

const inlineUserFields = {
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('A valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  password_confirmation: z.string().min(1, 'Confirm password'),
}

const employeeCreateWithInlineUserSchema = employeeFormSchema.extend(inlineUserFields)

const employeeCreateWithInlineUserAndRoleSchema = employeeFormSchema.extend({
  ...inlineUserFields,
  role_id: z.string().min(1, 'Role is required'),
})

export function validateEmployeeForm(
  data: EmployeeFormValues,
  options: { isEdit: boolean; requireRole?: boolean },
): { success: true } | { success: false; message: string; tab?: TabId } {
  const schema = options.isEdit
    ? employeeFormSchema
    : options.requireRole
      ? employeeCreateWithInlineUserAndRoleSchema
      : employeeCreateWithInlineUserSchema

  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const path = first.path[0]
    const tab: TabId | undefined =
      path === 'role_id' || path === 'shift_id' || path === 'branch_id'
        ? 'employment'
        : path === 'first_name' ||
            path === 'last_name' ||
            path === 'email' ||
            path === 'password' ||
            path === 'password_confirmation' ||
            path === 'date_of_birth' ||
            path === 'gender'
          ? 'personal'
          : undefined
    return { success: false, message: first.message, tab }
  }

  if (!options.isEdit && data.password !== data.password_confirmation) {
    return { success: false, message: 'Password confirmation does not match.', tab: 'personal' }
  }

  if (!options.isEdit) {
    const hasDoc = data.documents.some((d) => d.document_type_id && d.file)
    if (!hasDoc) {
      return {
        success: false,
        message: 'Add at least one document with a type and file.',
        tab: 'documents',
      }
    }
  }

  return { success: true }
}
