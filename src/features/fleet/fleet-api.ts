import { api, submitFormDataUpdate, type ApiSuccess } from '@/lib/api'
import { extractListRows, extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'
import {
  buildCreateTruckProviderPaymentFormData,
  type CreateTruckProviderPaymentPayload,
} from './truck-provider-payment-payload'
import type {
  EmployeeCreateMeta,
  EmployeeDetail,
  EmployeeRow,
} from '@/features/hrm/hrm-api'

export type TruckCurrentLoad = {
  id: number
  load_number?: string | null
  phase?: string | null
  purchase_invoice_id?: number | null
  purchase_invoice_number?: string | null
  sales_invoice_id?: number | null
  sales_invoice_number?: string | null
}

export type TruckListRow = {
  id: number
  plate_number: string
  make?: string | null
  truck_model?: string | null
  avatar?: string | null
  capacity_litres?: string | null
  status?: string | null
  operational_status?: string | null
  current_truck_load_id?: number | null
  provider_id?: number | null
  truck_provider?: { id: number; name: string } | null
}

export type TrucksIndexMeta = {
  truck_providers: Array<{ id: number; name: string }>
  statuses: string[]
}

export async function fetchTrucksIndexMeta() {
  const { data } = await api.get<ApiSuccess<TrucksIndexMeta>>('/fleet/trucks/index-meta')
  return data.data
}

export async function listTrucksPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<TruckListRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/fleet/trucks', { params })
  return extractPaginatedList<TruckListRow>(data)
}

export type TruckRecord = {
  id: number
  plate_number: string
  provider_id: number
  status: string
  operational_status?: string | null
  current_truck_load_id?: number | null
  current_truck_load?: TruckCurrentLoad | null
  make: string
  avatar?: string | null
  truck_model: string
  year: number
  color?: string | null
  purchase_price?: number | string | null
  capacity_litres: number | string
  engine_size?: number | string | null
  engine_hours?: number | string | null
  axle_count?: number | string | null
  purchase_date?: string | null
  current_odometer?: number | string | null
  current_gps_lat?: number | string | null
  current_gps_lon?: number | string | null
  additional_info?: string | null
  is_active: boolean
  truck_provider?: { id: number; name: string } | null
}

export type TruckFormMeta = {
  truck_providers: Array<{ id: number; name: string }>
  statuses: string[]
}

export type TruckEditMeta = TruckFormMeta & {
  truck: TruckRecord
}

export type TruckPayload = Omit<TruckRecord, 'id' | 'truck_provider'>

export async function fetchTruckCreateMeta() {
  const { data } = await api.get<ApiSuccess<TruckFormMeta>>('/fleet/trucks/create-meta')
  return data.data
}

export async function fetchTruckEditMeta(id: number | string) {
  const { data } = await api.get<ApiSuccess<TruckEditMeta>>(`/fleet/trucks/${id}/edit-meta`)
  return data.data
}

export async function fetchTruck(id: number | string) {
  const { data } = await api.get<ApiSuccess<TruckRecord>>(`/fleet/trucks/${id}`)
  return data.data
}

export async function createTruck(payload: TruckPayload) {
  const { data } = await api.post<ApiSuccess<{ id: number }>>('/fleet/trucks', payload)
  return data.data
}

export async function updateTruck(id: number | string, payload: TruckPayload) {
  const { data } = await api.put<ApiSuccess<{ id: number }>>(`/fleet/trucks/${id}`, payload)
  return data.data
}

export type DriversIndexMeta = {
  branches: Array<{ id: number; branch_name: string }>
  departments: Array<{ id: number; department_name: string; branch_id: number }>
  designations: Array<{ id: number; designation_name: string; branch_id: number; department_id: number }>
}

export async function fetchDriversIndexMeta() {
  const { data } = await api.get<ApiSuccess<DriversIndexMeta>>('/fleet/drivers/index-meta')
  return data.data
}

export async function listDriversPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<EmployeeRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/fleet/drivers', { params })
  return extractPaginatedList<EmployeeRow>(data)
}

export type DriverCreateMeta = EmployeeCreateMeta & {
  driver_designation_id: number
}

export type DriverEditMeta = DriverCreateMeta & {
  employee: EmployeeDetail
}

export async function fetchDriverCreateMeta() {
  const { data } = await api.get<ApiSuccess<DriverCreateMeta>>('/fleet/drivers/create-meta')
  return data.data
}

