import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

const base = '/vendor-management'

export type VmVendor = {
  id: number
  name: string
  code?: string | null
  tax_id?: string | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  capabilities?: string | null
  performance_tags?: string[] | null
  performance_rating?: number | null
  notes?: string | null
  is_active?: boolean
  address?: string | null
  /** True when a company supplier already exists for this vendor's contact email. */
  is_supplier?: boolean
}

export type VmTender = {
  id: number
  name: string
  code: string
  description?: string | null
  submission_deadline?: string | null
  status: string
  stakeholder_user_ids?: number[] | null
  allow_multi_award?: boolean
  line_items_count?: number
  tender_vendors_count?: number
  line_items?: VmLineItem[]
  documents?: VmDocument[]
  stages?: VmStage[]
  score_criteria?: VmCriterion[]
  tender_vendors?: VmTenderVendor[]
}

export type VmLineItem = {
  id: number
  item_type?: 'product' | 'service' | string | null
  description: string
  quantity: number | string
  unit?: string | null
  specifications?: string | null
  sort_order?: number
}

export type VmDocument = {
  id: number
  title: string
  file_path: string
  original_name?: string | null
  visible_to_vendors?: boolean
  url?: string
}

export type VmStage = {
  id: number
  name: string
  slug: string
  sort_order: number
  color?: string | null
  is_terminal?: boolean
}

export type VmTenderVendor = {
  id: number
  vendor_id: number
  stage_id?: number | null
  invited_at?: string | null
  submitted_at?: string | null
  outcome_email_type?: string | null
  outcome_email_sent_at?: string | null
  vendor?: VmVendor
  stage?: VmStage
  submission?: {
    id: number
    total_amount?: number | string
    execution_days?: number | null
    tracking_ref?: string
    items?: Array<{
      tender_line_item_id: number
      unit_price: number | string
      quantity: number | string
      line_total: number | string
    }>
  }
  scores?: Array<{ criterion_id: number; score: number | string; comment?: string | null }>
}

export type VmCriterion = {
  id: number
  name: string
  weight: number | string
  max_score: number | string
  sort_order?: number
}

export async function listVendorsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<VmVendor>> {
  const { data } = await api.get<ApiSuccess<unknown>>(`${base}/vendors`, { params })
  return extractPaginatedList<VmVendor>(data.data)
}

export async function getVendor(id: number | string) {
  const { data } = await api.get<ApiSuccess<VmVendor>>(`${base}/vendors/${id}`)
  return data.data
}

export async function createVendor(payload: Partial<VmVendor>) {
  const { data } = await api.post<ApiSuccess<VmVendor>>(`${base}/vendors`, payload)
  return data.data
}

export async function updateVendor(id: number | string, payload: Partial<VmVendor>) {
  const { data } = await api.put<ApiSuccess<VmVendor>>(`${base}/vendors/${id}`, payload)
  return data.data
}

export async function deleteVendor(id: number | string) {
  await api.delete(`${base}/vendors/${id}`)
}

export async function importVendors(rows: Array<Record<string, unknown>>) {
  const { data } = await api.post<ApiSuccess<{ created: number; skipped: number }>>(
    `${base}/vendors/import`,
    { rows },
  )
  return data.data
}

export async function convertVendorToSupplier(id: number | string) {
  const { data } = await api.post<
    ApiSuccess<{ supplier: unknown; created: boolean; message?: string }>
  >(`${base}/vendors/${id}/convert-to-supplier`)
  return data.data
}

export async function listTendersPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<VmTender>> {
  const { data } = await api.get<ApiSuccess<unknown>>(`${base}/tenders`, { params })
  return extractPaginatedList<VmTender>(data.data)
}

export async function getTender(id: number | string) {
  const { data } = await api.get<ApiSuccess<{ tender: VmTender; metrics: Record<string, unknown> }>>(
    `${base}/tenders/${id}`,
  )
  return data.data
}

export async function createTender(payload: Partial<VmTender>) {
  const { data } = await api.post<ApiSuccess<VmTender>>(`${base}/tenders`, payload)
  return data.data
}

export async function updateTender(id: number | string, payload: Partial<VmTender>) {
  const { data } = await api.put<ApiSuccess<VmTender>>(`${base}/tenders/${id}`, payload)
  return data.data
}

export async function deleteTender(id: number | string) {
  await api.delete(`${base}/tenders/${id}`)
}

export async function transitionTender(id: number | string, status: string) {
  const { data } = await api.post<ApiSuccess<VmTender>>(`${base}/tenders/${id}/transition`, {
    status,
  })
  return data.data
}

export async function addLineItem(tenderId: number | string, payload: Partial<VmLineItem>) {
  const { data } = await api.post<ApiSuccess<VmLineItem>>(
    `${base}/tenders/${tenderId}/line-items`,
    payload,
  )
  return data.data
}

export async function deleteLineItem(tenderId: number | string, lineItemId: number | string) {
  await api.delete(`${base}/tenders/${tenderId}/line-items/${lineItemId}`)
}

export async function uploadTenderDocument(tenderId: number | string, file: File, title?: string) {
  const form = new FormData()
  form.append('file', file)
  if (title) form.append('title', title)
  form.append('visible_to_vendors', '1')
  const { data } = await api.post<ApiSuccess<VmDocument>>(
    `${base}/tenders/${tenderId}/documents`,
    form,
  )
  return data.data
}

