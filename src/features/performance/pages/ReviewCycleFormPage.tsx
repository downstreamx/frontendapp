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
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { createReviewCycle, getReviewCycle, updateReviewCycle } from '../performance-api'
import { useReviewCyclesIndexMeta } from '../hooks/use-performance-meta'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function ReviewCycleFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('')

  const { meta } = useReviewCyclesIndexMeta()

  const reviewCycleQuery = useQuery({
    queryKey: ['performance', 'review-cycles', id],
    queryFn: () => getReviewCycle(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    const row = reviewCycleQuery.data
    if (!row) return
    setName(row.name)
    setFrequency(row.frequency ?? '')
    setDescription(row.description ?? '')
    setStatus(row.status ?? '')
  }, [reviewCycleQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit review cycle') : t('Create review cycle'),
    breadcrumbs: [
      { label: t('Performance') },
      { label: t('Review cycles'), url: paths.performance.reviewCycles },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        frequency: frequency || undefined,
        description: description || undefined,
        status: status || undefined,
      }
      return isEdit ? updateReviewCycle(Number(id), payload) : createReviewCycle(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Review cycle updated') : t('Review cycle created'))
      void queryClient.invalidateQueries({ queryKey: ['performance', 'review-cycles'] })
      navigate(paths.performance.reviewCycleShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save review cycle'))),
  })

  if (isEdit && reviewCycleQuery.isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit review cycle') : t('Create review cycle')}</CardTitle>
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
            <Label>{t('Name')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>{t('Frequency')}</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select frequency')} />
              </SelectTrigger>
              <SelectContent>
                {(meta?.frequencies ?? []).map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t('Description')}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
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
                  isEdit && id ? paths.performance.reviewCycleShow(id) : paths.performance.reviewCycles
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
