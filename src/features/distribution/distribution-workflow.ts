export type WorkflowStep = {
  key: string
  labelKey: string
  dateField?: string
}

export const distributionWorkflowSteps: Record<string, WorkflowStep[]> = {
  '/distribution/loading-schedules': [
    { key: 'not_left', labelKey: 'Not left yet' },
    { key: 'in_transit', labelKey: 'In transit', dateField: 'scheduled_date' },
    { key: 'arrived', labelKey: 'Arrived' },
    { key: 'at_depot', labelKey: 'At depot' },
  ],
  '/distribution/receiving-schedules': [
    { key: 'in_transit', labelKey: 'In transit', dateField: 'arrival_date' },
    { key: 'arrived', labelKey: 'Arrived' },
    { key: 'at_depot', labelKey: 'At depot' },
  ],
  '/distribution/transits': [
    { key: 'planned', labelKey: 'Planned' },
    { key: 'in_transit', labelKey: 'In transit', dateField: 'departed_at' },
    { key: 'completed', labelKey: 'Arrived', dateField: 'arrived_at' },
  ],
  '/distribution/delivery-schedules': [
    { key: 'scheduled', labelKey: 'Scheduled', dateField: 'scheduled_at' },
    { key: 'in_progress', labelKey: 'In progress' },
    { key: 'delivered', labelKey: 'Delivered', dateField: 'delivered_at' },
  ],
  '/distribution/shortages': [
    { key: 'open', labelKey: 'Open' },
    { key: 'resolved', labelKey: 'Resolved' },
  ],
  '/distribution/overages': [
    { key: 'open', labelKey: 'Open' },
    { key: 'resolved', labelKey: 'Resolved' },
  ],
  '/distribution/inventory-movements': [
    { key: 'draft', labelKey: 'Draft', dateField: 'movement_at' },
    { key: 'posted', labelKey: 'Posted' },
  ],
}

export const distributionEditableStatuses: Record<string, string[]> = {
  '/distribution/loading-schedules': ['not_left', 'in_transit', 'arrived'],
  '/distribution/receiving-schedules': ['in_transit', 'arrived'],
  '/distribution/transits': ['planned'],
  '/distribution/delivery-schedules': ['scheduled', 'in_progress'],
  '/distribution/shortages': ['open'],
  '/distribution/overages': ['open'],
}

export function canEditDistributionRecord(apiPath: string, status: string): boolean {
  return (distributionEditableStatuses[apiPath] ?? []).includes(status)
}

export function workflowStepIndex(apiPath: string, status: string): number {
  const steps = distributionWorkflowSteps[apiPath] ?? []
  const idx = steps.findIndex((s) => s.key === status)
  return idx >= 0 ? idx : 0
}
