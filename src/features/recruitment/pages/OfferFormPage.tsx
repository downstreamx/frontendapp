import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
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
import { MediaPicker } from '@/features/media/components/MediaPicker'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { candidateFullName } from '../recruitment-candidates-api'
import {
  createOffer,
  fetchCandidateJobs,
  fetchOffersIndexMeta,
  getOffer,
  updateOffer,
} from '../recruitment-offers-api'

export function OfferFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [candidateId, setCandidateId] = useState('')
  const [jobId, setJobId] = useState('')
  const [offerDate, setOfferDate] = useState(new Date().toISOString().slice(0, 10))
  const [position, setPosition] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [salary, setSalary] = useState('')
  const [bonus, setBonus] = useState('')
  const [equity, setEquity] = useState('')
  const [benefits, setBenefits] = useState('')
  const [startDate, setStartDate] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [offerLetterPath, setOfferLetterPath] = useState('')
  const [status, setStatus] = useState('Draft')

  const { data: meta } = useQuery({
    queryKey: ['recruitment', 'offers', 'index-meta'],
    queryFn: fetchOffersIndexMeta,
  })

  const { data: candidateJobs = [] } = useQuery({
    queryKey: ['recruitment', 'candidates', candidateId, 'jobs'],
    queryFn: () => fetchCandidateJobs(Number(candidateId)),
    enabled: Boolean(candidateId),
  })

  const offerQuery = useQuery({
    queryKey: ['recruitment', 'offers', id],
    queryFn: () => getOffer(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    const row = offerQuery.data
    if (!row) return
    setCandidateId(String(row.candidate_id ?? row.candidate?.id ?? ''))
    setJobId(String(row.job_id ?? row.job?.id ?? ''))
    setOfferDate(row.offer_date?.slice(0, 10) ?? offerDate)
    setPosition(row.position ?? '')
    setDepartmentId(row.department_id != null ? String(row.department_id) : '')
    setSalary(row.salary != null ? String(row.salary) : '')
    setBonus(row.bonus != null ? String(row.bonus) : '')
    setEquity(row.equity ?? '')
    setBenefits(row.benefits ?? '')
    setStartDate(row.start_date?.slice(0, 10) ?? '')
    setExpirationDate(row.expiration_date?.slice(0, 10) ?? '')
    setOfferLetterPath(row.offer_letter_path ?? '')
    setStatus(row.status ?? 'Draft')
  }, [offerQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit offer') : t('Create offer'),
    breadcrumbs: [
      { label: t('Recruitment') },
      { label: t('Offers'), url: paths.recruitment.offers },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        candidate_id: Number(candidateId),
        job_id: jobId ? Number(jobId) : undefined,
        offer_date: offerDate,
        position,
        department_id: departmentId ? Number(departmentId) : undefined,
        salary: Number(salary),
        bonus: bonus ? Number(bonus) : undefined,
        equity: equity || undefined,
        benefits: benefits || undefined,
        start_date: startDate,
        expiration_date: expirationDate,
        offer_letter_path: offerLetterPath || undefined,
        status,
      }
      return isEdit ? updateOffer(Number(id), payload) : createOffer(payload)
    },
    onSuccess: (row) => {
      toast.success(t(isEdit ? 'Offer updated' : 'Offer created'))
      navigate(paths.recruitment.offerShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save offer'))),
  })

  const jobOptions =
    candidateJobs.length > 0
      ? candidateJobs
      : (meta?.job_postings ?? []).map((j) => ({ id: j.id, title: j.title }))

  if (isEdit && offerQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit offer') : t('Create offer')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!candidateId || !position || !salary || !startDate || !expirationDate) return
            saveMutation.mutate()
          }}
        >
          <div className="space-y-1">
            <Label>{t('Candidate')}</Label>
            <Select value={candidateId} onValueChange={(v) => { setCandidateId(v); setJobId('') }}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select candidate')} />
              </SelectTrigger>
              <SelectContent>
                {(meta?.candidates ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {candidateFullName(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t('Job posting')}</Label>
            <Select value={jobId || 'none'} onValueChange={(v) => setJobId(v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select job')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('None')}</SelectItem>
                {jobOptions.map((j) => (
                  <SelectItem key={j.id} value={String(j.id)}>
                    {j.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t('Position')}</Label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>{t('Department')}</Label>
            <Select value={departmentId || 'none'} onValueChange={(v) => setDepartmentId(v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select department')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('None')}</SelectItem>
                {(meta?.departments ?? []).map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.department_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('Offer date')}</Label>
              <Input type="date" value={offerDate} onChange={(e) => setOfferDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Status')}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(meta?.statuses ?? []).map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('Salary')}</Label>
              <Input type="number" step="0.01" value={salary} onChange={(e) => setSalary(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Bonus')}</Label>
              <Input type="number" step="0.01" value={bonus} onChange={(e) => setBonus(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('Equity')}</Label>
            <Input value={equity} onChange={(e) => setEquity(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('Benefits')}</Label>
            <Textarea value={benefits} onChange={(e) => setBenefits(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('Start date')}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Expiration date')}</Label>
              <Input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('Offer letter')}</Label>
            <MediaPicker
              value={offerLetterPath}
              onChange={(v) => setOfferLetterPath(Array.isArray(v) ? v[0] ?? '' : v)}
              placeholder={t('Attach offer letter')}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {t('Save')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={paths.recruitment.offers}>{t('Cancel')}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
