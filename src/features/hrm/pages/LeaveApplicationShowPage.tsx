import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { formatShortDate } from '@/features/shared/lib/entity-labels'
import { getImagePath } from '@/utils/helpers'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import {
  deleteLeaveApplication,
  fetchLeaveBalance,
  getLeaveApplication,
  updateLeaveApplicationStatus,
} from '../hrm-api'

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'approved') return 'default'
  if (status === 'rejected') return 'destructive'
  return 'secondary'
}

export function LeaveApplicationShowPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const recordId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [statusOpen, setStatusOpen] = useState(false)
  const [statusValue, setStatusValue] = useState<'approved' | 'rejected' | 'pending'>('approved')
  const [approverComment, setApproverComment] = useState('')
  const [balanceText, setBalanceText] = useState<string | null>(null)

  const canEdit = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'edit-leave-applications')
  const canDelete = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'delete-leave-applications')
  const canManageStatus = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-leave-status')

  const { data, isLoading, error } = useQuery({
    queryKey: ['hrm', 'leave-application', recordId],
    queryFn: () => getLeaveApplication(recordId),
    enabled: Number.isFinite(recordId),
  })

  usePageChrome({
    pageTitle: data?.employee?.name ? `${data.employee.name} — ${t('Leave')}` : t('Leave application'),
    breadcrumbs: [
      { label: t('Hrm') },
      { label: t('Leave applications'), url: '/hrm/leave-applications' },
      { label: data?.leave_type?.name ?? t('Application') },
    ],
  })

  useEffect(() => {
    if (!data?.employee?.id || !data.leave_type?.id) return
    void fetchLeaveBalance({
      employee_id: data.employee.id,
      leave_type_id: data.leave_type.id,
      exclude_id: data.id,
    })
      .then((balance) => {
        setBalanceText(
          t('Balance: {{available}} of {{total}} days available', {
            available: balance.available_leaves,
            total: balance.total_leaves,
          }),
        )
      })
      .catch(() => setBalanceText(null))
  }, [data, t])

  const statusMutation = useMutation({
    mutationFn: () =>
      updateLeaveApplicationStatus(recordId, {
        status: statusValue,
        approver_comment: approverComment || undefined,
      }),
    onSuccess: () => {
      toast.success(t('Leave status updated'))
      void queryClient.invalidateQueries({ queryKey: ['hrm', 'leave-application', recordId] })
      void queryClient.invalidateQueries({ queryKey: ['hrm', 'leave-applications'] })
      setStatusOpen(false)
    },
    onError: () => toast.error(t('Failed to update status')),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteLeaveApplication(recordId),
    onSuccess: () => {
      toast.success(t('Leave application deleted'))
      navigate('/hrm/leave-applications')
    },
    onError: () => toast.error(t('Failed to delete')),
  })

  if (isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  if (error || !data) {
    return <p className="text-sm text-destructive">{t('Record not found.')}</p>
  }

  const calendarLink = `/calendar?module=Hrm&type=leave`

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>{data.employee?.name ?? t('Leave application')}</CardTitle>
            <p className="text-sm text-muted-foreground">{data.leave_type?.name}</p>
            <Badge variant={statusVariant(data.status)} className="mt-2 w-fit capitalize">
              {data.status}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManageStatus && data.status === 'pending' ? (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    setStatusValue('approved')
                    setApproverComment('')
                    setStatusOpen(true)
                  }}
                >
                  {t('Approve')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStatusValue('rejected')
                    setApproverComment('')
                    setStatusOpen(true)
                  }}
                >
                  {t('Reject')}
                </Button>
              </>
            ) : null}
            {canEdit && data.status === 'pending' ? (
              <Button size="sm" variant="outline" asChild>
                <Link to={`/hrm/leave-applications/${recordId}/edit`}>
                  <Pencil className="mr-1 h-4 w-4" />
                  {t('Edit')}
                </Link>
              </Button>
            ) : null}
            <Button size="sm" variant="outline" asChild>
              <Link to={calendarLink}>
                <CalendarDays className="mr-1 h-4 w-4" />
                {t('View on calendar')}
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/hrm/leave-applications">{t('Back to list')}</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Detail label={t('Employee')} value={data.employee?.name ?? '—'} />
          <Detail label={t('Email')} value={data.employee?.email ?? '—'} />
          <Detail label={t('Leave type')} value={data.leave_type?.name ?? '—'} />
          <Detail label={t('Total days')} value={String(data.total_days ?? '—')} />
          <Detail
            label={t('Period')}
            value={
              data.start_date && data.end_date
                ? `${formatShortDate(data.start_date)} — ${formatShortDate(data.end_date)}`
                : '—'
            }
          />
          {balanceText ? <Detail label={t('Leave balance')} value={balanceText} /> : null}
          <Detail label={t('Reason')} value={data.reason ?? '—'} className="sm:col-span-2" />
          {data.approver_comment ? (
            <Detail label={t('Approver comment')} value={data.approver_comment} className="sm:col-span-2" />
          ) : null}
          {data.approved_by?.name ? (
            <Detail label={t('Approved by')} value={data.approved_by.name} />
          ) : null}
          {data.attachment ? (
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">{t('Attachment')}</p>
              <a
                href={getImagePath(data.attachment)}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                {t('Download attachment')}
              </a>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {canDelete ? (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (window.confirm(t('Delete this leave application?'))) {
                deleteMutation.mutate()
              }
            }}
          >
            {t('Delete application')}
          </Button>
        </div>
      ) : null}

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Update leave status')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t('Status')}</Label>
              <Select value={statusValue} onValueChange={(v) => setStatusValue(v as typeof statusValue)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">{t('Approved')}</SelectItem>
                  <SelectItem value="rejected">{t('Rejected')}</SelectItem>
                  <SelectItem value="pending">{t('Pending')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('Comment')}</Label>
              <Input value={approverComment} onChange={(e) => setApproverComment(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => statusMutation.mutate()} disabled={statusMutation.isPending}>
              {t('Update status')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Detail({
  label,
  value,
  className = '',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
