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
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { CrmCallsSection } from '../components/CrmCallsSection'
import { CrmFilesSection } from '../components/CrmFilesSection'
import { CrmTasksSection } from '../components/CrmTasksSection'
import { DealSidebar, type DealSection } from '../components/DealSidebar'
import { getDeal, updateDeal, type DealDetail } from '../lead-api'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function DealShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [section, setSection] = useState<DealSection>('general')
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [phone, setPhone] = useState('')

  const dealQuery = useQuery({
    queryKey: ['lead', 'deals', id],
    queryFn: () => getDeal(Number(id)),
    enabled: Boolean(id),
  })

  const deal = dealQuery.data

  usePageChrome({
    pageTitle: deal?.name ?? t('Deal'),
    breadcrumbs: [
      { label: t('CRM') },
      { label: t('Deals'), url: paths.lead.deals },
      { label: deal?.name ?? `#${id}` },
    ],
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateDeal(Number(id), {
        name,
        price: price ? Number(price) : undefined,
        notes: notes || undefined,
        phone: phone || undefined,
      }),
    onSuccess: () => {
      toast.success(t('Deal updated'))
      void queryClient.invalidateQueries({ queryKey: ['lead', 'deals'] })
      setEditing(false)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to update deal'))),
  })

  const startEdit = (row: DealDetail) => {
    setName(row.name)
    setPrice(row.price != null ? String(row.price) : '')
    setNotes(row.notes ?? '')
    setPhone(row.phone ?? '')
    setEditing(true)
  }

  if (dealQuery.isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }
  if (dealQuery.error || !deal) {
    return <p className="text-sm text-destructive">{t('Deal not found.')}</p>
  }

  const sectionTitles: Record<DealSection, string> = {
    general: t('General'),
    tasks: t('Tasks'),
    calls: t('Calls'),
    files: t('Files'),
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{deal.name}</h1>
          <FleetStatusBadge status={deal.status ?? 'Active'} />
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.lead.dealEdit(deal.id)}>{t('Edit')}</Link>
          </Button>
          <Link to={paths.lead.deals} className="text-sm text-primary hover:underline">
            {t('Back to deals')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <DealSidebar active={section} onChange={setSection} />
        <div>
          {section !== 'general' && (
            <h3 className="mb-4 text-lg font-medium">{sectionTitles[section]}</h3>
          )}
          {section === 'general' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('Deal details')}</CardTitle>
                {!editing && (
                  <Button size="sm" variant="outline" onClick={() => startEdit(deal)}>
                    {t('Edit')}
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
                      <Label>{t('Name')}</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                      <Label>{t('Value')}</Label>
                      <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>{t('Phone')}</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>{t('Notes')}</Label>
                      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
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
                      <dt className="text-muted-foreground">{t('Value')}</dt>
                      <dd className="font-medium">
                        {deal.price != null ? formatCurrency(Number(deal.price)) : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t('Stage')}</dt>
                      <dd>{deal.stage?.name ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t('Pipeline')}</dt>
                      <dd>{deal.pipeline?.name ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t('Phone')}</dt>
                      <dd>{deal.phone ?? '—'}</dd>
                    </div>
                    {deal.notes ? (
                      <div className="sm:col-span-2">
                        <dt className="text-muted-foreground">{t('Notes')}</dt>
                        <dd className="whitespace-pre-wrap">{deal.notes}</dd>
                      </div>
                    ) : null}
                  </dl>
                )}
              </CardContent>
            </Card>
          )}
          {section === 'tasks' && (
            <CrmTasksSection kind="deal" entityId={deal.id} tasks={deal.tasks ?? []} />
          )}
          {section === 'calls' && (
            <CrmCallsSection kind="deal" entityId={deal.id} calls={deal.calls ?? []} />
          )}
          {section === 'files' && (
            <CrmFilesSection kind="deal" entityId={deal.id} files={deal.files ?? []} />
          )}
        </div>
      </div>
    </div>
  )
}
