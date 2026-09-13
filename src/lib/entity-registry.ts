/** Declarative CRUD entities for JSX port waves (Hrm, Fleet, Account, etc.). */
export type EntityDef = {
  slug: string
  title: string
  apiBase: string
  listPath: string
  permission?: string
  labelKeys?: string[]
}

export const fleetEntities: EntityDef[] = [
  { slug: 'trucks', title: 'Trucks', apiBase: '/fleet/trucks', listPath: '/fleet/trucks', labelKeys: ['name', 'plate_number', 'id'] },
  { slug: 'drivers', title: 'Drivers', apiBase: '/fleet/drivers', listPath: '/fleet/drivers', labelKeys: ['name', 'id'] },
  { slug: 'truck-providers', title: 'Truck providers', apiBase: '/fleet/truck-providers', listPath: '/fleet/truck-providers' },
  { slug: 'maintenance-providers', title: 'Maintenance providers', apiBase: '/fleet/maintenance-providers', listPath: '/fleet/maintenance-providers' },
  { slug: 'truck-maintenances', title: 'Truck maintenances', apiBase: '/fleet/truck-maintenances', listPath: '/fleet/truck-maintenances' },
]

export const hrmEntitiesBatchA: EntityDef[] = [
  { slug: 'employees/depot-reps', title: 'Depot reps', apiBase: '/hrm/depot-reps', listPath: '/hrm/employees/depot-reps', labelKeys: ['name', 'email'] },
  { slug: 'branches', title: 'Branches', apiBase: '/hrm/branches', listPath: '/hrm/branches', labelKeys: ['branch_name', 'id'] },
  { slug: 'departments', title: 'Departments', apiBase: '/hrm/departments', listPath: '/hrm/departments', labelKeys: ['department_name', 'id'] },
  { slug: 'designations', title: 'Designations', apiBase: '/hrm/designations', listPath: '/hrm/designations', labelKeys: ['designation_name', 'id'] },
]

export const hrmEntitiesBatchB: EntityDef[] = [
  { slug: 'attendances', title: 'Attendance', apiBase: '/hrm/attendances', listPath: '/hrm/attendances' },
  { slug: 'shifts', title: 'Shifts', apiBase: '/hrm/shifts', listPath: '/hrm/shifts', labelKeys: ['shift_name', 'id'] },
  { slug: 'leave-types', title: 'Leave types', apiBase: '/hrm/leave-types', listPath: '/hrm/leave-types', labelKeys: ['name', 'id'] },
  { slug: 'leave-applications', title: 'Leave applications', apiBase: '/hrm/leave-applications', listPath: '/hrm/leave-applications', labelKeys: ['id', 'status'] },
  { slug: 'payrolls', title: 'Payrolls', apiBase: '/hrm/payrolls', listPath: '/hrm/payrolls' },
]

export const accountEntitiesCore: EntityDef[] = [
  { slug: 'customers', title: 'Customers', apiBase: '/account/customers', listPath: '/account/customers', labelKeys: ['name', 'company_name'] },
  { slug: 'suppliers', title: 'Suppliers', apiBase: '/account/suppliers', listPath: '/account/suppliers', labelKeys: ['name'] },
  { slug: 'journal-entries', title: 'Journal entries', apiBase: '/account/journal-entries', listPath: '/account/journal-entries', labelKeys: ['reference', 'id'] },
]

