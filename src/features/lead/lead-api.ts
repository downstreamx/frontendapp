import { api, type ApiSuccess } from '@/lib/api'
import { extractListRows, extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type LeadListItem = {
  id: number
  name: string
  email?: string
  phone?: string
  stage?: { id: number; name: string }
  pipeline?: { id: number; name: string }
  user?: { id: number; name: string; email?: string }
}

type PipelineStage = { id: number; name: string; order?: number }

export type LeadMeta = {
  pipelines: Array<{
    id: number
    name: string
    lead_stages?: PipelineStage[]
    leadStages?: PipelineStage[]
    deal_stages?: PipelineStage[]
    dealStages?: PipelineStage[]
  }>
  users: Array<{ id: number; name: string; email?: string }>
}

export type DealListItem = {
  id: number
  name: string
  price?: number
  status?: string
  notes?: string
  stage?: { id: number; name: string }
  pipeline?: { id: number; name: string }
}

export type CrmTaskRow = {
  id: number
  name: string
  date?: string
  time?: string
  priority?: string
  status?: string
}

export type CrmCallRow = {
  id: number
  subject: string
  call_type?: string
  duration?: string
  user_id?: number
  description?: string
  call_result?: string
  user?: { id: number; name: string; email?: string }
}

export type CrmFileRow = {
  id: number
  file_name?: string
  file_path?: string
}

export type DealDetail = DealListItem & {
  phone?: string
  tasks?: CrmTaskRow[]
  calls?: CrmCallRow[]
  files?: CrmFileRow[]
  activities?: Array<Record<string, unknown>>
}

export async function listLeads() {
  const { data } = await api.get<ApiSuccess<unknown>>('/lead/leads')
  return extractListRows<LeadListItem>(data)
}

export async function listLeadsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<LeadListItem>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/lead/leads', { params })
  return extractPaginatedList<LeadListItem>(data)
}

export async function fetchLeadIndexMeta(): Promise<LeadMeta> {
  const { data } = await api.get<ApiSuccess<LeadMeta>>('/lead/leads/index-meta')
  return data.data
}

export async function fetchLeadMeta(): Promise<LeadMeta> {
  const { data } = await api.get<ApiSuccess<LeadMeta>>('/lead/create-meta')
  return data.data
}

export type LeadDetail = LeadListItem & {
  subject?: string
  notes?: string
  date?: string
  is_active?: boolean
  is_converted?: number | boolean
  user_leads?: Array<{ id: number; user?: { id: number; name: string; email?: string } }>
  userLeads?: LeadDetail['user_leads']
  tasks?: CrmTaskRow[]
  emails?: Array<Record<string, unknown>>
  discussions?: Array<Record<string, unknown>>
  files?: CrmFileRow[]
  calls?: CrmCallRow[]
  activities?: Array<Record<string, unknown>>
}

export async function getLead(id: string | number) {
  const { data } = await api.get<ApiSuccess<LeadDetail>>(`/lead/leads/${id}`)
  return data.data
}

export async function updateLead(
  id: number,
  payload: {
    name?: string
    email?: string
    phone?: string
    subject?: string
    notes?: string
    pipeline_id?: number
    stage_id?: number
    user_id?: number
    date?: string
    is_active?: boolean
  },
) {
  const { data } = await api.put<ApiSuccess<LeadDetail>>(`/lead/leads/${id}`, payload)
  return data.data
}

export async function createLead(payload: {
  name: string
  email?: string
  phone?: string
  subject?: string
  notes?: string
  pipeline_id?: number
  stage_id?: number
  user_id?: number
  date?: string
}) {
  const { data } = await api.post<ApiSuccess<LeadListItem>>('/lead/leads', payload)
  return data.data
}

export async function createLeadActivity(
  leadId: number,
  payload: { remark: string; log_type?: string },
) {
  const { data } = await api.post<ApiSuccess<Record<string, unknown>>>(
    `/lead/leads/${leadId}/activities`,
    payload,
  )
  return data.data
}

export type CrmTaskPayload = {
  name: string
  date: string
  time: string
  priority: string
  status: string
}

