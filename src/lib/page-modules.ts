import {
  accountEntities,
  budgetPlannerEntities,
  fleetEntities,
  hrmEntities,
} from './entity-registry'

export type PageModuleConfig = {
  title: string
  listApi?: string
  statusApi?: string
  labelKeys?: string[]
}

const entityListPages: Record<string, PageModuleConfig> = {}

for (const entity of [
  ...accountEntities,
  ...hrmEntities,
  ...fleetEntities,
  ...budgetPlannerEntities,
]) {
  entityListPages[entity.listPath] = {
    title: entity.title,
    listApi: entity.apiBase,
    labelKeys: entity.labelKeys,
  }
}

export const PAGE_MODULES: Record<string, PageModuleConfig> = {
  ...entityListPages,
  '/inventory/products': {
    title: 'Products',
    listApi: '/product-service/items',
    labelKeys: ['name', 'sku'],
  },
  '/inventory/categories': {
    title: 'Categories',
    listApi: '/product-service/categories',
    labelKeys: ['name'],
  },
  '/inventory/taxes': {
    title: 'Taxes',
    listApi: '/product-service/taxes',
    labelKeys: ['name'],
  },
  '/inventory/units': {
    title: 'Units',
    listApi: '/product-service/units',
    labelKeys: ['name'],
  },
  '/inventory/stock': {
    title: 'Product Stock',
    listApi: '/product-service/stock',
    labelKeys: ['name', 'sku'],
  },
  '/inventory/reorder-levels': {
    title: 'Reorder levels',
    listApi: '/product-service/reorder-levels',
    labelKeys: ['name', 'sku'],
  },
  '/depots': { title: 'Depots', listApi: '/depots', labelKeys: ['name', 'city'] },
  '/transfers': { title: 'Transfers', listApi: '/transfers', labelKeys: ['id', 'status'] },
  '/sales/invoices': {
    title: 'Sales invoices',
    listApi: '/sales/invoices',
    labelKeys: ['invoice_number', 'id', 'status'],
  },
  '/sales/orders': {
    title: 'Sales orders',
    listApi: '/sales/sales-orders',
    labelKeys: ['order_number', 'id', 'status'],
  },
  '/sales/returns': {
    title: 'Sales returns',
    listApi: '/sales/returns',
    labelKeys: ['return_number', 'id', 'status'],
  },
  '/purchase/invoices': {
    title: 'Purchase invoices',
    listApi: '/purchase/invoices',
    labelKeys: ['invoice_number', 'id', 'status'],
  },
  '/purchase/returns': {
    title: 'Purchase returns',
    listApi: '/purchase/returns',
    labelKeys: ['return_number', 'id', 'status'],
  },
  '/lead/leads': { title: 'Leads', listApi: '/lead/leads', labelKeys: ['name', 'id'] },
  '/lead/deals': { title: 'Deals', listApi: '/lead/deals', labelKeys: ['name', 'id'] },
  '/lead/pipelines': { title: 'Pipelines', listApi: '/lead/pipelines', labelKeys: ['name', 'id'] },
  '/support/tickets': {
    title: 'Support tickets',
    listApi: '/support-ticket/tickets',
    labelKeys: ['subject', 'id'],
  },
  '/dashboard/support-tickets': {
    title: 'Support Dashboard',
    listApi: '/dashboard/support',
    labelKeys: ['subject'],
  },
  '/support/knowledge-base': {
    title: 'Knowledge base',
    listApi: '/support-ticket/knowledge-bases',
    labelKeys: ['title', 'id'],
  },
  '/support/faqs': {
    title: 'FAQs',
    listApi: '/support-ticket/faqs',
    labelKeys: ['title', 'id'],
  },
  '/support/contacts': {
    title: 'Support contacts',
    listApi: '/support-ticket/contacts',
    labelKeys: ['email', 'subject', 'id'],
  },
  '/recruitment/job-postings': {
    title: 'Job postings',
    listApi: '/recruitment/job-postings',
    labelKeys: ['title', 'id'],
  },
  '/taskly/projects': {
    title: 'Projects',
    listApi: '/taskly/projects',
    labelKeys: ['name', 'title', 'id'],
  },
  '/project': {
    title: 'Projects',
    listApi: '/taskly/projects',
    labelKeys: ['name', 'title', 'id'],
  },
  '/account': { title: 'Account', statusApi: '/account/status' },
  '/distribution/delivery-schedules': {
    title: 'Delivery schedules',
    listApi: '/distribution/delivery-schedules',
    labelKeys: ['id', 'status'],
  },
  '/distribution/loading-schedules': {
    title: 'Loading schedules',
    listApi: '/distribution/loading-schedules',
    labelKeys: ['id', 'status'],
  },
  '/distribution/receiving-schedules': {
    title: 'Receiving schedules',
    listApi: '/distribution/receiving-schedules',
    labelKeys: ['id', 'status'],
  },
  '/fleet/truck-loading-dispatch-schedule': {
    title: 'Truck Loading Dispatch Schedule',
    listApi: '/distribution/loading-schedules',
    labelKeys: ['id', 'status'],
  },
  '/fleet/truck-loading-arrival-schedule': {
    title: 'Truck Loading Arrival Schedule',
    listApi: '/distribution/receiving-schedules',
    labelKeys: ['id', 'status'],
  },
  '/distribution/transits': {
    title: 'Transits',
    listApi: '/distribution/transits',
    labelKeys: ['id', 'status'],
  },
  '/distribution/shortages': {
    title: 'Shortages',
    listApi: '/distribution/shortages',
    labelKeys: ['id', 'status'],
  },
  '/distribution/overages': {
    title: 'Overages',
    listApi: '/distribution/overages',
    labelKeys: ['id', 'status'],
  },
  '/quotation/quotations': {
    title: 'Quotations',
    listApi: '/quotation/quotations',
    labelKeys: ['quotation_number', 'id', 'status'],
  },
  '/pos': { title: 'POS sales', listApi: '/pos/pos', labelKeys: ['id', 'status'] },
  '/form-builder/forms': {
    title: 'Forms',
    listApi: '/form-builder/forms',
    labelKeys: ['name', 'title', 'id'],
  },
  '/helpdesk/tickets': { title: 'Helpdesk tickets', listApi: '/helpdesk/tickets', labelKeys: ['title', 'id'] },
  '/helpdesk/categories': {
    title: 'Helpdesk categories',
    listApi: '/helpdesk/categories',
    labelKeys: ['name', 'id'],
  },
  '/coupons': { title: 'Coupons', listApi: '/coupons', labelKeys: ['code', 'name', 'id'] },
  '/orders': { title: 'Orders', listApi: '/orders', labelKeys: ['order_id', 'id'] },
  '/users': { title: 'Users', listApi: '/users', labelKeys: ['name', 'email', 'id'] },
  '/roles': { title: 'Roles', listApi: '/roles', labelKeys: ['name', 'id'] },
  '/plans': { title: 'Plans', listApi: '/plans' },
  '/training': { title: 'Training', listApi: '/training/trainings', labelKeys: ['name', 'title', 'id'] },
  '/performance': {
    title: 'Performance',
    listApi: '/performance/review-cycles',
    labelKeys: ['name', 'title', 'id'],
  },
  '/timesheet': { title: 'Timesheets', listApi: '/timesheet/timesheets', labelKeys: ['id', 'status'] },
  '/goal': { title: 'Goals', listApi: '/goal/goals', labelKeys: ['name', 'title', 'id'] },
  '/contract': { title: 'Contracts', listApi: '/contract/contracts', labelKeys: ['subject', 'title', 'id'] },
  '/calendar': {
    title: 'Calendar',
    listApi: '/calendar/events',
    labelKeys: ['title', 'start_date', 'type'],
  },
  '/settings': { title: 'Settings', statusApi: '/settings' },
  '/notification-templates': {
    title: 'Notification templates',
    listApi: '/notification-templates',
    labelKeys: ['module', 'action', 'type', 'id'],
  },
  '/bank-transfer': {
    title: 'Bank transfer requests',
    listApi: '/bank-transfer',
    labelKeys: ['order_id', 'status', 'id'],
  },
  '/email-templates': {
    title: 'Email templates',
    listApi: '/email-templates',
    labelKeys: ['name', 'module_name', 'id'],
  },
}

