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
import { createLead, getLead, updateLead } from '../lead-api'
import { useLeadMeta } from '../hooks/use-lead-meta'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function LeadFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState('')
  const [pipelineId, setPipelineId] = useState('')
  const [stageId, setStageId] = useState('')
  const [userId, setUserId] = useState('')

  const leadQuery = useQuery({
    queryKey: ['lead', id],
    queryFn: () => getLead(id!),
    enabled: isEdit,
  })

  const { pipelineOptions, stageOptionsFor, userOptions } = useLeadMeta()

  useEffect(() => {
    const lead = leadQuery.data
    if (!lead) return
    setName(lead.name ?? '')
    setEmail(lead.email ?? '')
    setPhone(lead.phone ?? '')
    setSubject(lead.subject ?? '')
    setNotes(lead.notes ?? '')
    setDate(lead.date ?? '')
    setPipelineId(String(lead.pipeline?.id ?? ''))
    setStageId(String(lead.stage?.id ?? ''))
    setUserId(String(lead.user?.id ?? ''))
  }, [leadQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit lead') : t('Create lead'),
    breadcrumbs: [
      { label: t('CRM') },
      { label: t('Leads'), url: paths.lead.leads },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        subject: subject.trim() || undefined,
        notes: notes.trim() || undefined,
        date: date || undefined,
        pipeline_id: pipelineId ? Number(pipelineId) : undefined,
        stage_id: stageId ? Number(stageId) : undefined,
        user_id: userId ? Number(userId) : undefined,
      }
      return isEdit ? updateLead(Number(id), payload) : createLead(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Lead updated') : t('Lead created'))
      void queryClient.invalidateQueries({ queryKey: ['lead'] })
      navigate(paths.lead.leadShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save lead'))),
  })

  if (isEdit && leadQuery.isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit lead') : t('Create lead')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            saveMutation.mutate()
          }}
        >
          <div className="space-y-1">
            <Label>{t('Name')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('Email')}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('Phone')}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('Subject')}</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('Pipeline')}</Label>
              <EntitySelect
                value={pipelineId}
                onValueChange={(value) => {
                  setPipelineId(value)
                  setStageId('')
                }}
                options={pipelineOptions}
                placeholder={t('Select pipeline')}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('Stage')}</Label>
              <EntitySelect
                value={stageId}
                onValueChange={setStageId}
                options={stageOptionsFor(pipelineId)}
                placeholder={t('Select stage')}
                disabled={!pipelineId}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('Owner')}</Label>
            <EntitySelect
              value={userId}
              onValueChange={setUserId}
              options={userOptions}
              placeholder={t('Assign owner')}
            />
          </div>
          <div className="space-y-1">
            <Label>{t('Date')}</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('Notes')}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {t('Save')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={isEdit && id ? paths.lead.leadShow(id) : paths.lead.leads}>
                {t('Cancel')}
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
