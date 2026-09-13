import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type ContractRow = {
  id: number
  subject: string
  contract_number?: string
  user_id?: number
  type_id?: number
  value?: string | number
  start_date?: string
  end_date?: string
  status?: string
  description?: string
  user?: { id: number; name: string; email?: string } | null
  contract_type?: { id: number; name: string } | null
}

export type ContractMeta = {
  contract_types: Array<{ id: number; name: string }>
  users: Array<{ id: number; name: string; email?: string }>
}

export type ContractsIndexMeta = ContractMeta & {
  statuses: string[]
}

export async function fetchContractMeta(): Promise<ContractMeta> {
  const { data } = await api.get<ApiSuccess<ContractMeta>>('/contract/create-meta')
  return data.data
}

export async function fetchContractsIndexMeta(): Promise<ContractsIndexMeta> {
  const { data } = await api.get<ApiSuccess<ContractsIndexMeta>>('/contract/contracts/index-meta')
  return data.data
}

export async function listContractsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<ContractRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/contract/contracts', { params })
  return extractPaginatedList<ContractRow>(data)
}

export async function createContract(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<ContractRow>>('/contract/contracts', payload)
  return data.data
}

export async function updateContract(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<ContractRow>>(`/contract/contracts/${id}`, payload)
  return data.data
}

export async function getContract(id: number) {
  const { data } = await api.get<ApiSuccess<ContractRow>>(`/contract/contracts/${id}`)
  return data.data
}

export async function deleteContract(id: number) {
  await api.delete(`/contract/contracts/${id}`)
}
