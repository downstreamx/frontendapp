import { paths } from '@/lib/paths'
import type { DistributionField } from './distribution-api'

const today = new Date().toISOString().slice(0, 10)

export type DistributionEntityConfig = {
  key: string
  title: string
  singularTitle: string
  apiPath: string
  listPath: string
  showPath: (id: string | number) => string
  createPath: string
  editPath: (id: string | number) => string
  labelKeys: string[]
  fields: DistributionField[]
  postAction?: boolean
}

export const distributionEntities: DistributionEntityConfig[] = [
  {
    key: 'loading-schedules',
    title: 'Loading schedules',
    singularTitle: 'Loading schedule',
    apiPath: '/distribution/loading-schedules',
    listPath: paths.distribution.loadingSchedules,
    showPath: paths.distribution.loadingScheduleShow,
    createPath: paths.distribution.loadingScheduleCreate,
    editPath: paths.distribution.loadingScheduleEdit,
    labelKeys: ['schedule_number', 'id'],
    fields: [
      { name: 'depot_id', label: 'Loading depot', lookup: 'depot', required: true },
      { name: 'receiving_depot_id', label: 'Receiving depot', lookup: 'depot' },
      { name: 'product_id', label: 'Product', lookup: 'product', required: true },
      { name: 'truck_id', label: 'Truck', lookup: 'truck', required: true },
      { name: 'driver_id', label: 'Driver', lookup: 'driver' },
      { name: 'truck_load_id', label: 'Truck load', lookup: 'truck_load' },
      { name: 'depot_rep_id', label: 'Depot rep', lookup: 'depot_rep' },
      { name: 'scheduled_date', label: 'Scheduled date', type: 'date', required: true, defaultValue: today },
      { name: 'loading_date', label: 'Loading date', type: 'date' },
      { name: 'destination', label: 'Destination' },
      { name: 'planned_quantity', label: 'Planned quantity', type: 'number', required: true },
      { name: 'notes', label: 'Notes' },
    ],
  },
  {
    key: 'receiving-schedules',
    title: 'Receiving schedules',
    singularTitle: 'Receiving schedule',
    apiPath: '/distribution/receiving-schedules',
    listPath: paths.distribution.receivingSchedules,
    showPath: paths.distribution.receivingScheduleShow,
    createPath: paths.distribution.receivingScheduleCreate,
    editPath: paths.distribution.receivingScheduleEdit,
    labelKeys: ['schedule_number', 'id'],
    fields: [
      { name: 'loading_depot_id', label: 'Loading depot', lookup: 'depot', required: true },
      { name: 'receiving_depot_id', label: 'Receiving depot', lookup: 'depot' },
      { name: 'product_id', label: 'Product', lookup: 'product', required: true },
      { name: 'truck_id', label: 'Truck', lookup: 'truck' },
      { name: 'driver_id', label: 'Driver', lookup: 'driver' },
      { name: 'truck_load_id', label: 'Truck load', lookup: 'truck_load' },
      { name: 'depot_rep_id', label: 'Depot rep', lookup: 'depot_rep' },
      { name: 'arrival_date', label: 'Arrival date', type: 'date', required: true, defaultValue: today },
      { name: 'quantity', label: 'Quantity', type: 'number', required: true },
      { name: 'destination', label: 'Destination' },
      { name: 'notes', label: 'Notes' },
    ],
  },
  {
    key: 'delivery-schedules',
    title: 'Delivery schedules',
    singularTitle: 'Delivery schedule',
    apiPath: '/distribution/delivery-schedules',
    listPath: paths.distribution.deliverySchedules,
    showPath: paths.distribution.deliveryScheduleShow,
    createPath: paths.distribution.deliveryScheduleCreate,
    editPath: paths.distribution.deliveryScheduleEdit,
    labelKeys: ['delivery_number', 'id'],
    fields: [
      { name: 'depot_id', label: 'Depot', lookup: 'depot', required: true },
      { name: 'loading_depot_id', label: 'Loading depot', lookup: 'depot' },
      { name: 'receiving_depot_id', label: 'Receiving depot', lookup: 'depot' },
      { name: 'product_id', label: 'Product', lookup: 'product' },
      { name: 'truck_id', label: 'Truck', lookup: 'truck' },
      { name: 'driver_id', label: 'Driver', lookup: 'driver' },
      { name: 'truck_load_id', label: 'Truck load', lookup: 'truck_load' },
      { name: 'depot_rep_id', label: 'Depot rep', lookup: 'depot_rep' },
      { name: 'scheduled_at', label: 'Scheduled at', type: 'datetime-local', required: true },
      { name: 'receiving_date', label: 'Receiving date', type: 'date' },
      { name: 'destination', label: 'Destination' },
      { name: 'quantity', label: 'Quantity', type: 'number', required: true },
      { name: 'transit_id', label: 'Transit', lookup: 'transit' },
      { name: 'notes', label: 'Notes' },
    ],
  },
  {
    key: 'delivery-confirmations',
    title: 'Delivery confirmations',
    singularTitle: 'Delivery confirmation',
    apiPath: '/distribution/delivery-confirmations',
    listPath: paths.distribution.deliveryConfirmations,
    showPath: paths.distribution.deliveryConfirmationShow,
    createPath: paths.distribution.deliveryConfirmationCreate,
    editPath: paths.distribution.deliveryConfirmationEdit,
    labelKeys: ['id'],
    fields: [
      { name: 'loading_schedule_id', label: 'Loading schedule', lookup: 'loading_schedule' },
      { name: 'delivery_schedule_id', label: 'Delivery schedule', lookup: 'delivery_schedule' },
      { name: 'truck_load_id', label: 'Truck load', lookup: 'truck_load' },
      { name: 'quantity_delivered', label: 'Quantity delivered', type: 'number', required: true },
      { name: 'shortage_qty', label: 'Shortage qty', type: 'number' },
      { name: 'delivered_at', label: 'Delivered at', type: 'datetime-local', required: true },
      { name: 'comment', label: 'Comment' },
    ],
  },
  {
    key: 'shortages',
    title: 'Delivery shortages',
    singularTitle: 'Shortage',
    apiPath: '/distribution/shortages',
    listPath: paths.distribution.shortages,
    showPath: paths.distribution.shortageShow,
    createPath: paths.distribution.shortageCreate,
    editPath: paths.distribution.shortageEdit,
    labelKeys: ['id'],
    fields: [
      { name: 'transit_id', label: 'Transit', lookup: 'transit', required: true },
      { name: 'product_id', label: 'Product', lookup: 'product', required: true },
      { name: 'truck_load_id', label: 'Truck load', lookup: 'truck_load' },
      { name: 'delivery_confirmation_id', label: 'Delivery confirmation', lookup: 'delivery_confirmation' },
      { name: 'expected_quantity', label: 'Expected quantity', type: 'number', required: true },
      { name: 'actual_quantity', label: 'Actual quantity', type: 'number', required: true },
      { name: 'reason', label: 'Reason' },
    ],
  },
  {
    key: 'overages',
    title: 'Delivery overages',
    singularTitle: 'Overage',
    apiPath: '/distribution/overages',
    listPath: paths.distribution.overages,
    showPath: paths.distribution.overageShow,
    createPath: paths.distribution.overageCreate,
    editPath: paths.distribution.overageEdit,
    labelKeys: ['id'],
    fields: [
      { name: 'transit_id', label: 'Transit', lookup: 'transit', required: true },
      { name: 'product_id', label: 'Product', lookup: 'product', required: true },
      { name: 'truck_load_id', label: 'Truck load', lookup: 'truck_load' },
      { name: 'delivery_confirmation_id', label: 'Delivery confirmation', lookup: 'delivery_confirmation' },
      { name: 'expected_quantity', label: 'Expected quantity', type: 'number', required: true },
      { name: 'actual_quantity', label: 'Actual quantity', type: 'number', required: true },
      { name: 'reason', label: 'Reason' },
    ],
  },
  {
    key: 'inventory-movements',
    title: 'Inventory movements',
    singularTitle: 'Inventory movement',
    apiPath: '/distribution/inventory-movements',
    listPath: paths.distribution.inventoryMovements,
    showPath: paths.distribution.inventoryMovementShow,
    createPath: paths.distribution.inventoryMovementCreate,
    editPath: paths.distribution.inventoryMovementEdit,
    labelKeys: ['reference_number', 'id'],
    postAction: true,
    fields: [
      { name: 'movement_type_id', label: 'Movement type', lookup: 'movement_type', required: true },
      { name: 'depot_id', label: 'Depot', lookup: 'depot', required: true },
      { name: 'product_id', label: 'Product', lookup: 'product', required: true },
      { name: 'quantity', label: 'Quantity', type: 'number', required: true },
      { name: 'movement_at', label: 'Movement at', type: 'date', required: true, defaultValue: today },
      { name: 'notes', label: 'Notes' },
    ],
  },
]

export function distributionEntityByKey(key: string): DistributionEntityConfig | undefined {
  return distributionEntities.find((e) => e.key === key)
}

/** Route config fields only — never pass `key` into JSX via spread (React reserved). */
export function distributionEntityPageProps(
  entity: DistributionEntityConfig,
): Omit<DistributionEntityConfig, 'key'> {
  const { key: _key, ...props } = entity
  return props
}
