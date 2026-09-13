import { api, type ApiSuccess } from '@/lib/api'
import { createRestCrudApi } from '@/lib/crud-api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type AssetCategory = {
  id: number
  name: string
  code?: string | null
  description?: string | null
  is_active: boolean
}

export type AssetLocation = {
  id: number
  name: string
  code?: string | null
  depot_id?: number | null
  address?: string | null
  is_active: boolean
  depot?: { id: number; name: string } | null
}

export type AssetRow = {
  id: number
  asset_tag: string
  name: string
  status: string
  serial_number?: string | null
  purchase_date?: string | null
  purchase_cost?: number | null
  category_id?: number | null
  location_id?: number | null
  depot_id?: number | null
  custodian_user_id?: number | null
  category?: { id: number; name: string } | null
  location?: { id: number; name: string } | null
  depot?: { id: number; name: string } | null
  warranty_expiry?: string | null
  notes?: string | null
  useful_life_months?: number | null
  salvage_value?: number | null
  monthly_depreciation?: number | null
  is_capitalized?: boolean
}

export type AssetMeta = {
  depots: Array<{ id: number; name: string }>
  categories: AssetCategory[]
  locations: AssetLocation[]
  users: Array<{ id: number; name: string; email?: string }>
  asset_statuses: string[]
}

export type AssetDashboard = {
  total_assets: number
  by_status: Record<string, number>
  overdue_maintenance_plans: number
  open_maintenance_orders: number
}

const categoriesApi = createRestCrudApi<AssetCategory>('/asset-management/categories')
const locationsApi = createRestCrudApi<AssetLocation>('/asset-management/locations')
const assetsApi = createRestCrudApi<AssetRow>('/asset-management/assets')

export const listAssetCategories = categoriesApi.list
export const createAssetCategory = categoriesApi.create
export const updateAssetCategory = categoriesApi.update
export const deleteAssetCategory = categoriesApi.remove

export const listAssetLocations = locationsApi.list
export const createAssetLocation = locationsApi.create
export const updateAssetLocation = locationsApi.update
export const deleteAssetLocation = locationsApi.remove

export async function listAssetsPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<AssetRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/asset-management/assets', { params })
  return extractPaginatedList<AssetRow>(data)
}

export async function fetchAssetMeta(): Promise<AssetMeta> {
  const { data } = await api.get<ApiSuccess<AssetMeta>>('/asset-management/assets/create-meta')
  return data.data
}

export async function fetchAssetEditMeta(id: string | number): Promise<{ asset: AssetRow } & AssetMeta> {
  const { data } = await api.get<ApiSuccess<{ asset: AssetRow } & AssetMeta>>(
    `/asset-management/assets/${id}/edit-meta`,
  )
  return data.data
}

export async function getAsset(id: string | number): Promise<AssetRow> {
  const { data } = await api.get<ApiSuccess<AssetRow>>(`/asset-management/assets/${id}`)
  return data.data
}

export async function getAssetByTag(tag: string): Promise<AssetRow> {
  const { data } = await api.get<ApiSuccess<AssetRow>>(
    `/asset-management/assets/by-tag/${encodeURIComponent(tag)}`,
  )
  return data.data
}

export const createAsset = assetsApi.create
export const updateAsset = assetsApi.update
export const deleteAsset = assetsApi.remove

export async function fetchAssetDashboard(): Promise<AssetDashboard> {
  const { data } = await api.get<ApiSuccess<AssetDashboard>>('/asset-management/dashboard')
  return data.data
}

export async function runDepreciation(periodMonth: string) {
  const { data } = await api.post<ApiSuccess<unknown>>('/asset-management/depreciation/run', {
    period_month: periodMonth,
  })
  return data.data
}

export async function fetchAssetRegisterReport(params?: Record<string, string>) {
  const { data } = await api.get<ApiSuccess<{ rows: unknown[]; as_of_date: string }>>(
    '/asset-management/reports/register',
    { params },
  )
  return data.data
}

export type AssetMaintenancePlan = {
  id: number
  name: string
  asset_id: number
  interval_days?: number | null
  next_due_date?: string | null
  is_active: boolean
  asset?: { asset_tag: string; name: string }
}

export type AssetMaintenanceOrder = {
  id: number
  order_number: string
  title: string
  status: string
  asset_id: number
  asset?: { asset_tag: string; name: string }
}

export type AssetInspection = {
  id: number
  asset_id: number
  inspection_date: string
  result: string
  next_due_date?: string | null
  asset?: { asset_tag: string; name: string }
}

const maintenancePlansApi = createRestCrudApi<AssetMaintenancePlan>(
  '/asset-management/maintenance-plans',
)
const maintenanceOrdersApi = createRestCrudApi<AssetMaintenanceOrder>(
  '/asset-management/maintenance-orders',
)
const inspectionsApi = createRestCrudApi<AssetInspection>('/asset-management/inspections')

export const listMaintenancePlans = maintenancePlansApi.list
export const createMaintenancePlan = maintenancePlansApi.create
export const updateMaintenancePlan = maintenancePlansApi.update
export const deleteMaintenancePlan = maintenancePlansApi.remove

export async function listMaintenanceOrdersPaginated(
  params?: Record<string, string>,
): Promise<PaginatedListResult<AssetMaintenanceOrder>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/asset-management/maintenance-orders', {
    params,
  })
  return extractPaginatedList<AssetMaintenanceOrder>(data)
}

export const createMaintenanceOrder = maintenanceOrdersApi.create
export const updateMaintenanceOrder = maintenanceOrdersApi.update
export const deleteMaintenanceOrder = maintenanceOrdersApi.remove

export const listInspections = inspectionsApi.list
export const createInspection = inspectionsApi.create
export const updateInspection = inspectionsApi.update
export const deleteInspection = inspectionsApi.remove