export type CrmCallPayload = {
  subject: string
  call_type: string
  duration: string
  user_id: number
  description?: string
  call_result?: string
}

const leadBase = (leadId: number) => `/lead/leads/${leadId}`
const dealBase = (dealId: number) => `/lead/deals/${dealId}`

export async function createLeadTask(leadId: number, payload: CrmTaskPayload) {
  const { data } = await api.post<ApiSuccess<CrmTaskRow>>(`${leadBase(leadId)}/tasks`, payload)
  return data.data
}

export async function updateLeadTask(leadId: number, taskId: number, payload: Partial<CrmTaskPayload>) {
  const { data } = await api.put<ApiSuccess<CrmTaskRow>>(`${leadBase(leadId)}/tasks/${taskId}`, payload)
  return data.data
}

export async function deleteLeadTask(leadId: number, taskId: number) {
  await api.delete(`${leadBase(leadId)}/tasks/${taskId}`)
}

export async function createLeadCall(leadId: number, payload: CrmCallPayload) {
  const { data } = await api.post<ApiSuccess<CrmCallRow>>(`${leadBase(leadId)}/calls`, payload)
  return data.data
}

export async function updateLeadCall(leadId: number, callId: number, payload: Partial<CrmCallPayload>) {
  const { data } = await api.put<ApiSuccess<CrmCallRow>>(`${leadBase(leadId)}/calls/${callId}`, payload)
  return data.data
}

export async function deleteLeadCall(leadId: number, callId: number) {
  await api.delete(`${leadBase(leadId)}/calls/${callId}`)
}

export async function attachLeadFiles(leadId: number, paths: string[]) {
  const { data } = await api.post<ApiSuccess<CrmFileRow[]>>(`${leadBase(leadId)}/files`, { paths })
  return data.data
}

export async function deleteLeadFile(leadId: number, fileId: number) {
  await api.delete(`${leadBase(leadId)}/files/${fileId}`)
}

export async function createDealTask(dealId: number, payload: CrmTaskPayload) {
  const { data } = await api.post<ApiSuccess<CrmTaskRow>>(`${dealBase(dealId)}/tasks`, payload)
  return data.data
}

export async function updateDealTask(dealId: number, taskId: number, payload: Partial<CrmTaskPayload>) {
  const { data } = await api.put<ApiSuccess<CrmTaskRow>>(`${dealBase(dealId)}/tasks/${taskId}`, payload)
  return data.data
}

export async function deleteDealTask(dealId: number, taskId: number) {
  await api.delete(`${dealBase(dealId)}/tasks/${taskId}`)
}

export async function createDealCall(dealId: number, payload: CrmCallPayload) {
  const { data } = await api.post<ApiSuccess<CrmCallRow>>(`${dealBase(dealId)}/calls`, payload)
  return data.data
}

export async function updateDealCall(dealId: number, callId: number, payload: Partial<CrmCallPayload>) {
  const { data } = await api.put<ApiSuccess<CrmCallRow>>(`${dealBase(dealId)}/calls/${callId}`, payload)
  return data.data
}

export async function deleteDealCall(dealId: number, callId: number) {
  await api.delete(`${dealBase(dealId)}/calls/${callId}`)
}

export async function attachDealFiles(dealId: number, paths: string[]) {
  const { data } = await api.post<ApiSuccess<CrmFileRow[]>>(`${dealBase(dealId)}/files`, { paths })
  return data.data
}

export async function deleteDealFile(dealId: number, fileId: number) {
  await api.delete(`${dealBase(dealId)}/files/${fileId}`)
}

export async function createLeadStage(pipelineId: number, payload: { name: string }) {
  const { data } = await api.post<ApiSuccess<PipelineStage>>(
    `/lead/pipelines/${pipelineId}/lead-stages`,
    payload,
  )
  return data.data
}

export async function updateLeadStage(id: number, payload: { name: string }) {
  const { data } = await api.put<ApiSuccess<PipelineStage>>(`/lead/lead-stages/${id}`, payload)
  return data.data
}

