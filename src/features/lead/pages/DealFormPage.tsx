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
import { EntitySelect } from '@/components/forms/entity-select'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { createDeal, getDeal, updateDeal } from '../lead-api'
import { useLeadMeta } from '../hooks/use-lead-meta'

export function DealFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [pipelineId, setPipelineId] = useState('')
  const [stageId, setStageId] = useState('')

  const dealQuery = useQuery({
    queryKey: ['lead', 'deals', id],
    queryFn: () => getDeal(Number(id)),
    enabled: isEdit,
  })

  const { pipelineOptions, dealStageOptionsFor } = useLeadMeta()

  useEffect(() => {
    const deal = dealQuery.data
    if (!deal) return
    setName(deal.name ?? '')
    setPrice(deal.price != null ? String(deal.price) : '')
    setPhone(deal.phone ?? '')
    setNotes(deal.notes ?? '')
    setPipelineId(String(deal.pipeline?.id ?? ''))
    setStageId(String(deal.stage?.id ?? ''))
  }, [dealQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit deal') : t('Create deal'),
    breadcrumbs: [
      { label: t('CRM') },
      { label: t('Deals'), url: paths.lead.deals },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        price: price ? Number(price) : undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        pipeline_id: pipelineId ? Number(pipelineId) : undefined,
        stage_id: stageId ? Number(stageId) : undefined,
      }
      return isEdit ? updateDeal(Number(id), payload) : createDeal(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Deal updated') : t('Deal created'))
      void queryClient.invalidateQueries({ queryKey: ['lead', 'deals'] })
      navigate(paths.lead.dealShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save deal'))),
  })

  if (isEdit && dealQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit deal') : t('Create deal')}</CardTitle>
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
              <Label>{t('Price')}</Label>
              <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('Phone')}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
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
                options={dealStageOptionsFor(pipelineId)}
                placeholder={t('Select stage')}
                disabled={!pipelineId}
              />
            </div>
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
              <Link to={isEdit && id ? paths.lead.dealShow(id) : paths.lead.deals}>
                {t('Cancel')}
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