export async function fetchDriverEditMeta(id: string | number) {
  const { data } = await api.get<ApiSuccess<DriverEditMeta>>(`/fleet/drivers/${id}/edit-meta`)
  return data.data
}

export async function getDriver(id: string | number) {
  const { data } = await api.get<ApiSuccess<EmployeeDetail>>(`/fleet/drivers/${id}`)
  return data.data
}

export async function createDriver(formData: FormData) {
  const { data } = await api.post<ApiSuccess<EmployeeDetail>>('/fleet/drivers', formData)
  return data.data
}

export async function updateDriver(id: string | number, formData: FormData) {
  return submitFormDataUpdate<EmployeeDetail>(`/fleet/drivers/${id}`, formData)
}

export type FleetMeta = {
  trucks: Array<{
    id: number
    plate_number: string
    make?: string
    truck_model?: string
    avatar?: string | null
  }>
  drivers: Array<{
    id: number
    name?: string
    display_name?: string
    first_name?: string
    last_name?: string
    email?: string
    avatar?: string | null
  }>
  truck_providers: Array<{ id: number; name: string }>
  maintenance_providers: Array<{ id: number; name: string }>
}

export async function fetchFleetMeta() {
  const { data } = await api.get<ApiSuccess<FleetMeta>>('/fleet/create-meta')
  return data.data
}

export type FleetOperationsIndexMeta = {
  trucks: Array<{
    id: number
    plate_number: string
    make?: string
    truck_model?: string
    avatar?: string | null
  }>
  drivers: Array<{
    id: number
    display_name?: string
    first_name?: string
    last_name?: string
    email?: string
    avatar?: string | null
  }>
  statuses?: string[]
}

export type TruckAssignmentRow = {
  id: number
  truck_id?: number
  driver_id?: number
  assignment_date?: string
  status?: string
  truck?: { plate_number?: string; make?: string; truck_model?: string; avatar?: string | null }
  driver?: {
    name?: string
    email?: string
    first_name?: string
    last_name?: string
    user?: { avatar?: string | null; name?: string }
  }
}

export async function fetchTruckAssignmentsIndexMeta() {
  const { data } = await api.get<ApiSuccess<FleetOperationsIndexMeta>>(
    '/fleet/truck-assignments/index-meta',
  )
  return data.data
}

export async function listTruckAssignmentsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<TruckAssignmentRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/fleet/truck-assignments', { params })
  return extractPaginatedList<TruckAssignmentRow>(data)
}

export async function createTruckAssignment(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<TruckAssignmentRow>>('/fleet/truck-assignments', body)
  return data.data
}

export async function updateTruckAssignment(id: number | string, body: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<TruckAssignmentRow>>(`/fleet/truck-assignments/${id}`, body)
  return data.data
}

export async function deleteTruckAssignment(id: number | string) {
  await api.delete(`/fleet/truck-assignments/${id}`)
}

export type TruckTripRow = {
  id: number
  origin?: string
  destination?: string
  start_time?: string
  status?: string
  truck_id?: number
  driver_id?: number
  truck?: { plate_number?: string; make?: string; truck_model?: string }
  driver?: { name?: string; email?: string }
}

export type TruckFuelLogRow = {
  id: number
  liters?: number | string
  total_cost?: number | string
  odometer?: number | string
  truck_id?: number
  truck?: { plate_number?: string; make?: string; truck_model?: string }
  driver?: { name?: string; email?: string }
}

export async function fetchTruckTripsIndexMeta() {
  const { data } = await api.get<ApiSuccess<FleetOperationsIndexMeta>>('/fleet/truck-trips/index-meta')
  return data.data
}

export async function listTruckTripsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<TruckTripRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/fleet/truck-trips', { params })
  return extractPaginatedList<TruckTripRow>(data)
}

export async function createTruckTrip(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<TruckTripRow>>('/fleet/truck-trips', body)
  return data.data
}

export async function advanceTruckTrip(id: number) {
  const { data } = await api.post<ApiSuccess<TruckTripRow>>(`/fleet/truck-trips/${id}/advance-status`)
  return data.data
}

export async function deleteTruckTrip(id: number | string) {
  await api.delete(`/fleet/truck-trips/${id}`)
}

export async function fetchTruckFuelLogsIndexMeta() {
  const { data } = await api.get<ApiSuccess<FleetOperationsIndexMeta>>(
    '/fleet/truck-fuel-logs/index-meta',
  )
  return data.data
}

