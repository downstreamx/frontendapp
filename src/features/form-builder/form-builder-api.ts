import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type FormListItem = {
  id: number
  name: string
  code?: string
  is_active?: boolean
  default_layout?: string
  fields_count?: number
  responses_count?: number
  created_at?: string
  updated_at?: string
}

export type FormsIndexMeta = {
  active_options: Array<{ value: string; label: string }>
}

export async function fetchFormsIndexMeta() {
  const { data } = await api.get<ApiSuccess<FormsIndexMeta>>('/form-builder/forms/index-meta')
  return data.data
}

export async function listFormsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<FormListItem>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/form-builder/forms', { params })
  return extractPaginatedList<FormListItem>(data)
}

export async function createForm(payload: { name: string; is_active?: boolean; default_layout?: string }) {
  const { data } = await api.post<ApiSuccess<FormListItem>>('/form-builder/forms', payload)
  return data.data
}

export async function updateForm(
  id: number,
  payload: Partial<{ name: string; is_active: boolean; default_layout: string }>,
) {
  const { data } = await api.put<ApiSuccess<FormListItem>>(`/form-builder/forms/${id}`, payload)
  return data.data
}

export async function deleteForm(id: number) {
  await api.delete(`/form-builder/forms/${id}`)
}

export type FormFieldRow = {
  id: number
  label: string
  type: string
  required?: boolean
  placeholder?: string
  options?: string[] | null
  order?: number
}

export async function listFormFields(formId: number | string) {
  const { data } = await api.get<ApiSuccess<FormFieldRow[]>>(`/form-builder/forms/${formId}/fields`)
  return data.data
}

export async function createFormField(
  formId: number | string,
  payload: { label: string; type: string; required?: boolean; placeholder?: string; options?: string[] },
) {
  const { data } = await api.post<ApiSuccess<FormFieldRow>>(`/form-builder/forms/${formId}/fields`, payload)
  return data.data
}

export async function updateFormField(
  formId: number | string,
  fieldId: number,
  payload: Partial<{ label: string; type: string; required: boolean; placeholder: string; order: number }>,
) {
  const { data } = await api.put<ApiSuccess<FormFieldRow>>(
    `/form-builder/forms/${formId}/fields/${fieldId}`,
    payload,
  )
  return data.data
}

export async function deleteFormField(formId: number | string, fieldId: number) {
  await api.delete(`/form-builder/forms/${formId}/fields/${fieldId}`)
}

export const FORM_FIELD_TYPES = [
  'text',
  'email',
  'number',
  'textarea',
  'select',
  'checkbox',
  'date',
] as const
