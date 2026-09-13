import { api, type ApiSuccess } from '@/lib/api'
import { extractListRows } from '@/hooks/use-resource-list'

export function createRestCrudApi<T extends { id: number }>(basePath: string) {
  return {
    async list(params?: Record<string, string | number>) {
      const { data } = await api.get<ApiSuccess<unknown>>(basePath, { params })
      return extractListRows<T>(data)
    },
    async create(payload: Record<string, unknown>) {
      const { data } = await api.post<ApiSuccess<T>>(basePath, payload)
      return data.data
    },
    async update(id: number, payload: Record<string, unknown>) {
      const { data } = await api.put<ApiSuccess<T>>(`${basePath}/${id}`, payload)
      return data.data
    },
    async remove(id: number) {
      await api.delete(`${basePath}/${id}`)
    },
  }
}