export async function listTruckFuelLogsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<TruckFuelLogRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/fleet/truck-fuel-logs', { params })
  return extractPaginatedList<TruckFuelLogRow>(data)
}

export async function createTruckFuelLog(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<TruckFuelLogRow>>('/fleet/truck-fuel-logs', body)
  return data.data
}

export async function deleteTruckFuelLog(id: number | string) {
  await api.delete(`/fleet/truck-fuel-logs/${id}`)
}

export type FleetProviderRow = {
  id: number
  name: string
  avatar?: string | null
  tax_id?: string | null
  contact_person_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  contact_address?: string | null
  payment_terms?: string | null
  contract_start_date?: string | null
  contract_end_date?: string | null
  rating?: number | string | null
  status?: string | null
  is_active?: boolean
  provider_type_id?: number | null
  truck_provider_type?: { id: number; name: string } | null
  description?: string | null
}

export type TruckProvidersIndexMeta = {
  statuses: string[]
  truck_provider_types: Array<{ id: number; name: string }>
}

export type MaintenanceProvidersIndexMeta = {
  statuses: string[]
}

export type TruckMaintenanceRow = {
  id: number
  service_type?: string
  job_description?: string | null
  start_date?: string | null
  completion_date?: string | null
  nexts_service_due_date?: string | null
  odometer?: number | string | null
  parts_cost?: number | string | null
  labor_cost?: number | string | null
  total_cost?: number | string | null
  parts_replaced?: string | null
  status?: string | null
  truck_id?: number
  provider_id?: number | null
  truck?: { plate_number?: string; make?: string; truck_model?: string }
  maintenance_provider?: { id: number; name: string } | null
}

export type TruckMaintenancesIndexMeta = FleetOperationsIndexMeta & {
  maintenance_providers: Array<{ id: number; name: string }>
}

export async function fetchTruckProvidersIndexMeta() {
  const { data } = await api.get<ApiSuccess<TruckProvidersIndexMeta>>(
    '/fleet/truck-providers/index-meta',
  )
  return data.data
}

export async function listTruckProvidersPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<FleetProviderRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/fleet/truck-providers', { params })
  return extractPaginatedList<FleetProviderRow>(data)
}

export async function createTruckProvider(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<FleetProviderRow>>('/fleet/truck-providers', body)
  return data.data
}

export async function updateTruckProvider(id: number | string, body: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<FleetProviderRow>>(`/fleet/truck-providers/${id}`, body)
  return data.data
}

export async function deleteTruckProvider(id: number | string) {
  await api.delete(`/fleet/truck-providers/${id}`)
}

export async function fetchTruckProvider(id: number | string) {
  const { data } = await api.get<ApiSuccess<FleetProviderRow>>(`/fleet/truck-providers/${id}`)
  return data.data
}

export async function fetchTruckProviderCreateMeta() {
  const { data } = await api.get<ApiSuccess<TruckProvidersIndexMeta>>(
    '/fleet/truck-providers/create-meta',
  )
  return data.data
}

export async function fetchTruckProviderEditMeta(id: number | string) {
  const { data } = await api.get<ApiSuccess<TruckProvidersIndexMeta & { provider: FleetProviderRow }>>(
    `/fleet/truck-providers/${id}/edit-meta`,
  )
  return data.data
}

export async function fetchMaintenanceProvidersIndexMeta() {
  const { data } = await api.get<ApiSuccess<MaintenanceProvidersIndexMeta>>(
    '/fleet/maintenance-providers/index-meta',
  )
  return data.data
}

export async function listMaintenanceProvidersPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<FleetProviderRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/fleet/maintenance-providers', { params })
  return extractPaginatedList<FleetProviderRow>(data)
}

export async function createMaintenanceProvider(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<FleetProviderRow>>('/fleet/maintenance-providers', body)
  return data.data
}

export async function updateMaintenanceProvider(id: number | string, body: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<FleetProviderRow>>(
    `/fleet/maintenance-providers/${id}`,
    body,
  )
  return data.data
}

export async function deleteMaintenanceProvider(id: number | string) {
  await api.delete(`/fleet/maintenance-providers/${id}`)
}

export async function fetchMaintenanceProvider(id: number | string) {
  const { data } = await api.get<ApiSuccess<FleetProviderRow>>(`/fleet/maintenance-providers/${id}`)
  return data.data
}

export async function fetchMaintenanceProviderCreateMeta() {
  const { data } = await api.get<ApiSuccess<MaintenanceProvidersIndexMeta>>(
    '/fleet/maintenance-providers/create-meta',
  )
  return data.data
}

