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
import { createTraining, getTraining, updateTraining } from '../training-api'
import { useTrainingsIndexMeta } from '../hooks/use-training-meta'

export function TrainingFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [trainingTypeId, setTrainingTypeId] = useState('')
  const [trainerId, setTrainerId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState('')

  const { meta, trainingTypeOptions, trainerOptions } = useTrainingsIndexMeta()

  const trainingQuery = useQuery({
    queryKey: ['training', 'trainings', id],
    queryFn: () => getTraining(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    const row = trainingQuery.data
    if (!row) return
    setTitle(row.title)
    setDescription(row.description ?? '')
    setTrainingTypeId(String(row.training_type_id ?? row.training_type?.id ?? ''))
    setTrainerId(String(row.trainer_id ?? row.trainer?.id ?? ''))
    setStartDate(row.start_date?.slice(0, 10) ?? '')
    setEndDate(row.end_date?.slice(0, 10) ?? '')
    setLocation(row.location ?? '')
    setStatus(row.status ?? '')
  }, [trainingQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit training') : t('Create training'),
    breadcrumbs: [
      { label: t('Training'), url: paths.training.index },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        description: description || undefined,
        training_type_id: Number(trainingTypeId),
        trainer_id: Number(trainerId),
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        location: location || undefined,
        status: status || undefined,
      }
      return isEdit ? updateTraining(Number(id), payload) : createTraining(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Training updated') : t('Training created'))
      void queryClient.invalidateQueries({ queryKey: ['training', 'trainings'] })
      navigate(paths.training.show(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save training'))),
  })

  if (isEdit && trainingQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit training') : t('Create training')}</CardTitle>
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
            <Label>{t('Title')}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>{t('Description')}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('Training type')}</Label>
              <EntitySelect
                value={trainingTypeId}
                onValueChange={setTrainingTypeId}
                options={trainingTypeOptions}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>{t('Trainer')}</Label>
              <EntitySelect value={trainerId} onValueChange={setTrainerId} options={trainerOptions} required />
            </div>
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
          <div className="space-y-1">
            <Label>{t('Location')}</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
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
              <Link to={isEdit && id ? paths.training.show(id) : paths.training.index}>{t('Cancel')}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
