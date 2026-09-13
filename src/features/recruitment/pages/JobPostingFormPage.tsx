import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { createJobPosting, getJobPosting, updateJobPosting } from '../recruitment-api'

export function JobPostingFormPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const isEdit = Boolean(id) && location.pathname.endsWith('/edit')
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')

  usePageChrome({
    pageTitle: isEdit ? t('Edit job posting') : t('New job posting'),
    breadcrumbs: [
      { label: t('Recruitment') },
      { label: t('Job postings'), url: paths.recruitment.jobPostings },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const postingQuery = useQuery({
    queryKey: ['recruitment', 'job-postings', id],
    queryFn: () => getJobPosting(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    const posting = postingQuery.data
    if (!posting) return
    setTitle(posting.title)
    setDescription(posting.description ?? '')
    setDeadline(posting.application_deadline?.slice(0, 10) ?? '')
  }, [postingQuery.data])

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        description: description || undefined,
        application_deadline: deadline || undefined,
      }
      return isEdit ? updateJobPosting(Number(id), payload) : createJobPosting(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Job posting updated') : t('Job posting created'))
      void queryClient.invalidateQueries({ queryKey: ['recruitment', 'job-postings'] })
      navigate(paths.recruitment.jobPostingShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save job posting'))),
  })

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{isEdit ? t('Edit job posting') : t('New job posting')}</CardTitle>
        <Link to={paths.recruitment.jobPostings} className="text-sm text-primary hover:underline">
          {t('Back to list')}
        </Link>
      </CardHeader>
      <CardContent>
        {isEdit && postingQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
        ) : (
          <form
            className="space-y-3"
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
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
            </div>
            <div className="space-y-1">
              <Label>{t('Application deadline')}</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saveMutation.isPending}>
                {t('Save')}
              </Button>
              {isEdit && id ? (
                <Button type="button" variant="outline" asChild>
                  <Link to={paths.recruitment.jobPostingShow(id)}>{t('Cancel')}</Link>
                </Button>
              ) : null}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
