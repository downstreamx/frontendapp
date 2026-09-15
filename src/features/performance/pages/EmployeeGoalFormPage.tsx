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
import { createEmployeeGoal, getEmployeeGoal, updateEmployeeGoal } from '../performance-api'
import { useEmployeeGoalsIndexMeta } from '../hooks/use-performance-meta'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function EmployeeGoalFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [employeeId, setEmployeeId] = useState('')
  const [goalTypeId, setGoalTypeId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [target, setTarget] = useState('')
  const [progress, setProgress] = useState('')
  const [status, setStatus] = useState('')

  const { meta, employeeOptions, goalTypeOptions } = useEmployeeGoalsIndexMeta()

  const goalQuery = useQuery({
    queryKey: ['performance', 'employee-goals', id],
    queryFn: () => getEmployeeGoal(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    const row = goalQuery.data
    if (!row) return
    setEmployeeId(String(row.employee_id ?? row.employee?.id ?? ''))
    setGoalTypeId(String(row.goal_type_id ?? row.goal_type?.id ?? ''))
    setTitle(row.title)
    setDescription(row.description ?? '')
    setStartDate(row.start_date?.slice(0, 10) ?? '')
    setEndDate(row.end_date?.slice(0, 10) ?? '')
    setTarget(row.target != null ? String(row.target) : '')
    setProgress(row.progress != null ? String(row.progress) : '')
    setStatus(row.status ?? '')
  }, [goalQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit employee goal') : t('Create employee goal'),
    breadcrumbs: [
      { label: t('Performance') },
      { label: t('Employee goals'), url: paths.performance.employeeGoals },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        employee_id: Number(employeeId),
        goal_type_id: Number(goalTypeId),
        title,
        description: description || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        target: target ? Number(target) : undefined,
        progress: progress ? Number(progress) : undefined,
        status: status || undefined,
      }
      return isEdit ? updateEmployeeGoal(Number(id), payload) : createEmployeeGoal(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Employee goal updated') : t('Employee goal created'))
      void queryClient.invalidateQueries({ queryKey: ['performance', 'employee-goals'] })
      navigate(paths.performance.employeeGoalShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save employee goal'))),
  })

  if (isEdit && goalQuery.isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit employee goal') : t('Create employee goal')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('Employee')}</Label>
              <EntitySelect value={employeeId} onValueChange={setEmployeeId} options={employeeOptions} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Goal type')}</Label>
              <EntitySelect value={goalTypeId} onValueChange={setGoalTypeId} options={goalTypeOptions} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('Title')}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>{t('Description')}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('Start date')}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('End date')}</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('Target')}</Label>
              <Input type="number" min={0} step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('Progress')}</Label>
              <Input type="number" min={0} step="0.01" value={progress} onChange={(e) => setProgress(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('Status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select status')} />
              </SelectTrigger>
              <SelectContent>
                {(meta?.statuses ?? []).map((s) => (
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
              <Link
                to={
                  isEdit && id ? paths.performance.employeeGoalShow(id) : paths.performance.employeeGoals
                }
              >
                {t('Cancel')}
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
