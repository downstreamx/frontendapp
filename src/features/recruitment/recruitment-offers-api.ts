import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'
import { candidateFullName } from './recruitment-candidates-api'

export type OfferListItem = {
  id: number
  position?: string
  status?: string
  offer_date?: string
  salary?: number | string
  candidate?: { id: number; first_name: string; last_name: string }
  job?: { id: number; title: string }
}

export type OfferDetail = OfferListItem & {
  department_id?: number
  bonus?: number | string
  equity?: string
  benefits?: string
  start_date?: string
  expiration_date?: string
  offer_letter_path?: string
  response_date?: string
  decline_reason?: string
  approved_by?: number
  candidate_id?: number
  job_id?: number
  candidate?: {
    id: number
    first_name: string
    last_name: string
    email?: string
  }
}

export type OffersIndexMeta = {
  candidates: Array<{ id: number; first_name: string; last_name: string }>
  job_postings: Array<{ id: number; title: string }>
  departments: Array<{ id: number; department_name: string }>
  statuses: Array<{ value: string; label: string }>
}

export type OfferPayload = {
  candidate_id: number
  job_id?: number
  offer_date: string
  position: string
  department_id?: number
  salary: number
  bonus?: number
  equity?: string
  benefits?: string
  start_date: string
  expiration_date: string
  offer_letter_path?: string
  status: string
  response_date?: string
  decline_reason?: string
}

export function offerCandidateLabel(row: OfferListItem): string {
  const c = row.candidate
  return c ? candidateFullName(c) : '—'
}

export async function fetchOffersIndexMeta() {
  const { data } = await api.get<ApiSuccess<OffersIndexMeta>>('/recruitment/offers/index-meta')
  return data.data
}

export async function listOffersPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<OfferListItem>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/recruitment/offers', { params })
  return extractPaginatedList<OfferListItem>(data)
}

export async function getOffer(id: number) {
  const { data } = await api.get<ApiSuccess<OfferDetail>>(`/recruitment/offers/${id}`)
  return data.data
}

export async function createOffer(payload: OfferPayload) {
  const { data } = await api.post<ApiSuccess<OfferDetail>>('/recruitment/offers', payload)
  return data.data
}

export async function updateOffer(id: number, payload: Partial<OfferPayload>) {
  const { data } = await api.put<ApiSuccess<OfferDetail>>(`/recruitment/offers/${id}`, payload)
  return data.data
}

export async function deleteOffer(id: number) {
  await api.delete(`/recruitment/offers/${id}`)
}

export async function fetchCandidateJobs(candidateId: number) {
  const { data } = await api.get<ApiSuccess<Array<{ id: number; title: string }>>>(
    `/recruitment/candidates/${candidateId}/jobs`,
  )
  return data.data
}
