import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/forms/entity-select'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import {
  budgetPeriodLabel,
  createBudgetAllocation,
  deleteBudgetAllocation,
  getBudget,
  listBudgetAllocations,
} from '../budget-planner-api'
import { useBudgetsMeta } from '../hooks/use-budget-planner-meta'

export function BudgetShowPage() {
  const { id } = useParams<{ id: string }>()
  const budgetId = Number(id)
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('')

  const { meta } = useBudgetsMeta()

  const budgetQuery = useQuery({
    queryKey: ['budget-planner', 'budgets', id],
    queryFn: () => getBudget(budgetId),
    enabled: Number.isFinite(budgetId),
  })

  const allocationsQuery = useQuery({
    queryKey: ['budget-planner', 'budgets', id, 'allocations'],
    queryFn: () => listBudgetAllocations(budgetId),
    enabled: Number.isFinite(budgetId),
  })

  const budget = budgetQuery.data

  usePageChrome({
    pageTitle: budget?.budget_name ?? t('Budget'),
    breadcrumbs: [
      { label: t('Budget planner') },
      { label: t('Budgets'), url: paths.budgetPlanner.budgets },
      { label: budget?.budget_name ?? `#${id}` },
    ],
  })

  const accountOptions =
    meta?.expense_accounts?.map((a) => ({
      id: a.id,
      label: `${a.account_code} — ${a.account_name}`,
    })) ?? []

  const addMutation = useMutation({
    mutationFn: () =>
      createBudgetAllocation(budgetId, {
        account_id: Number(accountId),
        allocated_amount: Number(amount),
      }),
    onSuccess: () => {
      toast.success(t('Allocation added'))
      setAccountId('')
      setAmount('')
      void queryClient.invalidateQueries({ queryKey: ['budget-planner', 'budgets', id, 'allocations'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to add allocation'))),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBudgetAllocation,
    onSuccess: () => {
      toast.success(t('Allocation removed'))
      void queryClient.invalidateQueries({ queryKey: ['budget-planner', 'budgets', id, 'allocations'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to remove allocation'))),
  })

  if (budgetQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  if (!budget) {
    return <p className="text-sm text-destructive">{t('Budget not found.')}</p>
  }

  const allocations = allocationsQuery.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{budget.budget_name}</h1>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.budgetPlanner.budgetEdit(budget.id)}>{t('Edit')}</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.budgetPlanner.budgets}>{t('Back to budgets')}</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-2 pt-6 text-sm sm:grid-cols-2">
          <p>
            <span className="font-medium">{t('Period')}:</span>{' '}
            {budgetPeriodLabel(budget.budget_period, budget.period_id)}
          </p>
          <p>
            <span className="font-medium">{t('Type')}:</span> {budget.budget_type}
          </p>
          <p>
            <span className="font-medium">{t('Total')}:</span>{' '}
            {formatCurrency(Number(budget.total_budget_amount ?? 0))}
          </p>
          <p className="capitalize">
            <span className="font-medium">{t('Status')}:</span> {budget.status}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Allocations')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid gap-3 sm:grid-cols-[1fr_160px_auto]"
            onSubmit={(e) => {
              e.preventDefault()
              if (!accountId || !amount) return
              addMutation.mutate()
            }}
          >
            <div className="space-y-1">
              <Label>{t('Expense account')}</Label>
              <EntitySelect value={accountId} onValueChange={setAccountId} options={accountOptions} />
            </div>
            <div className="space-y-1">
              <Label>{t('Amount')}</Label>
              <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={addMutation.isPending}>
                {t('Add')}
              </Button>
            </div>
          </form>

          <ul className="divide-y rounded-md border text-sm">
            {allocations.length === 0 ? (
              <li className="p-3 text-muted-foreground">{t('No allocations yet.')}</li>
            ) : (
              allocations.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2 p-3">
                  <span>
                    {row.account?.account_code} — {row.account?.account_name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span>{formatCurrency(Number(row.allocated_amount))}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(t('Remove this allocation?'))) {
                          deleteMutation.mutate(row.id)
                        }
                      }}
                    >
                      {t('Remove')}
                    </Button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
