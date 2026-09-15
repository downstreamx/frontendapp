import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import {
  candidateFullName,
  createCandidate,
  fetchCandidatesIndexMeta,
  getCandidate,
  updateCandidate,
} from '../recruitment-candidates-api'

export function CandidateFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [jobId, setJobId] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [status, setStatus] = useState('0')
  const [applicationDate, setApplicationDate] = useState('')

  const { data: indexMeta } = useQuery({
    queryKey: ['recruitment', 'candidates', 'index-meta'],
    queryFn: fetchCandidatesIndexMeta,
  })

  const candidateQuery = useQuery({
    queryKey: ['recruitment', 'candidates', id],
    queryFn: () => getCandidate(Number(id)),
    enabled: isEdit,
  })

  usePageChrome({
    pageTitle: isEdit ? t('Edit candidate') : t('Create candidate'),
    breadcrumbs: [
      { label: t('Recruitment') },
      { label: t('Candidates'), url: paths.recruitment.candidates },
      { label: isEdit ? candidateFullName(candidateQuery.data ?? { first_name: '', last_name: '' }) : t('Create') },
    ],
  })

  useEffect(() => {
    const c = candidateQuery.data
    if (!c) return
    setFirstName(c.first_name)
    setLastName(c.last_name)
    setEmail(c.email ?? '')
    setPhone(c.phone ?? '')
    setJobId(c.job_posting?.id != null ? String(c.job_posting.id) : '')
    setSourceId(c.candidate_source?.id != null ? String(c.candidate_source.id) : '')
    setStatus(c.status ?? '0')
    setApplicationDate(c.application_date?.slice(0, 10) ?? '')
  }, [candidateQuery.data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email: email || undefined,
        phone: phone || undefined,
        job_id: jobId ? Number(jobId) : undefined,
        source_id: sourceId ? Number(sourceId) : undefined,
        status,
        application_date: applicationDate || undefined,
      }
      if (isEdit) {
        return updateCandidate(Number(id), payload)
      }
      return createCandidate(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Candidate updated') : t('Candidate created'))
      void queryClient.invalidateQueries({ queryKey: ['recruitment', 'candidates'] })
      navigate(paths.recruitment.candidateShow(row.id))
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, isEdit ? t('Failed to update candidate') : t('Failed to create candidate'))),
  })

  if (isEdit && candidateQuery.isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  const jobOptions = indexMeta?.job_postings.map((j) => ({ id: j.id, label: j.title })) ?? []
  const sourceOptions = indexMeta?.sources.map((s) => ({ id: s.id, label: s.name })) ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isEdit ? t('Edit candidate') : t('Create candidate')}</h1>
        <Link to={paths.recruitment.candidates} className="text-sm text-primary hover:underline">
          {t('Back to list')}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Candidate details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              saveMutation.mutate()
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('First name')}</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>{t('Last name')}</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('Email')}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('Phone')}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <EntitySelect
              label={t('Job posting')}
              value={jobId}
              onChange={setJobId}
              options={jobOptions}
              placeholder={t('Select job')}
            />
            <EntitySelect
              label={t('Source')}
              value={sourceId}
              onChange={setSourceId}
              options={sourceOptions}
              placeholder={t('Select source')}
            />
            <div className="space-y-1">
              <Label>{t('Status')}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(indexMeta?.statuses ?? []).map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('Application date')}</Label>
              <Input type="date" value={applicationDate} onChange={(e) => setApplicationDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <Link to={paths.recruitment.candidates}>{t('Cancel')}</Link>
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? t('Saving…') : t('Save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
