import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
import { EntitySelect } from '@/components/forms/entity-select'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import {
  candidateFullName,
  fetchCandidatesIndexMeta,
  getCandidate,
  updateCandidate,
  updateCandidateStatus,
} from '../recruitment-candidates-api'

export function CandidateShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [jobId, setJobId] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [status, setStatus] = useState('')

  const candidateQuery = useQuery({
    queryKey: ['recruitment', 'candidates', id],
    queryFn: () => getCandidate(Number(id)),
    enabled: Boolean(id),
  })

  const { data: indexMeta } = useQuery({
    queryKey: ['recruitment', 'candidates', 'index-meta'],
    queryFn: fetchCandidatesIndexMeta,
  })

  const candidate = candidateQuery.data
  const statuses = indexMeta?.statuses ?? []

  usePageChrome({
    pageTitle: candidate ? candidateFullName(candidate) : t('Candidate'),
    breadcrumbs: [
      { label: t('Recruitment') },
      { label: t('Candidates'), url: paths.recruitment.candidates },
      { label: candidate ? candidateFullName(candidate) : `#${id}` },
    ],
  })

  useEffect(() => {
    if (!candidate) return
    setFirstName(candidate.first_name)
    setLastName(candidate.last_name)
    setEmail(candidate.email ?? '')
    setPhone(candidate.phone ?? '')
    setJobId(candidate.job_posting?.id != null ? String(candidate.job_posting.id) : '')
    setSourceId(candidate.candidate_source?.id != null ? String(candidate.candidate_source.id) : '')
    setStatus(candidate.status ?? '0')
  }, [candidate])

  const updateMutation = useMutation({
    mutationFn: () =>
      updateCandidate(Number(id), {
        first_name: firstName,
        last_name: lastName,
        email: email || undefined,
        phone: phone || undefined,
        job_id: jobId ? Number(jobId) : undefined,
        source_id: sourceId ? Number(sourceId) : undefined,
        status,
      }),
    onSuccess: () => {
      toast.success(t('Candidate updated'))
      void queryClient.invalidateQueries({ queryKey: ['recruitment', 'candidates'] })
      setEditing(false)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to update candidate'))),
  })

  const statusMutation = useMutation({
    mutationFn: (next: string) => updateCandidateStatus(Number(id), next),
    onSuccess: () => {
      toast.success(t('Status updated'))
      void queryClient.invalidateQueries({ queryKey: ['recruitment', 'candidates', id] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to update status'))),
  })

  if (candidateQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }
  if (candidateQuery.error || !candidate) {
    return <p className="text-sm text-destructive">{t('Candidate not found.')}</p>
  }

  const jobOptions = indexMeta?.job_postings.map((j) => ({ id: j.id, label: j.title })) ?? []
  const sourceOptions = indexMeta?.sources.map((s) => ({ id: s.id, label: s.name })) ?? []
  const statusLabel = statuses.find((s) => s.value === candidate.status)?.label

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{candidateFullName(candidate)}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {candidate.tracking_id ? <span>{candidate.tracking_id}</span> : null}
            <FleetStatusBadge status={statusLabel ?? candidate.status ?? ''} />
          </div>
        </div>
        <Link to={paths.recruitment.candidates} className="text-sm text-primary hover:underline">
          {t('Back to list')}
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('Application')}</CardTitle>
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              {t('Edit')}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                updateMutation.mutate()
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>{t('First name')}</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>{t('Last name')}</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>{t('Email')}</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>{t('Phone')}</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <EntitySelect value={jobId} onValueChange={setJobId} options={jobOptions} placeholder={t('Job')} />
              <EntitySelect
                value={sourceId}
                onValueChange={setSourceId}
                options={sourceOptions}
                placeholder={t('Source')}
              />
              <div className="space-y-1">
                <Label>{t('Status')}</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {t('Save')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  {t('Cancel')}
                </Button>
              </div>
            </form>
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">{t('Email')}</dt>
                <dd>{candidate.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('Phone')}</dt>
                <dd>{candidate.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('Job posting')}</dt>
                <dd>
                  {candidate.job_posting ? (
                    <Link
                      to={paths.recruitment.jobPostingShow(candidate.job_posting.id)}
                      className="text-primary hover:underline"
                    >
                      {candidate.job_posting.title}
                    </Link>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('Source')}</dt>
                <dd>{candidate.candidate_source?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('Applied')}</dt>
                <dd>{candidate.application_date ? formatDate(candidate.application_date) : '—'}</dd>
              </div>
              {candidate.skills ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">{t('Skills')}</dt>
                  <dd>{candidate.skills}</dd>
                </div>
              ) : null}
            </dl>
          )}

          {!editing ? (
            <div className="space-y-1 border-t pt-4">
              <Label>{t('Quick status')}</Label>
              <Select
                value={candidate.status ?? '0'}
                onValueChange={(value) => statusMutation.mutate(value)}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
