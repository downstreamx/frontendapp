import { api, type ApiSuccess } from '@/lib/api'
import type { AdminProvisionStatus } from '@/features/admin/admin-provision-api'

export type AdminDeletionStatus = Omit<AdminProvisionStatus, 'provisioned_at'> & {
  deletion_started_at?: string | null
}

export async function startAdminCompanyDeletion(companyId: number | string, confirmationPin: string) {
  const { data } = await api.post<ApiSuccess<AdminDeletionStatus>>(
    `/admin/companies/${companyId}/deletion/start`,
    { confirmation_pin: confirmationPin },
  )
  return data.data
}

export async function fetchAdminDeletionStatus(companyId: number | string) {
  const { data } = await api.get<ApiSuccess<AdminDeletionStatus>>(
    `/admin/companies/${companyId}/deletion/status`,
  )
  return data.data
}

export async function runAdminDeletionStep(companyId: number | string, step?: string) {
  const { data } = await api.post<ApiSuccess<AdminDeletionStatus>>(
    `/admin/companies/${companyId}/deletion/run`,
    step ? { step } : {},
  )
  return data.data
}