const MODULE_STATUS: Record<string, string> = {
  account: '/account/status',
  fleet: '/fleet/status',
  hrm: '/hrm/status',
  lead: '/lead/status',
  training: '/training/status',
  performance: '/performance/status',
  recruitment: '/recruitment/status',
  'double-entry': '/double-entry/status',
  distribution: '/distribution/status',
  pos: '/pos/status',
  quotation: '/quotation/status',
  support: '/support-ticket/status',
  'support-ticket': '/support-ticket/status',
  taskly: '/taskly/status',
  project: '/taskly/status',
  calendar: '/calendar/status',
  contract: '/contract/status',
  goal: '/goal/status',
  timesheet: '/timesheet/status',
  'budget-planner': '/budget-planner/status',
  'form-builder': '/form-builder/status',
  'landing-page': '/landing-page/status',
  helpdesk: '/helpdesk/status',
  messenger: '/messenger/status',
}

function titleFromPath(pathname: string): string {
  const segment = pathname.split('/').filter(Boolean).pop() ?? 'Module'
  return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function resolvePageModule(pathname: string): PageModuleConfig {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  if (PAGE_MODULES[normalized]) return PAGE_MODULES[normalized]
  const first = normalized.split('/').filter(Boolean)[0]
  if (first && MODULE_STATUS[first]) {
    return { title: titleFromPath(normalized), statusApi: MODULE_STATUS[first] }
  }
  return { title: titleFromPath(normalized) }
}
