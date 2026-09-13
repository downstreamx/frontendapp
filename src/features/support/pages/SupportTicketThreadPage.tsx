import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySelect } from '@/components/forms/entity-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import {
  fetchSupportMeta,
  getSupportTicket,
  replyToSupportTicket,
  updateSupportTicket,
} from '../support-api'

type ReplyRow = {
  id?: number
  description?: string
  message?: string
  body?: string
  sender?: string
  created_at?: string
}

export function SupportTicketThreadPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [reply, setReply] = useState('')
  const [status, setStatus] = useState('')
  const [assigneeId, setAssigneeId] = useState('')

  const metaQuery = useQuery({ queryKey: ['support-ticket', 'meta'], queryFn: fetchSupportMeta })

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['support-ticket', id],
    queryFn: () => getSupportTicket(id!),
    enabled: Boolean(id),
  })

  useEffect(() => {
    if (!ticket) return
    setStatus(String(ticket.status ?? 'Open'))
    const assignee = ticket.assignee as { id?: number } | undefined
    const uid = ticket.user_id ?? assignee?.id
    setAssigneeId(uid != null ? String(uid) : '')
  }, [ticket])

  usePageChrome({
    pageTitle: String(ticket?.subject ?? t('Support ticket')),
    breadcrumbs: [
      { label: t('Support') },
      { label: t('Tickets'), url: paths.support.tickets },
      { label: String(ticket?.ticket_id ?? id ?? '') },
    ],
  })

  const replyMutation = useMutation({
    mutationFn: (body: string) => replyToSupportTicket(id!, body),
    onSuccess: () => {
      toast.success(t('Reply sent'))
      setReply('')
      void queryClient.invalidateQueries({ queryKey: ['support-ticket', id] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to send reply'))),
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateSupportTicket(id!, {
        status,
        user_id: assigneeId ? Number(assigneeId) : null,
      }),
    onSuccess: () => {
      toast.success(t('Ticket updated'))
      void queryClient.invalidateQueries({ queryKey: ['support-ticket', id] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to update ticket'))),
  })

  const statusList = metaQuery.data?.statuses ?? ['Open', 'In Progress', 'On Hold', 'Closed']
  const userOptions =
    metaQuery.data?.users.map((u) => ({ id: u.id, label: u.name })) ?? []

  const replies =
    (ticket?.replies as ReplyRow[]) ??
    (ticket?.conversions as ReplyRow[]) ??
    []

  const categoryName =
    (ticket?.tcategory as { name?: string } | undefined)?.name ??
    (ticket?.category as { name?: string } | undefined)?.name

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>{String(ticket?.subject ?? t('Ticket'))}</CardTitle>
          {ticket ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{ticket.ticket_id}</span>
              {categoryName ? <span>· {categoryName}</span> : null}
              <FleetStatusBadge status={String(ticket.status ?? '')} />
            </div>
          ) : null}
        </div>
        <Link to={paths.support.tickets} className="text-sm text-primary hover:underline">
          {t('Back to list')}
        </Link>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading && <p className="text-sm text-muted-foreground">{t('Loading thread…')}</p>}

        <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>{t('Status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusList.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t('Assignee')}</Label>
            <EntitySelect
              value={assigneeId}
              onValueChange={setAssigneeId}
              options={userOptions}
              placeholder={t('Unassigned')}
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {t('Save workflow')}
            </Button>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-medium">{t('Original message')}</h2>
          <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
            {String(ticket?.description ?? '')}
          </div>
          {ticket?.created_at ? (
            <p className="text-xs text-muted-foreground">{formatDateTime(String(ticket.created_at))}</p>
          ) : null}
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium">{t('Thread')}</h2>
          {replies.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('No replies yet.')}</p>
          ) : (
            <ul className="space-y-2">
              {replies.map((item, i) => (
                <li key={String(item.id ?? i)} className="rounded-md border p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{item.sender ?? t('Reply')}</span>
                    {item.created_at ? <span>{formatDateTime(item.created_at)}</span> : null}
                  </div>
                  <p className="whitespace-pre-wrap">
                    {String(item.description ?? item.message ?? item.body ?? '')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form
          className="space-y-2 border-t pt-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (reply.trim()) replyMutation.mutate(reply.trim())
          }}
        >
          <div className="space-y-1">
            <Label>{t('Reply')}</Label>
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              required
              placeholder={t('Write a reply…')}
            />
          </div>
          <Button type="submit" size="sm" disabled={replyMutation.isPending}>
            {t('Send reply')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
