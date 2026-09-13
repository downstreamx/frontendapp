import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'
import { getJobPosting, updateJobPosting } from '../recruitment-api'

export function JobPostingShowPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')

  const postingQuery = useQuery({
    queryKey: ['recruitment', 'job-postings', id],
    queryFn: () => getJobPosting(Number(id)),
    enabled: Boolean(id),
  })

  const posting = postingQuery.data

  usePageChrome({
    pageTitle: posting?.title ?? t('Job posting'),
    breadcrumbs: [
      { label: t('Recruitment') },
      { label: t('Job postings'), url: paths.recruitment.jobPostings },
      { label: posting?.title ?? `#${id}` },
    ],
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateJobPosting(Number(id), {
        title,
        description: description || undefined,
        application_deadline: deadline || undefined,
      }),
    onSuccess: () => {
      toast.success('Job posting updated')
      queryClient.invalidateQueries({ queryKey: ['recruitment', 'job-postings'] })
      setEditing(false)
    },
    onError: () => toast.error('Failed to update job posting'),
  })

  if (postingQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  if (postingQuery.error || !posting) {
    return <p className="text-sm text-destructive">Job posting not found.</p>
  }

  const startEdit = () => {
    setTitle(posting.title)
    setDescription(posting.description ?? '')
    setDeadline(posting.application_deadline?.slice(0, 10) ?? '')
    setEditing(true)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{posting.title}</h1>
        <div className="flex gap-3 text-sm">
          {id ? (
            <Link to={paths.recruitment.jobPostingEdit(id)} className="text-primary hover:underline">
              {t('Full edit page')}
            </Link>
          ) : null}
          <Link to={paths.recruitment.jobPostings} className="text-primary hover:underline">
            {t('Back to list')}
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Posting details</CardTitle>
          {!editing && (
            <Button size="sm" variant="outline" onClick={startEdit}>
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                updateMutation.mutate()
              }}
            >
              <div className="space-y-1">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
              </div>
              <div className="space-y-1">
                <Label>Application deadline</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  Save
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="capitalize">{posting.status ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Deadline</dt>
                <dd>{posting.application_deadline ?? '—'}</dd>
              </div>
              {posting.description && (
                <div>
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="whitespace-pre-wrap">{posting.description}</dd>
                </div>
              )}
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
