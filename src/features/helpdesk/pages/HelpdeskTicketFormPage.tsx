import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/forms/entity-select'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { createHelpdeskTicket, fetchHelpdeskMeta } from '../helpdesk-api'

export function HelpdeskTicketFormPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState('medium')
  const [companyId, setCompanyId] = useState('')

  const metaQuery = useQuery({ queryKey: ['helpdesk', 'meta'], queryFn: fetchHelpdeskMeta })

  const platformContext =
    auth.user?.type === 'superadmin' || Boolean(metaQuery.data?.platform_context)

  const categoryOptions = (metaQuery.data?.categories ?? []).map((c) => ({
    value: String(c.id),
    label: c.name,
  }))
  const priorityOptions = (metaQuery.data?.priorities ?? ['low', 'medium', 'high', 'urgent']).map((p) => ({
    value: p,
    label: p,
  }))
  const companyOptions = (metaQuery.data?.companies ?? []).map((c) => ({
    value: String(c.id),
    label: c.name,
  }))

  usePageChrome({
    pageTitle: t('Create helpdesk ticket'),
    breadcrumbs: [
      { label: t('Helpdesk') },
      { label: t('Tickets'), url: paths.helpdesk },
      { label: t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      createHelpdeskTicket({
        title,
        description,
        category_id: categoryId ? Number(categoryId) : undefined,
        priority,
        company_id: companyId ? Number(companyId) : undefined,
      }),
    onSuccess: (row) => {
      toast.success(t('Ticket created'))
      navigate(paths.helpdeskTicketShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to create ticket'))),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (platformContext && !companyId) {
      toast.error(t('Please select a company.'))
      return
    }
    saveMutation.mutate()
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{t('Create helpdesk ticket')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          {platformContext ? (
            <div className="space-y-1">
              <Label>{t('Company')}</Label>
              <EntitySelect
                value={companyId}
                onValueChange={setCompanyId}
                options={companyOptions}
                disabled={metaQuery.isLoading}
                placeholder={t('Select company')}
              />
            </div>
          ) : null}
          <div className="space-y-1">
            <Label>{t('Title')}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>{t('Description')}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} />
          </div>
          <div className="space-y-1">
            <Label>{t('Category')}</Label>
            <EntitySelect
              value={categoryId}
              onValueChange={setCategoryId}
              options={categoryOptions}
              disabled={metaQuery.isLoading}
              placeholder={t('Select category')}
            />
          </div>
          <div className="space-y-1">
            <Label>{t('Priority')}</Label>
            <EntitySelect
              value={priority}
              onValueChange={setPriority}
              options={priorityOptions}
              disabled={metaQuery.isLoading}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending || metaQuery.isLoading}>
              {t('Save')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={paths.helpdesk}>{t('Cancel')}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
