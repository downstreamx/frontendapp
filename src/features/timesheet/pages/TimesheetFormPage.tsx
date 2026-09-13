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
import { createTimesheet, getTimesheet, updateTimesheet } from '../timesheet-api'
import { useTimesheetsIndexMeta } from '../hooks/use-timesheet-meta'

export function TimesheetFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [userId, setUserId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [date, setDate] = useState('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [notes, setNotes] = useState('')
  const [type, setType] = useState('')

  const { meta, userOptions } = useTimesheetsIndexMeta()

  const timesheetQuery = useQuery({
    queryKey: ['timesheet', 'timesheets', id],
    queryFn: () => getTimesheet(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    const row = timesheetQuery.data
    if (!row) return
    setUserId(String(row.user_id ?? row.user?.id ?? ''))
    setProjectId(row.project_id != null ? String(row.project_id) : '')
    setDate(row.date?.slice(0, 10) ?? '')
    setHours(row.hours != null ? String(row.hours) : '')
    setMinutes(row.minutes != null ? String(row.minutes) : '')
    setNotes(row.notes ?? '')
    setType(row.type ?? '')
  }, [timesheetQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit timesheet') : t('Create timesheet'),
    breadcrumbs: [
      { label: t('Timesheets'), url: paths.timesheet.index },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        user_id: Number(userId),
        project_id: projectId ? Number(projectId) : null,
        date: date || undefined,
        hours: hours ? Number(hours) : undefined,
        minutes: minutes ? Number(minutes) : undefined,
        notes: notes || undefined,
        type: type || undefined,
      }
      return isEdit ? updateTimesheet(Number(id), payload) : createTimesheet(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Timesheet updated') : t('Timesheet created'))
      void queryClient.invalidateQueries({ queryKey: ['timesheet', 'timesheets'] })
      navigate(paths.timesheet.show(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save timesheet'))),
  })

  if (isEdit && timesheetQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit timesheet') : t('Create timesheet')}</CardTitle>
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
              <Label>{t('User')}</Label>
              <EntitySelect value={userId} onValueChange={setUserId} options={userOptions} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Project')}</Label>
              <Input
                type="number"
                min={1}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder={t('Optional')}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>{t('Date')}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Hours')}</Label>
              <Input type="number" min={0} value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('Minutes')}</Label>
              <Input type="number" min={0} max={59} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('Type')}</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select type')} />
              </SelectTrigger>
              <SelectContent>
                {(meta?.types ?? []).map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {entry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t('Notes')}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {t('Save')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={isEdit && id ? paths.timesheet.show(id) : paths.timesheet.index}>{t('Cancel')}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
