import { api } from '@/lib/api'

export type PublicJob = {
  id: number
  title: string
  location?: string
  job_type?: string
  min_salary?: number
  max_salary?: number
  application_deadline?: string
  is_featured?: boolean
  skills?: string[]
  description?: string
  requirements?: string
  benefits?: string
}

export type CareersPayload = {
  slug: string
  brand: { title_text?: string; footer_text?: string }
  company: { our_mission?: string; company_size?: string; industry?: string }
  jobs: PublicJob[]
  application_tips: Array<{ title: string }>
  need_help: { description?: string; email?: string; phone?: string }
}

function publicBase(slug: string) {
  return `/public/recruitment/${slug}`
}

export async function fetchCareersPortal(slug: string) {
  const { data } = await api.get<{ data: CareersPayload }>(`${publicBase(slug)}/careers`)
  return data.data
}

export async function fetchPublicJob(slug: string, jobId: number) {
  const { data } = await api.get<{ data: { job: PublicJob; application_tips: Array<{ title: string }> } }>(
    `${publicBase(slug)}/jobs/${jobId}`,
  )
  return data.data
}

export async function submitPublicApplication(
  slug: string,
  jobId: number,
  payload: {
    name: string
    email: string
    phone?: string
    experience_years: number
    skills?: string
    current_company?: string
    current_position?: string
    expected_salary?: number
  },
) {
  const { data } = await api.post<{ data: { tracking_id: string } }>(
    `${publicBase(slug)}/jobs/${jobId}/apply`,
    payload,
  )
  return data.data
}

export async function verifyTracking(slug: string, tracking_id: string, email: string) {
  const { data } = await api.post<{ data: { tracking_id: string } }>(
    `${publicBase(slug)}/track/verify`,
    { tracking_id, email },
  )
  return data.data
}

export async function fetchTrackingStatus(slug: string, trackingId: string) {
  const { data } = await api.get<{
    data: {
      candidate: {
        tracking_id: string
        name: string
        status_label: string
        job_title?: string
        application_date?: string
      }
      tracking_faq: Array<{ question: string; answer: string }>
    }
  }>(`${publicBase(slug)}/track/${encodeURIComponent(trackingId)}`)
  return data.data
}
