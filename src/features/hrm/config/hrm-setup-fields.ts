import type { CrudFieldDef } from '@/features/shared/components/CrudFormDialog'

export const HRM_SETUP_FIELDS: Record<string, CrudFieldDef[]> = {
  'employee-document-types': [
    { name: 'document_name', label: 'Document name', required: true },
    { name: 'description', label: 'Description' },
    { name: 'is_required', label: 'Required', type: 'checkbox' },
  ],
  'award-types': [
    { name: 'name', label: 'Name', required: true },
    { name: 'description', label: 'Description' },
  ],
  'termination-types': [{ name: 'termination_type', label: 'Termination type', required: true }],
  'warning-types': [{ name: 'warning_type_name', label: 'Warning type', required: true }],
  'complaint-types': [{ name: 'complaint_type', label: 'Complaint type', required: true }],
  'holiday-types': [{ name: 'holiday_type', label: 'Holiday type', required: true }],
  'document-categories': [
    { name: 'document_type', label: 'Document type', required: true },
    { name: 'status', label: 'Active', type: 'checkbox' },
  ],
  'announcement-categories': [
    { name: 'announcement_category', label: 'Category', required: true },
  ],
  'event-types': [{ name: 'event_type', label: 'Event type', required: true }],
  'allowance-types': [
    { name: 'name', label: 'Name', required: true },
    { name: 'description', label: 'Description' },
  ],
  'deduction-types': [
    { name: 'name', label: 'Name', required: true },
    { name: 'description', label: 'Description' },
  ],
  'loan-types': [
    { name: 'name', label: 'Name', required: true },
    { name: 'description', label: 'Description' },
  ],
  'ip-restricts': [{ name: 'ip', label: 'IP address', required: true }],
}
