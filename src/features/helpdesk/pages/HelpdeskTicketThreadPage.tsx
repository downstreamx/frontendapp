import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { EntitySelect } from '@/components/forms/entity-select'
import { MediaPicker } from '@/features/media/components/MediaPicker'
import { useAppContext } from '@/contexts/app-context'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { HelpdeskReplyAttachments } from '../components/HelpdeskReplyAttachments'
import {
  deleteHelpdeskTicket,
  fetchHelpdeskMeta,
  getHelpdeskTicket,
  replyToHelpdeskTicket,
  updateHelpdeskTicket,
} from '../helpdesk-api'

export function HelpdeskTicketThreadPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [reply, setReply] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [isInternal, setIsInternal] = useState(false)
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isSuperAdmin = auth.user?.type === 'superadmin'

  const metaQuery = useQuery({ queryKey: ['helpdesk', 'meta'], queryFn: fetchHelpdeskMeta })

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['helpdesk', 'ticket', id],
    queryFn: () => getHelpdeskTicket(id!),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: String(ticket?.title ?? t('Helpdesk ticket')),
    breadcrumbs: [
      { label: t('Helpdesk') },
      { label: t('Tickets'), url: paths.helpdesk },
      { label: String(ticket?.title ?? t('Ticket')) },
    ],
  })

  useEffect(() => {
    if (!ticket) return
    setStatus(String(ticket.status ?? 'open'))
    setPriority(String(ticket.priority ?? 'medium'))
  }, [ticket])

  const replyMutation = useMutation({
    mutationFn: () =>
      replyToHelpdeskTicket(id!, {
        message: reply.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
        is_internal: isSuperAdmin ? isInternal : undefined,
      }),
    onSuccess: () => {
      toast.success(t('Reply sent'))
      setReply('')
      setAttachments([])
      setIsInternal(false)
      void queryClient.invalidateQueries({ queryKey: ['helpdesk', 'ticket', id] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to send reply'))),
  })

  const updateMutation = useMutation({
    mutationFn: () => updateHelpdeskTicket(id!, { status, priority }),
    onSuccess: () => {
      toast.success(t('Ticket updated'))
      void queryClient.invalidateQueries({ queryKey: ['helpdesk', 'ticket', id] })
      void queryClient.invalidateQueries({ queryKey: ['helpdesk', 'tickets'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to update ticket'))),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteHelpdeskTicket(id!),
    onSuccess: () => {
      toast.success(t('Ticket deleted'))
      void queryClient.invalidateQueries({ queryKey: ['helpdesk', 'tickets'] })
      navigate(paths.helpdesk)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete ticket'))),
  })

  const statusOptions = (metaQuery.data?.statuses ?? ['open', 'in_progress', 'resolved', 'closed']).map((s) => ({
    value: s,
    label: s,
  }))
  const priorityOptions = (metaQuery.data?.priorities ?? ['low', 'medium', 'high', 'urgent']).map((p) => ({
    value: p,
    label: p,
  }))

  const replies = (ticket?.replies as Array<Record<string, unknown>>) ?? []
  const creator = ticket?.creator as { name?: string } | undefined

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>{String(ticket?.title ?? t('Helpdesk ticket'))}</CardTitle>
            {ticket?.ticket_id ? (
              <p className="text-sm text-muted-foreground mt-1">
                {t('Ticket #')}: {String(ticket.ticket_id)}
              </p>
            ) : null}
            {creator?.name ? (
              <p className="text-sm text-muted-foreground">
                {t('Company')}: {creator.name}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={paths.helpdesk}>{t('Back to list')}</Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              disabled={deleteMutation.isPending}
            >
              {t('Delete')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p className="text-sm text-muted-foreground">{t('Loading…')}</p>}

          <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('Status')}</Label>
              <EntitySelect value={status} onValueChange={setStatus} options={statusOptions} />
            </div>
            <div className="space-y-1">
              <Label>{t('Priority')}</Label>
              <EntitySelect value={priority} onValueChange={setPriority} options={priorityOptions} />
            </div>
            <div className="sm:col-span-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
              >
                {t('Save changes')}
              </Button>
            </div>
          </div>

          <div className="rounded-md border p-3 text-sm whitespace-pre-wrap">
            {String(ticket?.description ?? '')}
          </div>
          <ul className="space-y-2">
            {replies.map((item, i) => (
              <li
                key={String(item.id ?? i)}
                className={`rounded-md border p-3 text-sm ${
                  item.is_internal ? 'border-orange-300 bg-orange-50/80' : ''
                }`}
              >
                <p className="mb-1 text-xs text-muted-foreground">
                  {(item.creator as { name?: string })?.name ?? t('Staff')}
                  {item.is_internal ? (
                    <span className="ml-2 rounded-full bg-orange-200 px-2 py-0.5 text-orange-900">
                      {t('Internal Note')}
                    </span>
                  ) : null}
                </p>
                <div className="whitespace-pre-wrap">{String(item.message ?? '')}</div>
                <HelpdeskReplyAttachments attachments={item.attachments} />
              </li>
            ))}
          </ul>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (reply.trim()) replyMutation.mutate()
            }}
          >
            <div className="space-y-1">
              <Label>{t('Reply')}</Label>
              <Textarea value={reply} onChange={(e) => setReply(e.target.value)} required rows={3} />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <MediaPicker
                label=""
                value={attachments}
                onChange={(value) =>
                  setAttachments(Array.isArray(value) ? value : value ? [value] : [])
                }
                multiple
                placeholder={t('Attach')}
                showPreview={false}
                disabled={replyMutation.isPending}
              />
              {isSuperAdmin ? (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="helpdesk-reply-internal"
                    checked={isInternal}
                    onCheckedChange={(checked) => setIsInternal(Boolean(checked))}
                    disabled={replyMutation.isPending}
                  />
                  <Label htmlFor="helpdesk-reply-internal" className="cursor-pointer font-normal">
                    {t('Internal')}
                  </Label>
                </div>
              ) : null}
              <Button type="submit" size="sm" disabled={replyMutation.isPending || !reply.trim()}>
                {t('Send reply')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('Delete ticket')}
        message={t('Are you sure you want to delete this ticket? This cannot be undone.')}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </>
  )
}