export async function deleteTenderDocument(tenderId: number | string, documentId: number | string) {
  await api.delete(`${base}/tenders/${tenderId}/documents/${documentId}`)
}

export async function updateLineItem(
  tenderId: number | string,
  lineItemId: number | string,
  payload: Partial<VmLineItem>,
) {
  const { data } = await api.put<ApiSuccess<VmLineItem>>(
    `${base}/tenders/${tenderId}/line-items/${lineItemId}`,
    payload,
  )
  return data.data
}

export async function deleteScoreCriterion(tenderId: number | string, criterionId: number | string) {
  await api.delete(`${base}/tenders/${tenderId}/score-criteria/${criterionId}`)
}

export async function listTenderVendors(tenderId: number | string) {
  const { data } = await api.get<ApiSuccess<VmTenderVendor[]>>(`${base}/tenders/${tenderId}/vendors`)
  return data.data
}

export async function addTenderVendors(tenderId: number | string, vendorIds: number[]) {
  const { data } = await api.post<ApiSuccess<VmTenderVendor[]>>(`${base}/tenders/${tenderId}/vendors`, {
    vendor_id: vendorIds[0],
    vendor_ids: vendorIds,
  })
  return data.data
}

export async function updateTenderVendorStage(
  tenderId: number | string,
  tenderVendorId: number | string,
  stageId: number,
) {
  const { data } = await api.patch<ApiSuccess<VmTenderVendor>>(
    `${base}/tenders/${tenderId}/vendors/${tenderVendorId}/stage`,
    { stage_id: stageId },
  )
  return data.data
}

export async function inviteTenderVendor(tenderId: number | string, tenderVendorId: number | string) {
  const { data } = await api.post<
    ApiSuccess<{ invitation_url: string; email_sent: boolean; tender_vendor: VmTenderVendor }>
  >(`${base}/tenders/${tenderId}/vendors/${tenderVendorId}/invite`)
  return data.data
}

export async function sendOutcomeEmail(
  tenderId: number | string,
  tenderVendorId: number | string,
  type: 'awarded' | 'regretted',
) {
  const { data } = await api.post<ApiSuccess<VmTenderVendor>>(
    `${base}/tenders/${tenderId}/vendors/${tenderVendorId}/send-outcome`,
    { type },
  )
  return data.data
}

export async function addScoreCriterion(tenderId: number | string, payload: Partial<VmCriterion>) {
  const { data } = await api.post<ApiSuccess<VmCriterion>>(
    `${base}/tenders/${tenderId}/score-criteria`,
    payload,
  )
  return data.data
}

export async function upsertScores(
  tenderId: number | string,
  tenderVendorId: number | string,
  scores: Array<{ criterion_id: number; score: number; comment?: string }>,
) {
  const { data } = await api.put<ApiSuccess<{ scores: unknown[]; weighted_total: number }>>(
    `${base}/tenders/${tenderId}/vendors/${tenderVendorId}/scores`,
    { scores },
  )
  return data.data
}

export async function getComparison(tenderId: number | string) {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>>>(
    `${base}/tenders/${tenderId}/comparison`,
  )
  return data.data
}

export async function getActivityLogs(tenderId: number | string) {
  const { data } = await api.get<ApiSuccess<unknown[]>>(`${base}/tenders/${tenderId}/activity-logs`)
  return data.data
}

export type VmStageTemplate = {
  id: number
  name: string
  slug: string
  sort_order: number
  color?: string | null
  is_terminal?: boolean
}

export type VmMetaUser = {
  id: number
  name: string
  email?: string
  type?: string
}

export async function getVendorManagementMeta() {
  const { data } = await api.get<ApiSuccess<{ users: VmMetaUser[] }>>(`${base}/meta`)
  return data.data
}

export async function listStageTemplates() {
  const { data } = await api.get<ApiSuccess<VmStageTemplate[]>>(`${base}/stage-templates`)
  return data.data
}

export async function createStageTemplate(payload: Partial<VmStageTemplate>) {
  const { data } = await api.post<ApiSuccess<VmStageTemplate>>(`${base}/stage-templates`, payload)
  return data.data
}

export async function updateStageTemplate(id: number | string, payload: Partial<VmStageTemplate>) {
  const { data } = await api.put<ApiSuccess<VmStageTemplate>>(`${base}/stage-templates/${id}`, payload)
  return data.data
}

export async function deleteStageTemplate(id: number | string) {
  await api.delete(`${base}/stage-templates/${id}`)
}

export async function resetStageTemplates() {
  const { data } = await api.post<ApiSuccess<VmStageTemplate[]>>(`${base}/stage-templates/reset`)
  return data.data
}

export async function getPublicInvitation(token: string) {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>>>(
    `/public/vendor-management/invitations/${token}`,
  )
  return data.data
}

export async function submitPublicInvitation(token: string, formData: FormData) {
  const { data } = await api.post<ApiSuccess<Record<string, unknown>>>(
    `/public/vendor-management/invitations/${token}/submit`,
    formData,
  )
  return data.data
}
