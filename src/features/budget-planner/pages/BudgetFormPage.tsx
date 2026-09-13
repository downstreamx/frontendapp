import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EntitySelect } from '@/components/forms/entity-select'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { createBudget, getBudget, updateBudget } from '../budget-planner-api'
import { useBudgetsMeta } from '../hooks/use-budget-planner-meta'

export function BudgetFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [budgetName, setBudgetName] = useState('')
  const [periodId, setPeriodId] = useState('')
  const [budgetType, setBudgetType] = useState('operating')
  const [totalAmount, setTotalAmount] = useState('')
  const [status, setStatus] = useState('draft')

  const { meta, periodOptions } = useBudgetsMeta()

  const budgetQuery = useQuery({
    queryKey: ['budget-planner', 'budgets', id],
    queryFn: () => getBudget(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    const row = budgetQuery.data
    if (!row) return
    setBudgetName(row.budget_name)
    setPeriodId(String(row.period_id ?? row.budget_period?.id ?? ''))
    setBudgetType(row.budget_type ?? 'operating')
    setTotalAmount(String(row.total_budget_amount ?? ''))
    setStatus(row.status ?? 'draft')
  }, [budgetQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit budget') : t('Create budget'),
    breadcrumbs: [
      { label: t('Budget planner') },
      { label: t('Budgets'), url: paths.budgetPlanner.budgets },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        budget_name: budgetName,
        period_id: Number(periodId),
        budget_type: budgetType,
        total_budget_amount: Number(totalAmount),
        status,
      }
      return isEdit ? updateBudget(Number(id), payload) : createBudget(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Budget updated') : t('Budget created'))
      void queryClient.invalidateQueries({ queryKey: ['budget-planner', 'budgets'] })
      navigate(paths.budgetPlanner.budgetShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save budget'))),
  })

  if (isEdit && budgetQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit budget') : t('Create budget')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
        >
          <div className="space-y-1">
            <Label>{t('Budget name')}</Label>
            <Input value={budgetName} onChange={(e) => setBudgetName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>{t('Period')}</Label>
            <EntitySelect value={periodId} onValueChange={setPeriodId} options={periodOptions} required />
          </div>
          <div className="space-y-1">
            <Label>{t('Budget type')}</Label>
            <Select value={budgetType} onValueChange={setBudgetType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(meta?.budget_types ?? ['operating', 'capital', 'project']).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t('Total amount')}</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>{t('Status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(meta?.statuses ?? ['draft', 'approved', 'active', 'closed']).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {t('Save')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={isEdit && id ? paths.budgetPlanner.budgetShow(id) : paths.budgetPlanner.budgets}>
                {t('Cancel')}
              </Link>
            </Button>
            </div>
        </form>
      </CardContent>
    </Card>
  )
}
