import { api, type ApiSuccess } from '@/lib/api'

export type AddOnModuleRow = {
  name: string
  alias: string
  description: string
  version: string
  image: string
  is_enabled: boolean
  package_name?: string | null
  display: boolean
  priority: number
  parent_module?: string[]
  child_module?: string[]
}

export async function fetchAddOnModules() {
  const { data } = await api.get<ApiSuccess<{ modules: AddOnModuleRow[] }>>('/add-ons')
  return data.data.modules
}

export async function toggleAddOnModule(module: string) {
  const { data } = await api.post<
    ApiSuccess<{
      module: string
      is_enabled: boolean
      message: string
      modules: AddOnModuleRow[]
    }>
  >(`/add-ons/${encodeURIComponent(module)}/enable`)
  return data.data
}