export const accountEntitiesBanking: EntityDef[] = [
  { slug: 'bank-accounts', title: 'Bank accounts', apiBase: '/account/bank-accounts', listPath: '/account/bank-accounts' },
  { slug: 'bank-transactions', title: 'Bank transactions', apiBase: '/account/bank-transactions', listPath: '/account/bank-transactions' },
  { slug: 'bank-transfers', title: 'Bank transfers', apiBase: '/account/bank-transfers', listPath: '/account/bank-transfers' },
  { slug: 'chart-of-accounts', title: 'Chart of accounts', apiBase: '/account/chart-of-accounts', listPath: '/account/chart-of-accounts', labelKeys: ['account_code', 'account_name'] },
  { slug: 'account-types', title: 'Account types', apiBase: '/account/account-types', listPath: '/account/account-types' },
  { slug: 'revenues', title: 'Revenues', apiBase: '/account/revenues', listPath: '/account/revenues' },
  { slug: 'expenses', title: 'Expenses', apiBase: '/account/expenses', listPath: '/account/expenses' },
  { slug: 'customer-payments', title: 'Customer payments', apiBase: '/account/customer-payments', listPath: '/account/customer-payments' },
  { slug: 'supplier-payments', title: 'Supplier payments', apiBase: '/account/supplier-payments', listPath: '/account/supplier-payments' },
  { slug: 'credit-notes', title: 'Credit notes', apiBase: '/account/credit-notes', listPath: '/account/credit-notes' },
  { slug: 'debit-notes', title: 'Debit notes', apiBase: '/account/debit-notes', listPath: '/account/debit-notes' },
]

export const accountEntities = [...accountEntitiesCore, ...accountEntitiesBanking]

export const hrmEntitiesBatchE: EntityDef[] = [
  { slug: 'holidays', title: 'Holidays', apiBase: '/hrm/holidays', listPath: '/hrm/holidays' },
  { slug: 'awards', title: 'Awards', apiBase: '/hrm/awards', listPath: '/hrm/awards' },
  { slug: 'promotions', title: 'Promotions', apiBase: '/hrm/promotions', listPath: '/hrm/promotions' },
  { slug: 'resignations', title: 'Resignations', apiBase: '/hrm/resignations', listPath: '/hrm/resignations' },
  { slug: 'terminations', title: 'Terminations', apiBase: '/hrm/terminations', listPath: '/hrm/terminations' },
  { slug: 'warnings', title: 'Warnings', apiBase: '/hrm/warnings', listPath: '/hrm/warnings' },
  { slug: 'complaints', title: 'Complaints', apiBase: '/hrm/complaints', listPath: '/hrm/complaints' },
  { slug: 'employee-transfers', title: 'Employee transfers', apiBase: '/hrm/employee-transfers', listPath: '/hrm/employee-transfers' },
  { slug: 'documents', title: 'Documents', apiBase: '/hrm/documents', listPath: '/hrm/documents' },
  { slug: 'acknowledgments', title: 'Acknowledgments', apiBase: '/hrm/acknowledgments', listPath: '/hrm/acknowledgments' },
  { slug: 'announcements', title: 'Announcements', apiBase: '/hrm/announcements', listPath: '/hrm/announcements' },
  { slug: 'events', title: 'Events', apiBase: '/hrm/events', listPath: '/hrm/events' },
]

export const hrmEntities = [...hrmEntitiesBatchA, ...hrmEntitiesBatchB, ...hrmEntitiesBatchE]

export const doubleEntryReports = [
  { title: 'Ledger summary', path: '/double-entry/ledger-summary', api: '/double-entry/ledger-summary' },
  { title: 'Trial balance', path: '/double-entry/trial-balance', api: '/double-entry/trial-balance' },
  { title: 'Balance sheet', path: '/double-entry/balance-sheets', api: '/double-entry/balance-sheets' },
  { title: 'Profit & loss', path: '/double-entry/profit-loss', api: '/double-entry/profit-loss' },
  { title: 'Reports', path: '/double-entry/reports', api: '/double-entry/reports' },
] as const

export const budgetPlannerEntities: EntityDef[] = [
  { slug: 'budget-periods', title: 'Budget periods', apiBase: '/budget-planner/budget-periods', listPath: '/budget-planner/budget-periods' },
  { slug: 'budgets', title: 'Budgets', apiBase: '/budget-planner/budgets', listPath: '/budget-planner/budgets' },
  { slug: 'allocations', title: 'Allocations', apiBase: '/budget-planner/allocations', listPath: '/budget-planner/allocations' },
  { slug: 'monitorings', title: 'Monitorings', apiBase: '/budget-planner/monitorings', listPath: '/budget-planner/monitorings' },
]

export const integrationProviders = [
  'stripe', 'paypal', 'slack', 'telegram', 'twilio', 'webhook', 'zoom-meeting', 'a-i-assistant',
] as const
