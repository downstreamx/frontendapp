import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'
import { candidateFullName } from './recruitment-candidates-api'

export type InterviewListItem = {
  id: number
  scheduled_date?: string
  scheduled_time?: string
  duration?: number
  location?: string
  status?: string
  candidate?: { id: number; first_name: string; last_name: string }
  interview_round?: { id: number; name: string }
  interviewRound?: { id: number; name: string }
  interview_type?: { id: number; name: string }
  interviewType?: { id: number; name: string }
  job_posting?: { id: number; title: string }
  jobPosting?: { id: number; title: string }
}

export type InterviewDetail = InterviewListItem & {
  meeting_link?: string
  interviewer_ids?: number[]
  interviewers?: string
  feedback_submitted?: boolean
  round_id?: number
  interview_type_id?: number
  candidate_id?: number
  job_id?: number
  candidate?: {
    id: number
    first_name: string
    last_name: string
    email?: string
    phone?: string
  }
  interview_feedbacks?: Array<Record<string, unknown>>
}

export type InterviewsIndexMeta = {
  candidates: Array<{ id: number; first_name: string; last_name: string }>
  job_postings: Array<{ id: number; title: string }>
  interview_rounds: Array<{ id: number; name: string; job_id?: number }>
  interview_types: Array<{ id: number; name: string }>
  employees: Array<{ id: number; name: string; email?: string }>
  statuses: Array<{ value: string; label: string }>
}

export type InterviewPayload = {
  candidate_id: number
  round_id: number
  interview_type_id: number
  scheduled_date: string
  scheduled_time: string
  duration: number
  location?: string
  meeting_link?: string
  interviewer_ids?: number[]
  status: string
  job_id?: number
}

export function interviewCandidateLabel(row: InterviewListItem): string {
  const c = row.candidate
  return c ? candidateFullName(c) : '—'
}

export async function fetchInterviewsIndexMeta() {
  const { data } = await api.get<ApiSuccess<InterviewsIndexMeta>>('/recruitment/interviews/index-meta')
  return data.data
}

export async function listInterviewsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<InterviewListItem>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/recruitment/interviews', { params })
  return extractPaginatedList<InterviewListItem>(data)
}

export async function getInterview(id: number) {
  const { data } = await api.get<ApiSuccess<InterviewDetail>>(`/recruitment/interviews/${id}`)
  return data.data
}

export async function createInterview(payload: InterviewPayload) {
  const { data } = await api.post<ApiSuccess<InterviewDetail>>('/recruitment/interviews', payload)
  return data.data
}

export async function updateInterview(id: number, payload: Partial<InterviewPayload>) {
  const { data } = await api.put<ApiSuccess<InterviewDetail>>(`/recruitment/interviews/${id}`, payload)
  return data.data
}

export async function deleteInterview(id: number) {
  await api.delete(`/recruitment/interviews/${id}`)
}

export async function fetchCandidateInterviewRounds(candidateId: number) {
  const { data } = await api.get<ApiSuccess<Array<{ id: number; name: string }>>>(
    `/recruitment/candidates/${candidateId}/interview-rounds`,
  )
  return data.data
}

export async function fetchCandidateJobRemote(candidateId: number) {
  const { data } = await api.get<ApiSuccess<{ remote_work: boolean }>>(
    `/recruitment/candidates/${candidateId}/job-location`,
  )
  return data.data
}
