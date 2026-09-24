import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import {
  getPublicInvitation,
  submitPublicInvitation,
} from '@/features/vendor-management/vendor-management-api'

type LineItem = {
  id: number
  item_type?: string | null
  description: string
  quantity: number | string
  unit?: string | null
  specifications?: string | null
}

export function VendorTenderPortalPage() {
  const { t } = useTranslation()
  const { token } = useParams()
  const navigate = useNavigate()
  const [prices, setPrices] = useState<Record<number, string>>({})
  const [executionDays, setExecutionDays] = useState('')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [complianceTax, setComplianceTax] = useState('')
  const [complianceConfirm, setComplianceConfirm] = useState(false)

  const invitation = useQuery({
    queryKey: ['vm-public-invite', token],
    queryFn: () => getPublicInvitation(token!),
    enabled: Boolean(token),
    retry: false,
  })

  const lineItems = useMemo(
    () => (invitation.data?.line_items as LineItem[] | undefined) ?? [],
    [invitation.data],
  )

  const submit = useMutation({
    mutationFn: async () => {
      const form = new FormData()
      if (executionDays) form.append('execution_days', executionDays)
      if (notes) form.append('notes', notes)
      form.append('compliance_answers[tax_compliant]', complianceTax || 'unspecified')
      form.append('compliance_answers[terms_accepted]', complianceConfirm ? 'yes' : 'no')
      lineItems.forEach((item, index) => {
        form.append(`items[${index}][tender_line_item_id]`, String(item.id))
        form.append(`items[${index}][unit_price]`, prices[item.id] || '0')
        form.append(`items[${index}][quantity]`, String(item.quantity ?? 1))
      })
      if (files) {
        Array.from(files).forEach((file) => form.append('files[]', file))
      }
      return submitPublicInvitation(token!, form)
    },
    onSuccess: (res) => {
      toast.success(t('Submission received'))
      navigate(
        `${paths.vendorTenderSuccess}?ref=${encodeURIComponent(String(res.tracking_ref ?? ''))}`,
      )
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  if (invitation.isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">{t('Loading invitation...')}</p>
  }

  if (invitation.isError || !invitation.data) {
    return (
      <div className="mx-auto max-w-lg space-y-3 p-6">
        <h1 className="text-xl font-semibold">{t('Invitation unavailable')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('This link may have expired, been revoked, or the tender is closed.')}
        </p>
      </div>
    )
  }

  const tender = invitation.data.tender as {
    name?: string
    code?: string
    description?: string
    submission_deadline?: string
  }
  const vendor = invitation.data.vendor as { name?: string; contact_name?: string }
  const docs = (invitation.data.documents as Array<{ id: number; title?: string; url?: string }>) ?? []
  const alreadySubmitted = Boolean(invitation.data.already_submitted)
  const canSubmit = invitation.data.can_submit !== false && !alreadySubmitted
  const deadlinePassed = Boolean(invitation.data.deadline_passed)

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">{t('Vendor tender submission')}</p>
        <h1 className="text-2xl font-semibold">
          {tender.name} ({tender.code})
        </h1>
        <p className="mt-1 text-sm">
          {t('For')}: {vendor.name}
          {vendor.contact_name ? ` (${vendor.contact_name})` : ''}
        </p>
        {tender.submission_deadline ? (
          <p className="text-sm text-muted-foreground">
            {t('Deadline')}: {new Date(tender.submission_deadline).toLocaleString()}
          </p>
        ) : null}
      </div>

      {tender.description ? <p className="whitespace-pre-wrap text-sm">{tender.description}</p> : null}

      {docs.length > 0 ? (
        <div className="space-y-2">
          <h2 className="font-medium">{t('Documents')}</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {docs.map((doc) => (
              <li key={doc.id}>
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noreferrer" className="text-primary underline">
                    {doc.title || t('Document')}
                  </a>
                ) : (
                  doc.title
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {alreadySubmitted ? (
        <p className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm">
          {t('A submission has already been recorded for this invitation. Thank you.')}
        </p>
      ) : null}

      {deadlinePassed && !alreadySubmitted ? (
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm">
          {t('The submission deadline has passed. New proposals are no longer accepted.')}
        </p>
      ) : null}

      {canSubmit ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!complianceConfirm) {
              toast.error(t('Please confirm you accept the tender terms.'))
              return
            }
            submit.mutate()
          }}
        >
          <div className="space-y-3">
            <h2 className="font-medium">{t('Pricing')}</h2>
            {lineItems.map((item) => (
              <div key={item.id} className="grid gap-2 rounded border p-3 sm:grid-cols-[1fr_140px]">
                <div>
                  <div className="text-sm font-medium">
                    <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-xs capitalize">
                      {item.item_type === 'service' ? t('Service') : t('Product')}
                    </span>
                    {item.description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.quantity} {item.unit}
                    {item.specifications ? ` — ${item.specifications}` : ''}
                  </div>
                </div>
                <div>
                  <Label htmlFor={`price-${item.id}`}>{t('Unit price')}</Label>
                  <Input
                    id={`price-${item.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={prices[item.id] ?? ''}
                    onChange={(e) => setPrices((p) => ({ ...p, [item.id]: e.target.value }))}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded border p-3">
            <h2 className="font-medium">{t('Compliance')}</h2>
            <div>
              <Label htmlFor="compliance_tax">{t('Tax / regulatory compliance notes')}</Label>
              <Input
                id="compliance_tax"
                value={complianceTax}
                onChange={(e) => setComplianceTax(e.target.value)}
                placeholder={t('e.g. Valid TIN, up-to-date permits')}
              />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={complianceConfirm}
                onChange={(e) => setComplianceConfirm(e.target.checked)}
              />
              <span>{t('I confirm the pricing and timeline are binding for this tender submission.')}</span>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="execution_days">{t('Execution days')}</Label>
              <Input
                id="execution_days"
                type="number"
                min="1"
                value={executionDays}
                onChange={(e) => setExecutionDays(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="files">{t('Proposal files')}</Label>
              <Input
                id="files"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={(e) => setFiles(e.target.files)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">{t('Notes')}</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </div>

          <Button type="submit" disabled={submit.isPending || lineItems.length === 0}>
            {submit.isPending ? t('Submitting...') : t('Submit proposal')}
          </Button>
        </form>
      ) : null}
    </div>
  )
}

export function VendorTenderSuccessPage() {
  const { t } = useTranslation()
  const params = new URLSearchParams(window.location.search)
  const trackingRef = params.get('ref')

  return (
    <div className="mx-auto max-w-lg space-y-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{t('Thank you')}</h1>
      <p className="text-sm text-muted-foreground">
        {t('Your proposal was submitted successfully. A confirmation email will be sent shortly.')}
      </p>
      {trackingRef ? (
        <p className="rounded border bg-muted/40 px-3 py-2 text-sm">
          {t('Tracking reference')}: <strong>{trackingRef}</strong>
        </p>
      ) : null}
      <Button variant="outline" asChild>
        <Link to={paths.home}>{t('Close')}</Link>
      </Button>
    </div>
  )
}