export async function deleteLeadStage(id: number) {
  await api.delete(`/lead/lead-stages/${id}`)
}

export async function createDealStage(pipelineId: number, payload: { name: string }) {
  const { data } = await api.post<ApiSuccess<PipelineStage>>(
    `/lead/pipelines/${pipelineId}/deal-stages`,
    payload,
  )
  return data.data
}

export async function updateDealStage(id: number, payload: { name: string }) {
  const { data } = await api.put<ApiSuccess<PipelineStage>>(`/lead/deal-stages/${id}`, payload)
  return data.data
}

export async function deleteDealStage(id: number) {
  await api.delete(`/lead/deal-stages/${id}`)
}

export async function listDeals() {
  const { data } = await api.get<ApiSuccess<unknown>>('/lead/deals')
  return extractListRows<DealListItem>(data)
}

export async function listDealsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<DealListItem>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/lead/deals', { params })
  return extractPaginatedList<DealListItem>(data)
}

export async function fetchDealIndexMeta(): Promise<LeadMeta> {
  const { data } = await api.get<ApiSuccess<LeadMeta>>('/lead/deals/index-meta')
  return data.data
}

export async function createDeal(payload: {
  name: string
  price?: number
  pipeline_id?: number
  stage_id?: number
  phone?: string
  notes?: string
}) {
  const { data } = await api.post<ApiSuccess<DealListItem>>('/lead/deals', payload)
  return data.data
}

export async function getDeal(id: number) {
  const { data } = await api.get<ApiSuccess<DealDetail>>(`/lead/deals/${id}`)
  return data.data
}

export async function updateDeal(
  id: number,
  payload: {
    name?: string
    price?: number
    notes?: string
    status?: string
    pipeline_id?: number
    stage_id?: number
    phone?: string
  },
) {
  const { data } = await api.put<ApiSuccess<DealDetail>>(`/lead/deals/${id}`, payload)
  return data.data
}

export type PipelineRecord = {
  id: number
  name: string
  lead_stages?: PipelineStage[]
  leadStages?: PipelineStage[]
  deal_stages?: PipelineStage[]
  dealStages?: PipelineStage[]
}

export async function listPipelines() {
  const { data } = await api.get<ApiSuccess<PipelineRecord[]>>('/lead/pipelines')
  return data.data
}

export async function createPipeline(payload: { name: string }) {
  const { data } = await api.post<ApiSuccess<PipelineRecord>>('/lead/pipelines', payload)
  return data.data
}

export async function updatePipeline(id: number, payload: { name: string }) {
  const { data } = await api.put<ApiSuccess<PipelineRecord>>(`/lead/pipelines/${id}`, payload)
  return data.data
}

export async function deletePipeline(id: number) {
  await api.delete(`/lead/pipelines/${id}`)
}

export type CrmKanbanResponse = {
  pipeline: { id: number; name: string }
  stages: Array<{ id: number; name: string; key: string; color: string }>
  tasks: Record<string, Array<{ id: number; title: string; [key: string]: unknown }>>
}

export async function fetchLeadsKanban(pipelineId?: number) {
  const { data } = await api.get<ApiSuccess<CrmKanbanResponse>>('/lead/leads/kanban', {
    params: pipelineId ? { pipeline_id: pipelineId } : undefined,
  })
  return data.data
}

export async function fetchDealsKanban(pipelineId?: number) {
  const { data } = await api.get<ApiSuccess<CrmKanbanResponse>>('/lead/deals/kanban', {
    params: pipelineId ? { pipeline_id: pipelineId } : undefined,
  })
  return data.data
}

export async function moveLeadStage(leadId: number, stageId: number) {
  const { data } = await api.put<ApiSuccess<LeadListItem>>(`/lead/leads/${leadId}`, { stage_id: stageId })
  return data.data
}

export async function moveDealStage(dealId: number, stageId: number) {
  const { data } = await api.put<ApiSuccess<DealListItem>>(`/lead/deals/${dealId}`, { stage_id: stageId })
  return data.data
}
