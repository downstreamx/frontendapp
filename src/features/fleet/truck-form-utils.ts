import type { TruckPayload, TruckRecord } from './fleet-api'

export type TruckFormState = {
  plate_number: string
  provider_id: string
  status: string
  make: string
  truck_model: string
  year: string
  color: string
  purchase_price: string
  fuel_capacity: string
  engine_size: string
  engine_hours: string
  axle_count: string
  purchase_date: string
  current_odometer: string
  current_gps_lat: string
  current_gps_lon: string
  additional_info: string
  avatar: string
  is_active: boolean
}

export const initialTruckFormState: TruckFormState = {
  plate_number: '',
  provider_id: '',
  status: 'available',
  make: '',
  truck_model: '',
  year: String(new Date().getFullYear()),
  color: '',
  purchase_price: '0',
  fuel_capacity: '0',
  engine_size: '0',
  engine_hours: '0',
  axle_count: '0',
  purchase_date: '',
  current_odometer: '0',
  current_gps_lat: '0',
  current_gps_lon: '0',
  additional_info: '',
  avatar: '',
  is_active: true,
}

export function truckToFormState(truck: TruckRecord): TruckFormState {
  return {
    plate_number: truck.plate_number ?? '',
    provider_id: truck.provider_id ? String(truck.provider_id) : '',
    status: truck.status ?? 'available',
    make: truck.make ?? '',
    truck_model: truck.truck_model ?? '',
    year: truck.year != null ? String(truck.year) : String(new Date().getFullYear()),
    color: truck.color ?? '',
    purchase_price: truck.purchase_price != null ? String(truck.purchase_price) : '0',
    fuel_capacity: truck.fuel_capacity != null ? String(truck.fuel_capacity) : '0',
    engine_size: truck.engine_size != null ? String(truck.engine_size) : '0',
    engine_hours: truck.engine_hours != null ? String(truck.engine_hours) : '0',
    axle_count: truck.axle_count != null ? String(truck.axle_count) : '0',
    purchase_date: truck.purchase_date ?? '',
    current_odometer: truck.current_odometer != null ? String(truck.current_odometer) : '0',
    current_gps_lat: truck.current_gps_lat != null ? String(truck.current_gps_lat) : '0',
    current_gps_lon: truck.current_gps_lon != null ? String(truck.current_gps_lon) : '0',
    additional_info: truck.additional_info ?? '',
    avatar: truck.avatar ?? '',
    is_active: truck.is_active ?? true,
  }
}

/** @deprecated Use truckToFormState */
export const vehicleToFormState = truckToFormState

export function formStateToPayload(form: TruckFormState): TruckPayload {
  return {
    plate_number: form.plate_number.trim(),
    provider_id: Number(form.provider_id),
    status: form.status,
    make: form.make.trim(),
    truck_model: form.truck_model.trim(),
    year: Number(form.year),
    color: form.color.trim() || null,
    purchase_price: form.purchase_price ? Number(form.purchase_price) : null,
    fuel_capacity: Number(form.fuel_capacity) || 0,
    engine_size: form.engine_size ? Number(form.engine_size) : null,
    engine_hours: form.engine_hours ? Number(form.engine_hours) : null,
    axle_count: form.axle_count ? Number(form.axle_count) : null,
    purchase_date: form.purchase_date || null,
    current_odometer: form.current_odometer ? Number(form.current_odometer) : null,
    current_gps_lat: form.current_gps_lat ? Number(form.current_gps_lat) : null,
    current_gps_lon: form.current_gps_lon ? Number(form.current_gps_lon) : null,
    additional_info: form.additional_info.trim() || null,
    avatar: form.avatar || null,
    is_active: form.is_active,
  }
}
