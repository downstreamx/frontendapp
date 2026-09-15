import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { createGoal, getGoal, updateGoal } from '../goal-api'
import { useGoalsIndexMeta } from '../hooks/use-goal-meta'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function GoalFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [goalName, setGoalName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [goalType, setGoalType] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('0')
  const [startDate, setStartDate] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [priority, setPriority] = useState('medium')
  const [status, setStatus] = useState('draft')

  const { meta, categoryOptions, goalTypeOptions } = useGoalsIndexMeta()

  const goalQuery = useQuery({
    queryKey: ['goal', id],
    queryFn: () => getGoal(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    const row = goalQuery.data
    if (!row) return
    setGoalName(row.goal_name)
    setDescription(row.goal_description ?? '')
    setCategoryId(String(row.category_id ?? row.category?.id ?? ''))
    setGoalType(row.goal_type ?? '')
    setTargetAmount(String(row.target_amount ?? ''))
    setCurrentAmount(String(row.current_amount ?? '0'))
    setStartDate(row.start_date?.slice(0, 10) ?? '')
    setTargetDate(row.target_date?.slice(0, 10) ?? '')
    setPriority(row.priority ?? 'medium')
    setStatus(row.status ?? 'draft')
  }, [goalQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit goal') : t('Create goal'),
    breadcrumbs: [
      { label: t('Goals'), url: paths.goal.index },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        goal_name: goalName,
        goal_description: description || undefined,
        category_id: Number(categoryId),
        goal_type: goalType,
        target_amount: Number(targetAmount),
        current_amount: Number(currentAmount),
        start_date: startDate,
        target_date: targetDate,
        priority,
        status,
      }
      return isEdit ? updateGoal(Number(id), payload) : createGoal(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Goal updated') : t('Goal created'))
      void queryClient.invalidateQueries({ queryKey: ['goal'] })
      navigate(paths.goal.show(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save goal'))),
  })

  if (isEdit && goalQuery.isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit goal') : t('Create goal')}</CardTitle>
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
            <Label>{t('Goal name')}</Label>
            <Input value={goalName} onChange={(e) => setGoalName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>{t('Description')}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('Category')}</Label>
              <EntitySelect value={categoryId} onValueChange={setCategoryId} options={categoryOptions} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Type')}</Label>
              <EntitySelect value={goalType} onValueChange={setGoalType} options={goalTypeOptions} required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('Target amount')}</Label>
              <Input type="number" min={0} step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Current amount')}</Label>
              <Input type="number" min={0} step="0.01" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('Start date')}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Target date')}</Label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('Priority')}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(meta?.priorities ?? ['low', 'medium', 'high']).map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('Status')}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(meta?.statuses ?? ['draft', 'active', 'completed']).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>{t('Save')}</Button>
            <Button type="button" variant="outline" asChild>
              <Link to={isEdit && id ? paths.goal.show(id) : paths.goal.index}>{t('Cancel')}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
