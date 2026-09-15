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
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { createTrainer, getTrainer, updateTrainer } from '../training-api'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function TrainerFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')
  const [experience, setExperience] = useState('')
  const [expertise, setExpertise] = useState('')

  const trainerQuery = useQuery({
    queryKey: ['training', 'trainers', id],
    queryFn: () => getTrainer(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    const row = trainerQuery.data
    if (!row) return
    setName(row.name)
    setContact(row.contact ?? '')
    setEmail(row.email ?? '')
    setExperience(row.experience ?? '')
    setExpertise(row.expertise ?? '')
  }, [trainerQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit trainer') : t('Create trainer'),
    breadcrumbs: [
      { label: t('Trainers'), url: paths.training.trainers },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        contact,
        email,
        experience,
        expertise: expertise || undefined,
      }
      return isEdit ? updateTrainer(Number(id), payload) : createTrainer(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Trainer updated') : t('Trainer created'))
      void queryClient.invalidateQueries({ queryKey: ['training', 'trainers'] })
      navigate(paths.training.trainerShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save trainer'))),
  })

  if (isEdit && trainerQuery.isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit trainer') : t('Create trainer')}</CardTitle>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('Contact')}</Label>
              <Input value={contact} onChange={(e) => setContact(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Email')}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('Experience')}</Label>
            <Input value={experience} onChange={(e) => setExperience(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>{t('Expertise')}</Label>
            <Textarea value={expertise} onChange={(e) => setExpertise(e.target.value)} rows={3} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {t('Save')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={isEdit && id ? paths.training.trainerShow(id) : paths.training.trainers}>
                {t('Cancel')}
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
