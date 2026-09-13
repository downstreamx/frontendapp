import { api, type ApiSuccess } from '@/lib/api'
import { extractListRows, extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type JobPostingListItem = {
  id: number
  title: string
  description?: string
  status?: string
  application_deadline?: string
}

export async function listJobPostings() {
  const { data } = await api.get<ApiSuccess<unknown>>('/recruitment/job-postings')
  return extractListRows<JobPostingListItem>(data)
}

export async function listJobPostingsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<JobPostingListItem>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/recruitment/job-postings', { params })
  return extractPaginatedList<JobPostingListItem>(data)
}

export async function fetchJobPostingsIndexMeta() {
  const { data } = await api.get<ApiSuccess<{ statuses: string[] }>>('/recruitment/job-postings/index-meta')
  return data.data
}

export async function createJobPosting(payload: {
  title: string
  description?: string
  application_deadline?: string
}) {
  const { data } = await api.post<ApiSuccess<JobPostingListItem>>('/recruitment/job-postings', payload)
  return data.data
}

export async function getJobPosting(id: number) {
  const { data } = await api.get<ApiSuccess<JobPostingListItem>>(`/recruitment/job-postings/${id}`)
  return data.data
}

export async function updateJobPosting(
  id: number,
  payload: { title?: string; description?: string; application_deadline?: string; status?: string },
) {
  const { data } = await api.put<ApiSuccess<JobPostingListItem>>(`/recruitment/job-postings/${id}`, payload)
  return data.data
}
