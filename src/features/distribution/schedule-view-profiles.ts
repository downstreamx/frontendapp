import { paths } from '@/lib/paths'
import type { DistributionField } from './distribution-api'

const today = new Date().toISOString().slice(0, 10)

export type ScheduleColumnKey =
  | 'sn'
  | 'date'
  | 'product'
  | 'source'
  | 'qty'
  | 'truck_plate'
  | 'destination'
  | 'arrival_depot'
  | 'status'

export type ScheduleViewProfileKey =
  | 'fleet-dispatch'
  | 'fleet-arrival'
  | 'depot-loading'
  | 'depot-receiving'

export type ScheduleViewProfile = {
  key: ScheduleViewProfileKey
  entityKey: 'loading-schedules' | 'receiving-schedules'
  title: string
  singularTitle: string
  createButtonLabel: string
  listPath: string
  breadcrumbsModule: 'fleet' | 'depot'
  visibleStatuses: string[]
  statusLabels: Record<string, string>
  advanceLabels: Record<string, string>
  editableStatuses: string[]
  defaultCreateStatus: string
  columns: ScheduleColumnKey[]
  formFields: DistributionField[]
}

const loadingFormFields: DistributionField[] = [
  { name: 'scheduled_date', label: 'Date', type: 'date', required: true, defaultValue: today },
  { name: 'product_id', label: 'Product', lookup: 'product', required: true },
  { name: 'depot_id', label: 'From location / source', lookup: 'depot', required: true },
  { name: 'planned_quantity', label: 'Qty', type: 'number', required: true },
  { name: 'truck_id', label: 'Truck plate number', lookup: 'truck', required: true },
  { name: 'destination', label: 'Destination' },
]

const receivingFormFields: DistributionField[] = [
  { name: 'arrival_date', label: 'Date', type: 'date', required: true, defaultValue: today },
  { name: 'product_id', label: 'Product', lookup: 'product', required: true },
  { name: 'loading_depot_id', label: 'From location / source', lookup: 'depot', required: true },
  { name: 'quantity', label: 'Qty', type: 'number', required: true },
  { name: 'truck_id', label: 'Truck plate number', lookup: 'truck', required: true },
  { name: 'destination', label: 'Destination' },
]

const fleetArrivalFormFields: DistributionField[] = [
  ...receivingFormFields,
  { name: 'receiving_depot_id', label: 'Arrival depot', lookup: 'depot', required: true },
]

const scheduleColumns: ScheduleColumnKey[] = [
  'sn',
  'date',
  'product',
  'source',
  'qty',
  'truck_plate',
  'destination',
  'status',
]

const fleetArrivalColumns: ScheduleColumnKey[] = [
  ...scheduleColumns.slice(0, 7),
  'arrival_depot',
  'status',
]

export const scheduleViewProfiles: Record<ScheduleViewProfileKey, ScheduleViewProfile> = {
  'fleet-dispatch': {
    key: 'fleet-dispatch',
    entityKey: 'loading-schedules',
    title: 'Truck Loading Dispatch Schedule',
    singularTitle: 'Truck loading dispatch schedule',
    createButtonLabel: 'New truck loading dispatch schedule',
    listPath: paths.fleet.truckLoadingDispatchSchedule,
    breadcrumbsModule: 'fleet',
    visibleStatuses: ['not_left', 'in_transit'],
    statusLabels: {
      not_left: 'Not Left yet',
      in_transit: 'Truck In transit (TIT)',
    },
    advanceLabels: {
      not_left: 'Mark in transit (TIT)',
    },
    editableStatuses: ['not_left', 'in_transit'],
    defaultCreateStatus: 'not_left',
    columns: scheduleColumns,
    formFields: loadingFormFields,
  },
  'fleet-arrival': {
    key: 'fleet-arrival',
    entityKey: 'receiving-schedules',
    title: 'Truck Loading Arrival Schedule',
    singularTitle: 'Truck loading arrival schedule',
    createButtonLabel: 'New truck loading arrival schedule',
    listPath: paths.fleet.truckLoadingArrivalSchedule,
    breadcrumbsModule: 'fleet',
    visibleStatuses: ['in_transit', 'arrived'],
    statusLabels: {
      in_transit: 'In-transit',
      arrived: 'Arrived (ARR)',
    },
    advanceLabels: {
      in_transit: 'Mark arrived (ARR)',
    },
    editableStatuses: ['in_transit', 'arrived'],
    defaultCreateStatus: 'in_transit',
    columns: fleetArrivalColumns,
    formFields: fleetArrivalFormFields,
  },
  'depot-loading': {
    key: 'depot-loading',
    entityKey: 'loading-schedules',
    title: 'Loading Schedules',
    singularTitle: 'Loading schedule',
    createButtonLabel: 'New loading schedule',
    listPath: paths.distribution.loadingSchedules,
    breadcrumbsModule: 'depot',
    visibleStatuses: ['arrived', 'at_depot'],
    statusLabels: {
      arrived: 'Arrived (ARR)',
      at_depot: 'Depot',
    },
    advanceLabels: {
      arrived: 'Mark at depot',
    },
    editableStatuses: ['arrived', 'at_depot'],
    defaultCreateStatus: 'arrived',
    columns: scheduleColumns,
    formFields: loadingFormFields,
  },
  'depot-receiving': {
    key: 'depot-receiving',
    entityKey: 'receiving-schedules',
    title: 'Receiving Schedules',
    singularTitle: 'Receiving schedule',
    createButtonLabel: 'New receiving schedule',
    listPath: paths.distribution.receivingSchedules,
    breadcrumbsModule: 'depot',
    visibleStatuses: ['arrived', 'at_depot'],
    statusLabels: {
      arrived: 'Arrived (ARR)',
      at_depot: 'Depot',
    },
    advanceLabels: {
      arrived: 'Mark at depot',
    },
    editableStatuses: ['arrived', 'at_depot'],
    defaultCreateStatus: 'arrived',
    columns: scheduleColumns,
    formFields: receivingFormFields,
  },
}

export function scheduleViewProfileByKey(
  key: ScheduleViewProfileKey,
): ScheduleViewProfile {
  return scheduleViewProfiles[key]
}
