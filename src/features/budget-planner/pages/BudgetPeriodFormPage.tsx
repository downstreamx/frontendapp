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
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { createBudgetPeriod, getBudgetPeriod, updateBudgetPeriod } from '../budget-planner-api'
import { useBudgetPeriodsMeta } from '../hooks/use-budget-planner-meta'

export function BudgetPeriodFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [periodName, setPeriodName] = useState('')
  const [financialYear, setFinancialYear] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('draft')

  const { meta } = useBudgetPeriodsMeta()

  const periodQuery = useQuery({
    queryKey: ['budget-planner', 'budget-periods', id],
    queryFn: () => getBudgetPeriod(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    const row = periodQuery.data
    if (!row) return
    setPeriodName(row.period_name)
    setFinancialYear(row.financial_year ?? '')
    setStartDate(row.start_date?.slice(0, 10) ?? '')
    setEndDate(row.end_date?.slice(0, 10) ?? '')
    setStatus(row.status ?? 'draft')
  }, [periodQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit budget period') : t('Create budget period'),
    breadcrumbs: [
      { label: t('Budget planner') },
      { label: t('Budget periods'), url: paths.budgetPlanner.periods },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        period_name: periodName,
        financial_year: financialYear,
        start_date: startDate,
        end_date: endDate,
        status,
      }
      return isEdit ? updateBudgetPeriod(Number(id), payload) : createBudgetPeriod(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? t('Period updated') : t('Period created'))
      void queryClient.invalidateQueries({ queryKey: ['budget-planner', 'budget-periods'] })
      navigate(paths.budgetPlanner.periods)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save period'))),
  })

  if (isEdit && periodQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit budget period') : t('Create budget period')}</CardTitle>
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
            <Label>{t('Period name')}</Label>
            <Input value={periodName} onChange={(e) => setPeriodName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>{t('Financial year')}</Label>
            <Input value={financialYear} onChange={(e) => setFinancialYear(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('Start date')}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('End date')}</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
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
              <Link to={paths.budgetPlanner.periods}>{t('Cancel')}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
