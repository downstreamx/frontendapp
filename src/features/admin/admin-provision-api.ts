import { api, type ApiSuccess } from '@/lib/api'

export type ProvisionStatus = {
  steps: Array<{ id: string; label: string; completed: boolean }>
  completed: string[]
  next_step: string | null
  percent: number
  done: boolean
  provisioned_at: string | null
  ran_step?: string
}

export type AdminProvisionStatus = ProvisionStatus & {
  company?: { id: number; name: string }
  owner?: { id: number; email: string; name: string }
}

export async function fetchAdminProvisionStatus(companyId: number | string) {
  const { data } = await api.get<ApiSuccess<AdminProvisionStatus>>(
    `/admin/companies/${companyId}/provision/status`,
  )
  return data.data
}

export async function runAdminProvisionStep(companyId: number | string, step?: string) {
  const { data } = await api.post<ApiSuccess<AdminProvisionStatus>>(
    `/admin/companies/${companyId}/provision/run`,
    step ? { step } : {},
  )
  return data.data
}
