import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type CandidateListItem = {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  status?: string
  tracking_id?: string
  application_date?: string
  job_posting?: { id: number; title: string }
  candidate_source?: { id: number; name: string }
}

export type CandidateDetail = CandidateListItem & {
  skills?: string
  experience_years?: number
  expected_salary?: number
  current_company?: string
  current_position?: string
  interviews?: Array<Record<string, unknown>>
}

export type CandidatesIndexMeta = {
  job_postings: Array<{ id: number; title: string; status?: string }>
  sources: Array<{ id: number; name: string }>
  statuses: Array<{ value: string; label: string }>
}

export async function fetchCandidatesIndexMeta() {
  const { data } = await api.get<ApiSuccess<CandidatesIndexMeta>>('/recruitment/candidates/index-meta')
  return data.data
}

export async function listCandidatesPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<CandidateListItem>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/recruitment/candidates', { params })
  return extractPaginatedList<CandidateListItem>(data)
}

export async function getCandidate(id: number) {
  const { data } = await api.get<ApiSuccess<CandidateDetail>>(`/recruitment/candidates/${id}`)
  return data.data
}

export async function createCandidate(payload: {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  job_id?: number
  source_id?: number
  status?: string
  application_date?: string
}) {
  const { data } = await api.post<ApiSuccess<CandidateListItem>>('/recruitment/candidates', payload)
  return data.data
}

export async function updateCandidate(
  id: number,
  payload: Partial<{
    first_name: string
    last_name: string
    email: string
    phone: string
    job_id: number
    source_id: number
    status: string
    application_date: string
    skills: string
  }>,
) {
  const { data } = await api.put<ApiSuccess<CandidateDetail>>(`/recruitment/candidates/${id}`, payload)
  return data.data
}

export async function updateCandidateStatus(id: number, status: string) {
  const { data } = await api.patch<ApiSuccess<CandidateDetail>>(`/recruitment/candidates/${id}/status`, {
    status,
  })
  return data.data
}

export function candidateFullName(row: Pick<CandidateListItem, 'first_name' | 'last_name'>) {
  return [row.first_name, row.last_name].filter(Boolean).join(' ')
}
