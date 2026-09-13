import { useQuery } from '@tanstack/react-query'
import { fetchBudgetPeriodsIndexMeta, fetchBudgetsIndexMeta } from '../budget-planner-api'
import type { LookupOption } from '@/features/_shared/operations-lookups'

export function useBudgetsMeta() {
  const query = useQuery({
    queryKey: ['budget-planner', 'budgets', 'index-meta'],
    queryFn: fetchBudgetsIndexMeta,
    staleTime: 60_000,
  })

  const meta = query.data

  const periodOptions: LookupOption[] =
    meta?.budget_periods.map((p) => ({
      id: p.id,
      label: p.financial_year ? `${p.period_name} (${p.financial_year})` : p.period_name,
    })) ?? []

  return { ...query, meta, periodOptions }
}

export function useBudgetPeriodsMeta() {
  const query = useQuery({
    queryKey: ['budget-planner', 'budget-periods', 'index-meta'],
    queryFn: fetchBudgetPeriodsIndexMeta,
    staleTime: 60_000,
  })

  return { ...query, meta: query.data }
}
