import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { CurrencyInput } from '@/components/ui/currency-input'
import { MultiSelectEnhanced } from '@/components/ui/multi-select-enhanced'
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
import { cn } from '@/lib/utils'
import {
  createProject,
  fetchProjectCreateMeta,
  fetchProjectEditMeta,
  PROJECT_STATUSES,
  updateProject,
  type ProjectMilestoneInput,
} from '../taskly-api'
import type { FormDialogCallbacks } from '@/features/shared/types/form-presentation'

type MilestoneRow = ProjectMilestoneInput & { key: string }

const emptyMilestone = (): MilestoneRow => ({
  key: crypto.randomUUID(),
  title: '',
  cost: null,
  start_date: '',
  end_date: '',
  summary: '',
  status: 'Incomplete',
  progress: 0,
})

export function ProjectFormPage({
  presentation = 'page',
  onSuccess,
  onCancel,
}: FormDialogCallbacks = {}) {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const isDialog = presentation === 'dialog' && !isEdit
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('0')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<string>('Ongoing')
  const [userIds, setUserIds] = useState<string[]>([])
  const [milestones, setMilestones] = useState<MilestoneRow[]>([])
  const [hydrated, setHydrated] = useState(false)

  usePageChrome(
    isDialog
      ? {}
      : {
          pageTitle: isEdit ? t('Edit Project') : t('Create Project'),
          breadcrumbs: [
            { label: t('Projects'), url: paths.taskly.projects },
            { label: isEdit ? t('Edit Project') : t('Create Project') },
          ],
        },
  )

  const { data: createMeta, isLoading: createLoading } = useQuery({
    queryKey: ['taskly', 'projects', 'create-meta'],
    queryFn: fetchProjectCreateMeta,
    enabled: !isEdit,
  })

  const { data: editMeta, isLoading: editLoading } = useQuery({
    queryKey: ['taskly', 'projects', id, 'edit-meta'],
    queryFn: () => fetchProjectEditMeta(id!),
    enabled: isEdit,
  })

  const isLoading = isEdit ? editLoading : createLoading
  const projectStatuses = isEdit
    ? (editMeta?.statuses ?? [...PROJECT_STATUSES])
    : [...PROJECT_STATUSES]

  const userOptions =
    createMeta?.users.map((user) => ({
      value: String(user.id),
      label: user.name,
    })) ?? []

  useEffect(() => {
    if (!isEdit || !editMeta?.project || hydrated) return
    const project = editMeta.project
    setName(project.name)
    setDescription(project.description ?? '')
    setBudget(String(project.budget ?? 0))
    setStartDate(project.start_date ?? '')
    setEndDate(project.end_date ?? '')
    setStatus(project.status ?? 'Ongoing')
    setHydrated(true)
  }, [editMeta, hydrated, isEdit])

  const saveMutation = useMutation({
    mutationFn: () => {
      if (isEdit) {
        return updateProject(id!, {
          name: name.trim(),
          description: description.trim() || undefined,
          budget: Number(budget) || 0,
          start_date: startDate,
          end_date: endDate,
          status,
        })
      }
      return createProject({
        name: name.trim(),
        user_ids: userIds.map((uid) => Number(uid)),
        description: description.trim() || undefined,
        budget: Number(budget) || 0,
        start_date: startDate,
        end_date: endDate,
        milestones: milestones
          .filter((row) => row.title.trim())
          .map(({ key: _key, ...row }) => ({
            title: row.title.trim(),
            cost: row.cost != null ? Number(row.cost) : null,
            start_date: row.start_date || null,
            end_date: row.end_date || null,
            summary: row.summary?.trim() || null,
            status: row.status ?? 'Incomplete',
            progress: row.progress ?? 0,
          })),
      })
    },
    onSuccess: (result) => {
      toast.success(
        isEdit
          ? t('The project details are updated successfully.')
          : t('The project has been created successfully.'),
      )
      if (isDialog && onSuccess) {
        onSuccess(result)
        return
      }
      navigate(paths.taskly.projectShow(result.id))
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(
          error,
          isEdit ? t('Failed to update project') : t('Failed to create project'),
        ),
      ),
  })

  const updateMilestone = (key: string, patch: Partial<MilestoneRow>) => {
    setMilestones((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error(t('Name is required'))
      return
    }
    if (!startDate || !endDate) {
      toast.error(t('Start and end dates are required'))
      return
    }
    if (!isEdit && userIds.length === 0) {
      toast.error(t('Select at least one user'))
      return
    }
    saveMutation.mutate()
  }

  if (isLoading || (isEdit && !hydrated)) {
    return <p className="text-sm text-muted-foreground">{t('Loading...')}</p>
  }

  return (
    <Card className={cn(isDialog ? 'border-0 shadow-none' : 'max-w-3xl shadow-sm')}>
      <CardContent className="pt-6">
        <form onSubmit={submit} className="space-y-6">
          <div className="space-y-1">
            <Label htmlFor="name">{t('Name')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('Enter project name')}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('Start Date')}</Label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder={t('Select start date')}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('End Date')}</Label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder={t('Select end date')}
              />
            </div>
          </div>

          {!isEdit ? (
            <div className="space-y-1">
              <Label>{t('Users')}</Label>
              <MultiSelectEnhanced
                options={userOptions}
                value={userIds}
                onValueChange={setUserIds}
                placeholder={t('Select users')}
                searchable
              />
            </div>
          ) : null}

          <CurrencyInput
            label={t('Budget')}
            value={budget}
            onChange={setBudget}
            required
          />

          {isEdit ? (
            <div className="space-y-1">
              <Label htmlFor="status">{t('Status')}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-1">
            <Label htmlFor="description">{t('Description')}</Label>
            <Textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('Enter project description')}
            />
          </div>

          {!isEdit ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('Milestones')}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMilestones((rows) => [...rows, emptyMilestone()])}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {t('Add milestone')}
                </Button>
              </div>

              {milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('No milestones added yet.')}</p>
              ) : (
                <div className="space-y-4">
                  {milestones.map((row, index) => (
                    <Card key={row.key} className="border-dashed shadow-none">
                      <CardContent className="space-y-3 pt-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {t('Milestone')} {index + 1}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setMilestones((rows) => rows.filter((item) => item.key !== row.key))
                            }
                            aria-label={t('Remove milestone')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label>{t('Title')}</Label>
                          <Input
                            value={row.title}
                            onChange={(e) => updateMilestone(row.key, { title: e.target.value })}
                            placeholder={t('Enter milestone title')}
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label>{t('Start Date')}</Label>
                            <DatePicker
                              value={row.start_date ?? ''}
                              onChange={(value) => updateMilestone(row.key, { start_date: value })}
                              placeholder={t('Select start date')}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>{t('End Date')}</Label>
                            <DatePicker
                              value={row.end_date ?? ''}
                              onChange={(value) => updateMilestone(row.key, { end_date: value })}
                              placeholder={t('Select end date')}
                            />
                          </div>
                        </div>
                        <CurrencyInput
                          label={t('Cost')}
                          value={row.cost != null ? String(row.cost) : ''}
                          onChange={(value) =>
                            updateMilestone(row.key, { cost: value ? Number(value) : null })
                          }
                        />
                        <div className="space-y-1">
                          <Label>{t('Status')}</Label>
                          <Select
                            value={row.status ?? 'Incomplete'}
                            onValueChange={(value) => updateMilestone(row.key, { status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(createMeta?.milestone_statuses ?? [
                                'Incomplete',
                                'Ongoing',
                                'Complete',
                              ]).map((milestoneStatus) => (
                                <SelectItem key={milestoneStatus} value={milestoneStatus}>
                                  {t(milestoneStatus)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`summary-${row.key}`}>{t('Summary')}</Label>
                          <Textarea
                            id={`summary-${row.key}`}
                            rows={2}
                            value={row.summary ?? ''}
                            onChange={(e) => updateMilestone(row.key, { summary: e.target.value })}
                            placeholder={t('Enter milestone summary')}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            {isDialog ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('Cancel')}
              </Button>
            ) : (
              <Button type="button" variant="outline" asChild>
                <Link to={isEdit && id ? paths.taskly.projectShow(id) : paths.taskly.projects}>
                  {t('Cancel')}
                </Link>
              </Button>
            )}
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? isEdit
                  ? t('Updating...')
                  : t('Creating...')
                : isEdit
                  ? t('Update')
                  : t('Create')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