export async function fetchMaintenanceProviderEditMeta(id: number | string) {
  const { data } = await api.get<ApiSuccess<MaintenanceProvidersIndexMeta & { provider: FleetProviderRow }>>(
    `/fleet/maintenance-providers/${id}/edit-meta`,
  )
  return data.data
}

export async function fetchTruckMaintenancesIndexMeta() {
  const { data } = await api.get<ApiSuccess<TruckMaintenancesIndexMeta>>(
    '/fleet/truck-maintenances/index-meta',
  )
  return data.data
}

export async function listTruckMaintenancesPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<TruckMaintenanceRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/fleet/truck-maintenances', { params })
  return extractPaginatedList<TruckMaintenanceRow>(data)
}

export async function createTruckMaintenance(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<TruckMaintenanceRow>>(
    '/fleet/truck-maintenances',
    body,
  )
  return data.data
}

export async function deleteTruckMaintenance(id: number | string) {
  await api.delete(`/fleet/truck-maintenances/${id}`)
}

export async function fetchTruckMaintenance(id: number | string) {
  const { data } = await api.get<ApiSuccess<TruckMaintenanceRow>>(
    `/fleet/truck-maintenances/${id}`,
  )
  return data.data
}

export async function fetchTruckMaintenanceCreateMeta() {
  const { data } = await api.get<ApiSuccess<TruckMaintenancesIndexMeta>>(
    '/fleet/truck-maintenances/create-meta',
  )
  return data.data
}

export async function fetchTruckMaintenanceEditMeta(id: number | string) {
  const { data } = await api.get<
    ApiSuccess<TruckMaintenancesIndexMeta & { maintenance: TruckMaintenanceRow }>
  >(`/fleet/truck-maintenances/${id}/edit-meta`)
  return data.data
}

export async function updateTruckMaintenance(id: number | string, body: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<TruckMaintenanceRow>>(
    `/fleet/truck-maintenances/${id}`,
    body,
  )
  return data.data
}

export type ChartAccountOption = {
  id: number
  account_code?: string
  account_name?: string
  /** @deprecated use account_name — kept for older API payloads */
  name?: string
}

export type TruckMovementsIndexMeta = FleetOperationsIndexMeta & {
  truck_providers: Array<{ id: number; name: string }>
  chart_accounts: ChartAccountOption[]
}

export type TruckMovementRow = {
  id: number
  movement_date?: string
  truck_id?: number
  truck_provider_id?: number | null
  haulage_claim_number?: string | null
  source?: string | null
  destination?: string | null
  quantity_lifted?: number | string | null
  haulage_rate?: number | string | null
  amount?: number | string | null
  wht_percent?: number | string | null
  wht_amount?: number | string | null
  shortage_qty?: number | string | null
  shortage_amount?: number | string | null
  overage_qty?: number | string | null
  overage_amount?: number | string | null
  fuel_qty?: number | string | null
  fuel_rate?: number | string | null
  fuel_consumption?: number | string | null
  repairs?: number | string | null
  transport_allowance?: number | string | null
  margin?: number | string | null
  debit_account_id?: number | null
  credit_account_id?: number | null
  narration?: string | null
  status?: string
  truck?: { plate_number?: string; make?: string; truck_model?: string }
  truck_provider?: { id: number; name: string } | null
  debit_account?: ChartAccountOption | null
  credit_account?: ChartAccountOption | null
}

export async function fetchTruckMovementsIndexMeta() {
  const { data } = await api.get<ApiSuccess<TruckMovementsIndexMeta>>(
    '/fleet/truck-movements/index-meta',
  )
  return data.data
}

export async function listTruckMovementsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<TruckMovementRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/fleet/truck-movements', { params })
  return extractPaginatedList<TruckMovementRow>(data)
}

export async function createTruckMovement(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<TruckMovementRow>>('/fleet/truck-movements', body)
  return data.data
}

export async function updateTruckMovement(id: number | string, body: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<TruckMovementRow>>(`/fleet/truck-movements/${id}`, body)
  return data.data
}

export async function deleteTruckMovement(id: number | string) {
  await api.delete(`/fleet/truck-movements/${id}`)
}

export async function postTruckMovement(id: number | string) {
  const { data } = await api.post<ApiSuccess<TruckMovementRow>>(
    `/fleet/truck-movements/${id}/post`,
  )
  return data.data
}

