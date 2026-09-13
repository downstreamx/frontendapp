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
import { createEmployeeReview, getEmployeeReview, updateEmployeeReview } from '../performance-api'
import { useEmployeeReviewsIndexMeta } from '../hooks/use-performance-meta'

export function EmployeeReviewFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [userId, setUserId] = useState('')
  const [reviewerId, setReviewerId] = useState('')
  const [reviewCycleId, setReviewCycleId] = useState('')
  const [reviewDate, setReviewDate] = useState('')
  const [completionDate, setCompletionDate] = useState('')
  const [status, setStatus] = useState('')
  const [pros, setPros] = useState('')
  const [cons, setCons] = useState('')

  const { meta, employeeOptions, reviewCycleOptions } = useEmployeeReviewsIndexMeta()

  const reviewQuery = useQuery({
    queryKey: ['performance', 'employee-reviews', id],
    queryFn: () => getEmployeeReview(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    const row = reviewQuery.data
    if (!row) return
    setUserId(String(row.user_id ?? row.user?.id ?? ''))
    setReviewerId(String(row.reviewer_id ?? row.reviewer?.id ?? ''))
    setReviewCycleId(String(row.review_cycle_id ?? row.review_cycle?.id ?? ''))
    setReviewDate(row.review_date?.slice(0, 10) ?? '')
    setCompletionDate(row.completion_date?.slice(0, 10) ?? '')
    setStatus(row.status ?? '')
    setPros(row.pros ?? '')
    setCons(row.cons ?? '')
  }, [reviewQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit employee review') : t('Create employee review'),
    breadcrumbs: [
      { label: t('Performance') },
      { label: t('Employee reviews'), url: paths.performance.employeeReviews },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        user_id: Number(userId),
        reviewer_id: Number(reviewerId),
        review_cycle_id: Number(reviewCycleId),
        review_date: reviewDate || undefined,
        completion_date: completionDate || null,
        status: status || undefined,
        pros: pros || undefined,
        cons: cons || undefined,
      }
      return isEdit ? updateEmployeeReview(Number(id), payload) : createEmployeeReview(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Employee review updated') : t('Employee review created'))
      void queryClient.invalidateQueries({ queryKey: ['performance', 'employee-reviews'] })
      navigate(paths.performance.employeeReviewShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save employee review'))),
  })

  if (isEdit && reviewQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit employee review') : t('Create employee review')}</CardTitle>
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
              <EntitySelect value={userId} onValueChange={setUserId} options={employeeOptions} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Reviewer')}</Label>
              <EntitySelect value={reviewerId} onValueChange={setReviewerId} options={employeeOptions} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('Review cycle')}</Label>
            <EntitySelect
              value={reviewCycleId}
              onValueChange={setReviewCycleId}
              options={reviewCycleOptions}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('Review date')}</Label>
              <Input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Completion date')}</Label>
              <Input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
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
          <div className="space-y-1">
            <Label>{t('Pros')}</Label>
            <Textarea value={pros} onChange={(e) => setPros(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1">
            <Label>{t('Cons')}</Label>
            <Textarea value={cons} onChange={(e) => setCons(e.target.value)} rows={3} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {t('Save')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link
                to={
                  isEdit && id ? paths.performance.employeeReviewShow(id) : paths.performance.employeeReviews
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
