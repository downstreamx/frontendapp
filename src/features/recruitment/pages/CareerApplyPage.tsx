import { FormEvent, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getApiErrorMessage } from '@/lib/errors'
import { fetchPublicJob, submitPublicApplication } from '../careers-public-api'

export function CareerApplyPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const slug = searchParams.get('slug') ?? ''
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [experienceYears, setExperienceYears] = useState('0')

  const { data } = useQuery({
    queryKey: ['careers', slug, 'job', id],
    queryFn: () => fetchPublicJob(slug, Number(id)),
    enabled: Boolean(slug && id),
  })

  const applyMutation = useMutation({
    mutationFn: () =>
      submitPublicApplication(slug, Number(id), {
        name,
        email,
        phone: phone || undefined,
        experience_years: Number(experienceYears) || 0,
      }),
    onSuccess: (result) => {
      toast.success(t('Application submitted'))
      navigate(
        `/careers/success?slug=${encodeURIComponent(slug)}&tracking_id=${encodeURIComponent(result.tracking_id)}`,
      )
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to submit application'))),
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    applyMutation.mutate()
  }

  if (!slug) {
    return <p className="p-4 text-sm text-muted-foreground">{t('Missing company slug.')}</p>
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 p-4">
      <Link
        to={`/careers/jobs/${id}?slug=${encodeURIComponent(slug)}`}
        className="text-sm text-primary hover:underline"
      >
        {t('Back to job')}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{t('Apply for {{title}}', { title: data?.job.title ?? t('position') })}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="space-y-1">
              <Label>{t('Full name')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Email')}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Phone')}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('Years of experience')}</Label>
              <Input
                type="number"
                min={0}
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={applyMutation.isPending}>
              {applyMutation.isPending ? t('Submitting…') : t('Submit application')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
