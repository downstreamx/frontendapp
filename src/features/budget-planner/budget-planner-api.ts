import { api, type ApiSuccess } from '@/lib/api'
import { extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type BudgetPeriodRow = {
  id: number
  period_name: string
  financial_year?: string
  start_date?: string
  end_date?: string
  status?: string
  budgets_count?: number
}

export type BudgetRow = {
  id: number
  budget_name: string
  period_id?: number
  budget_type?: string
  total_budget_amount?: string | number
  status?: string
  budget_period?: { id?: number; period_name?: string; financial_year?: string }
  allocations_count?: number
}

export type BudgetPlannerMeta = {
  budget_periods: Array<{ id: number; period_name: string; financial_year?: string }>
}

export type BudgetsIndexMeta = {
  statuses: string[]
  budget_types: string[]
  budget_periods: Array<{ id: number; period_name: string; financial_year?: string }>
  expense_accounts?: Array<{ id: number; account_code: string; account_name: string }>
}

export type BudgetAllocationRow = {
  id: number
  budget_id: number
  account_id: number
  allocated_amount: string | number
  spent_amount?: string | number
  remaining_amount?: string | number
  account?: { id: number; account_code: string; account_name: string }
}

export type BudgetPeriodsIndexMeta = {
  statuses: string[]
  financial_years: string[]
}

export async function fetchBudgetPlannerMeta(): Promise<BudgetPlannerMeta> {
  const { data } = await api.get<ApiSuccess<BudgetPlannerMeta>>('/budget-planner/create-meta')
  return data.data
}

export async function fetchBudgetsIndexMeta(): Promise<BudgetsIndexMeta> {
  const { data } = await api.get<ApiSuccess<BudgetsIndexMeta>>('/budget-planner/budgets/index-meta')
  return data.data
}

export async function fetchBudgetPeriodsIndexMeta(): Promise<BudgetPeriodsIndexMeta> {
  const { data } = await api.get<ApiSuccess<BudgetPeriodsIndexMeta>>(
    '/budget-planner/budget-periods/index-meta',
  )
  return data.data
}

export async function listBudgetPeriodsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<BudgetPeriodRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/budget-planner/budget-periods', { params })
  return extractPaginatedList<BudgetPeriodRow>(data)
}

export async function listBudgetsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<BudgetRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/budget-planner/budgets', { params })
  return extractPaginatedList<BudgetRow>(data)
}

export async function createBudgetPeriod(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<BudgetPeriodRow>>('/budget-planner/budget-periods', payload)
  return data.data
}

export async function updateBudgetPeriod(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<BudgetPeriodRow>>(
    `/budget-planner/budget-periods/${id}`,
    payload,
  )
  return data.data
}

export async function deleteBudgetPeriod(id: number) {
  await api.delete(`/budget-planner/budget-periods/${id}`)
}

export async function createBudget(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiSuccess<BudgetRow>>('/budget-planner/budgets', payload)
  return data.data
}

export async function updateBudget(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<ApiSuccess<BudgetRow>>(`/budget-planner/budgets/${id}`, payload)
  return data.data
}

export async function deleteBudget(id: number) {
  await api.delete(`/budget-planner/budgets/${id}`)
}

export async function getBudget(id: number) {
  const { data } = await api.get<ApiSuccess<BudgetRow>>(`/budget-planner/budgets/${id}`)
  return data.data
}

export async function getBudgetPeriod(id: number) {
  const { data } = await api.get<ApiSuccess<BudgetPeriodRow>>(`/budget-planner/budget-periods/${id}`)
  return data.data
}

export async function listBudgetAllocations(budgetId: number) {
  const { data } = await api.get<ApiSuccess<BudgetAllocationRow[]>>(
    `/budget-planner/budgets/${budgetId}/allocations`,
  )
  return data.data
}

export async function createBudgetAllocation(
  budgetId: number,
  payload: { account_id: number; allocated_amount: number },
) {
  const { data } = await api.post<ApiSuccess<BudgetAllocationRow>>(
    `/budget-planner/budgets/${budgetId}/allocations`,
    payload,
  )
  return data.data
}

export async function deleteBudgetAllocation(id: number) {
  await api.delete(`/budget-planner/allocations/${id}`)
}

export function budgetPeriodLabel(period?: BudgetRow['budget_period'], periodId?: number): string {
  const name = period?.period_name?.trim()
  if (name) {
    const year = period.financial_year?.trim()
    return year ? `${name} (${year})` : name
  }
  return periodId != null ? `Period #${periodId}` : '—'
}
