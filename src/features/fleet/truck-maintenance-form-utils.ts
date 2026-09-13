import type { TruckMaintenanceRow } from './fleet-api'

export const MAINTENANCE_SERVICE_TYPES = [
  'routine-servicing',
  'emergency-repair',
  'inspection',
  'major-repair',
] as const

export type TruckMaintenanceFormState = {
  truck_id: string
  provider_id: string
  service_type: string
  job_description: string
  start_date: string
  completion_date: string
  nexts_service_due_date: string
  odometer: string
  parts_cost: string
  labor_cost: string
  total_cost: string
  parts_replaced: string
  status: string
}

export const initialMaintenanceFormState = (): TruckMaintenanceFormState => ({
  truck_id: '',
  provider_id: '',
  service_type: 'routine-servicing',
  job_description: '',
  start_date: new Date().toISOString().slice(0, 10),
  completion_date: '',
  nexts_service_due_date: '',
  odometer: '',
  parts_cost: '',
  labor_cost: '',
  total_cost: '',
  parts_replaced: '',
  status: 'scheduled',
})

export function maintenanceToFormState(
  row: TruckMaintenanceRow & Record<string, unknown>,
): TruckMaintenanceFormState {
  return {
    truck_id: row.truck_id ? String(row.truck_id) : '',
    provider_id: row.provider_id ? String(row.provider_id) : '',
    service_type: row.service_type ?? 'routine-servicing',
    job_description: row.job_description ?? '',
    start_date: row.start_date?.slice(0, 10) ?? '',
    completion_date: (row.completion_date as string)?.slice(0, 10) ?? '',
    nexts_service_due_date: (row.nexts_service_due_date as string)?.slice(0, 10) ?? '',
    odometer: row.odometer != null ? String(row.odometer) : '',
    parts_cost: row.parts_cost != null ? String(row.parts_cost) : '',
    labor_cost: row.labor_cost != null ? String(row.labor_cost) : '',
    total_cost: row.total_cost != null ? String(row.total_cost) : '',
    parts_replaced: (row.parts_replaced as string) ?? '',
    status: row.status ?? 'scheduled',
  }
}

export function formStateToMaintenancePayload(form: TruckMaintenanceFormState): Record<string, unknown> {
  return {
    truck_id: Number(form.truck_id),
    provider_id: form.provider_id ? Number(form.provider_id) : undefined,
    service_type: form.service_type,
    job_description: form.job_description || undefined,
    start_date: form.start_date || undefined,
    completion_date: form.completion_date || undefined,
    nexts_service_due_date: form.nexts_service_due_date || undefined,
    odometer: form.odometer ? Number(form.odometer) : undefined,
    parts_cost: form.parts_cost ? Number(form.parts_cost) : undefined,
    labor_cost: form.labor_cost ? Number(form.labor_cost) : undefined,
    total_cost: form.total_cost ? Number(form.total_cost) : undefined,
    parts_replaced: form.parts_replaced || undefined,
    status: form.status,
  }
}