export type FuelTicketsIndexMeta = FleetOperationsIndexMeta & {
  truck_providers: Array<{ id: number; name: string }>
  products: Array<{ id: number; name: string; sku?: string }>
}

export type FuelTicketRow = {
  id: number
  ticket_number?: string
  ticket_date?: string
  service_station_name?: string | null
  customer_id?: number | null
  product_id?: number | null
  rate?: number | string | null
  quantity?: number | string | null
  trip_allowance?: number | string | null
  total_allowance?: number | string | null
  truck_capacity?: number | string | null
  truck_id?: number | null
  from_location?: string | null
  destination?: string | null
  driver_id?: number | null
  driver_phone?: string | null
  truck_provider_id?: number | null
  notes?: string | null
  status?: string
  truck?: { plate_number?: string; make?: string; truck_model?: string }
  driver?: { name?: string; email?: string }
  truck_provider?: { id: number; name: string } | null
  product?: { id: number; name: string; sku?: string } | null
}

export async function fetchFuelTicketsIndexMeta() {
  const { data } = await api.get<ApiSuccess<FuelTicketsIndexMeta>>('/fleet/fuel-tickets/index-meta')
  return data.data
}

export async function listFuelTicketsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<FuelTicketRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/fleet/fuel-tickets', { params })
  return extractPaginatedList<FuelTicketRow>(data)
}

export async function createFuelTicket(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<FuelTicketRow>>('/fleet/fuel-tickets', body)
  return data.data
}

export async function updateFuelTicket(id: number | string, body: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<FuelTicketRow>>(`/fleet/fuel-tickets/${id}`, body)
  return data.data
}

export async function deleteFuelTicket(id: number | string) {
  await api.delete(`/fleet/fuel-tickets/${id}`)
}

export type TruckLocationRow = {
  id: number
  truck_id?: number
  latitude?: number | string
  longitude?: number | string
  recorded_at?: string
  source?: string
  truck?: {
    plate_number?: string
    make?: string
    truck_model?: string
    avatar?: string | null
    operational_status?: string | null
    current_gps_lat?: number | string | null
    current_gps_lon?: number | string | null
  }
}

export async function fetchTruckLocationsIndexMeta() {
  const { data } = await api.get<ApiSuccess<FleetOperationsIndexMeta>>(
    '/fleet/truck-locations/index-meta',
  )
  return data.data
}

export async function listTruckLocationsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<TruckLocationRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/fleet/truck-locations', { params })
  return extractPaginatedList<TruckLocationRow>(data)
}

export async function createTruckLocation(body: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<TruckLocationRow>>('/fleet/truck-locations', body)
  return data.data
}

export async function deleteTruckLocation(id: number | string) {
  await api.delete(`/fleet/truck-locations/${id}`)
}

export type TruckProviderPaymentsIndexMeta = {
  truck_providers: Array<{ id: number; name: string }>
  statuses: string[]
}

export type TruckProviderPaymentRow = {
  id: number
  truck_provider_id?: number
  payment_date?: string
  amount?: number | string
  reference_number?: string | null
  payment_method?: string | null
  narration?: string | null
  receipt_path?: string | null
  status?: string
  truck_provider?: { id: number; name: string }
}

export async function fetchTruckProviderPaymentsIndexMeta() {
  const { data } = await api.get<ApiSuccess<TruckProviderPaymentsIndexMeta>>(
    '/fleet/truck-provider-payments/index-meta',
  )
  return data.data
}

export async function listTruckProviderPaymentsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<TruckProviderPaymentRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/fleet/truck-provider-payments', { params })
  return extractPaginatedList<TruckProviderPaymentRow>(data)
}

export async function createTruckProviderPayment(body: CreateTruckProviderPaymentPayload) {
  const { data } = await api.post<ApiSuccess<TruckProviderPaymentRow>>(
    '/fleet/truck-provider-payments',
    buildCreateTruckProviderPaymentFormData(body),
  )
  return data.data
}

export async function updateTruckProviderPayment(
  id: number | string,
  body: CreateTruckProviderPaymentPayload,
) {
  const { data } = await api.put<ApiSuccess<TruckProviderPaymentRow>>(
    `/fleet/truck-provider-payments/${id}`,
    buildCreateTruckProviderPaymentFormData(body),
  )
  return data.data
}

export async function deleteTruckProviderPayment(id: number | string) {
  await api.delete(`/fleet/truck-provider-payments/${id}`)
}
