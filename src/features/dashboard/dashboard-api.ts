import { api, type ApiSuccess } from '@/lib/api'

export type DashboardChartSlice = {
  name: string
  value: number
  color: string
  unit?: string | null
}

export type SuperAdminDashboard = {
  stats: {
    order_payments: number
    total_orders: number
    total_plans: number
    total_companies: number
  }
  chart_data: Array<{ month: string; orders: number; payments: number }>
}

export type AccountDashboard = {
  stats: {
    total_clients: number
    total_suppliers: number
    total_revenue: number
    total_expense: number
    total_customer_payment: number
    total_supplier_payment: number
    net_profit: number
  }
  monthly_customer_payments: Array<{ month: string; customer_payments: number }>
  monthly_supplier_payments: Array<{ month: string; supplier_payments: number }>
  recent_revenues: Array<{ id: number; title: string; description?: string; amount: number; date: string }>
  recent_expenses: Array<{ id: number; title: string; description?: string; amount: number; date: string }>
}

export type FleetDashboard = {
  stats: Record<string, number>
  recent_trips: Array<{ id: number; label: string; status: string; date: string }>
  recent_maintenances: Array<{ id: number; label: string; status: string; date: string }>
}

export type DepotDashboard = {
  stats: Record<string, number>
  low_stock: Array<{ depot?: string; product?: string; sku?: string; quantity: number }>
  recent_transfers: Array<{ id: number; status: string; quantity: number; date: string }>
}

export type InventoryDashboard = {
  stats: Record<string, number>
  low_stock: Array<{ depot?: string; product?: string; sku?: string; quantity: number }>
  recent_products: Array<{
    id: number
    name: string
    sku?: string
    sale_price: number
    is_active: boolean
  }>
  category_breakdown: DashboardChartSlice[]
}

export type ProjectDashboard = {
  stats: {
    total_projects: number
    total_tasks: number
    total_bugs: number
    total_users: number
    total_clients: number
    completed_tasks: number
    completion_rate: number
    overdue_projects: number
  }
  recent_tasks: Array<{
    id: number
    title: string
    priority: string
    project: string
    stage: string
    stage_color?: string | null
    assignee: string
    is_completed: boolean
  }>
  project_status: DashboardChartSlice[]
  task_priority: DashboardChartSlice[]
  team_performance: Array<{
    name: string
    total_tasks: number
    completed_tasks: number
    completion_rate: number
  }>
  monthly_progress: Array<{ month: string; created: number; completed: number }>
  bug_stats: { open: number; resolved: number }
}

export type DistributionActivityRow = {
  id: number
  label: string
  status: string
  quantity: number
  date: string
}

export type DistributionDashboard = {
  stats: Record<string, number>
  transit_status: Array<{ name: string; value: number; color: string }>
  monthly_transits: Array<{ month: string; departed: number; completed: number }>
  recent_transits: DistributionActivityRow[]
  recent_loading_schedules: DistributionActivityRow[]
  recent_shortages: DistributionActivityRow[]
}

export type HrmDashboard = {
  stats: {
    total_employees: number
    present_today: number
    absent_today: number
    absent_yesterday: number
    on_leave: number
    pending_leaves: number
    total_branches: number
    total_departments: number
    total_promotions: number
    terminations: number
    attendance_rate: number
  }
  department_distribution: DashboardChartSlice[]
  employees_on_leave_today: Array<{ name: string; leave_type: string; days: number }>
  employees_without_attendance: Array<{ employee_id: string; name: string; department: string }>
  recent_leave_applications: Array<{
    id: number
    employee_name: string
    leave_type: string
    start_date: string
    end_date: string
    total_days: number
    status: string
    created_at: string
  }>
  recent_announcements: Array<{
    id: number
    title: string
    description: string
    created_at: string
  }>
  calendar_events: Array<{
    id: number
    title: string
    start_date: string
    end_date: string
    time: string
    description: string
    type: string
    color: string
  }>
}

export type CompanyOverviewDashboard = {
  inventory_summary: {
    total_products: number
    active_products: number
    low_stock_items: number
    total_stock_quantity: number
  }
  monthly_inventory_chart: Array<{ month: string; stock_quantity: number }>
  monthly_sales_by_product: DashboardChartSlice[]
  sales_volume_month: string
  account_summary: {
    total_clients: number
    total_suppliers: number
    total_revenue: number
    total_expense: number
    net_profit: number
  }
  key_metrics: {
    pending_bridging_approvals: number
    undistributed_qty: number
    unbridged_purchase_qty: number
    overdue_invoices: number
    trucks_out_today: number
    open_transits: number
  }
  pending_actions: Array<{
    key: string
    label: string
    count: number
    href: string
  }>
  quick_actions: Array<{ label: string; href: string }>
  low_stock: Array<{ depot?: string; product?: string; sku?: string; quantity: number }>
  recent_products: Array<{
    id: number
    name: string
    sku?: string
    sale_price: number
    is_active: boolean
  }>
}

export type SupportDashboard = {
  stats: {
    total_tickets: number
    open_tickets: number
    closed_tickets: number
    today_tickets: number
    categories: number
    knowledge_base: number
    faqs: number
    avg_response_hours: number
    resolution_rate: number
  }
  monthly_tickets: Array<{ month: string; tickets: number }>
  category_breakdown: DashboardChartSlice[]
  status_distribution: DashboardChartSlice[]
  recent_tickets: Array<{
    id: number
    ticket_id: string
    name: string
    email: string
    subject: string
    status: string
    category: string
    created_at: string
  }>
}

async function fetchDashboard<T>(path: string): Promise<T> {
  const { data } = await api.get<ApiSuccess<T>>(path)
  return data.data
}

export const fetchCompanyOverviewDashboard = () =>
  fetchDashboard<CompanyOverviewDashboard>('/dashboard/overview')
export const fetchAccountDashboard = () => fetchDashboard<AccountDashboard>('/dashboard/account')
export const fetchFleetDashboard = () => fetchDashboard<FleetDashboard>('/dashboard/fleet')
export const fetchDepotDashboard = () => fetchDashboard<DepotDashboard>('/dashboard/depot')
export const fetchInventoryDashboard = () => fetchDashboard<InventoryDashboard>('/dashboard/inventory')
export const fetchProjectDashboard = () => fetchDashboard<ProjectDashboard>('/dashboard/project')
export const fetchDistributionDashboard = () =>
  fetchDashboard<DistributionDashboard>('/dashboard/distribution')
export const fetchHrmDashboard = () => fetchDashboard<HrmDashboard>('/dashboard/hrm')
export const fetchSupportDashboard = () => fetchDashboard<SupportDashboard>('/dashboard/support')
export const fetchSuperAdminDashboard = () =>
  fetchDashboard<SuperAdminDashboard>('/platform/dashboard')
