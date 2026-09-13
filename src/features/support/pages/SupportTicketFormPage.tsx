import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { createSupportTicket } from '../support-api'
import { useSupportMeta } from '../hooks/use-support-meta'
import {
  emptySupportTicketForm,
  SupportTicketFormFields,
  type SupportTicketFormState,
} from '../components/SupportTicketFormFields'

/** @deprecated Use create modal on SupportTicketsIndexPage; route redirects to the list. */
export function SupportTicketFormPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [form, setForm] = useState<SupportTicketFormState>(emptySupportTicketForm)

  const { categoryOptions, isLoading: metaLoading } = useSupportMeta()

  usePageChrome({
    pageTitle: t('Create ticket'),
    breadcrumbs: [
      { label: t('Support') },
      { label: t('Tickets'), url: paths.support.tickets },
      { label: t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      createSupportTicket({
        subject: form.subject,
        description: form.description,
        category: form.categoryId ? Number(form.categoryId) : undefined,
      }),
    onSuccess: (row) => {
      toast.success(t('Ticket created'))
      navigate(paths.support.ticketShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to create ticket'))),
  })

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{t('Create ticket')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
        >
          <SupportTicketFormFields
            form={form}
            onChange={setForm}
            categoryOptions={categoryOptions}
            metaLoading={metaLoading}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending || metaLoading}>
              {t('Save')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={paths.support.tickets}>{t('Cancel')}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
