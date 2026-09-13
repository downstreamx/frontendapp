import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { DataTable, type Column } from '@/components/ui/data-table'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { formatShortDate } from '@/features/shared/lib/entity-labels'
import {
  deleteLeaveApplication,
  listLeaveApplications,
  updateLeaveApplicationStatus,
  type LeaveApplicationRow,
} from '../hrm-api'

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'approved') return 'default'
  if (status === 'rejected') return 'destructive'
  return 'secondary'
}

export function LeaveApplicationsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [statusRow, setStatusRow] = useState<LeaveApplicationRow | null>(null)
  const [statusValue, setStatusValue] = useState<'approved' | 'rejected' | 'pending'>('approved')
  const [approverComment, setApproverComment] = useState('')

  usePageChrome({
    pageTitle: t('Leave applications'),
    breadcrumbs: [{ label: t('Hrm') }, { label: t('Leave applications') }],
  })

  const canCreate = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-leave-applications')
  const canEdit = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'edit-leave-applications')
  const canDelete = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'delete-leave-applications')
  const canManageStatus = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-leave-status')

  const listQuery = useQuery({ queryKey: ['hrm', 'leave-applications'], queryFn: () => listLeaveApplications() })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['hrm', 'leave-applications'] })

  const statusMutation = useMutation({
    mutationFn: ({ id, status, approver_comment }: { id: number; status: 'approved' | 'rejected' | 'pending'; approver_comment?: string }) =>
      updateLeaveApplicationStatus(id, { status, approver_comment }),
    onSuccess: () => {
      toast.success(t('Leave status updated'))
      invalidate()
      setStatusRow(null)
    },
    onError: () => toast.error(t('Failed to update status')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLeaveApplication,
    onSuccess: () => {
      toast.success(t('Leave application deleted'))
      invalidate()
    },
    onError: () => toast.error(t('Failed to delete leave application')),
  })

  const columns: Column<LeaveApplicationRow>[] = [
    {
      key: 'employee',
      header: t('Employee'),
      render: (_, row) => (
        <Link to={`/hrm/leave-applications/${row.id}`} className="font-medium text-primary hover:underline">
          {row.employee?.name ?? '—'}
        </Link>
      ),
    },
    { key: 'leave_type', header: t('Leave type'), render: (_, row) => row.leave_type?.name ?? '—' },
    {
      key: 'dates',
      header: t('Dates'),
      render: (_, row) =>
        row.start_date && row.end_date
          ? `${formatShortDate(row.start_date)} → ${formatShortDate(row.end_date)}`
          : '—',
    },
    { key: 'total_days', header: t('Days'), render: (_, row) => row.total_days ?? '—' },
    {
      key: 'status',
      header: t('Status'),
      render: (_, row) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {canManageStatus && row.status === 'pending' && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusRow(row)
                  setStatusValue('approved')
                  setApproverComment('')
                }}
              >
                {t('Approve')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusRow(row)
                  setStatusValue('rejected')
                  setApproverComment('')
                }}
              >
                {t('Reject')}
              </Button>
            </>
          )}
          <TableRowActions
            editPermission="edit-leave-applications"
            deletePermission="delete-leave-applications"
            onEdit={
              canEdit && row.status === 'pending'
                ? () => navigate(`/hrm/leave-applications/${row.id}/edit`)
                : undefined
            }
            onDelete={canDelete ? () => deleteMutation.mutate(row.id) : undefined}
          />
        </div>
      ),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Leave applications')}
        description={t('Submit and review employee leave requests. Approved and pending leave appear on the company calendar.')}
        actions={
          <div className="flex items-center gap-2">
            {canCreate ? (
              <Button size="sm" className="gap-1.5" onClick={() => navigate('/hrm/leave-applications/create')}>
                <Plus className="h-4 w-4" />
                {t('New application')}
              </Button>
            ) : null}
            <Button variant="outline" size="sm" asChild>
              <Link to="/calendar?module=Hrm&type=leave">
                <CalendarDays className="mr-1 h-4 w-4" />
                {t('Calendar')}
              </Link>
            </Button>
          </div>
        }
        isLoading={listQuery.isLoading}
        error={!!listQuery.error}
      >
        <DataTable
          data={listQuery.data ?? []}
          columns={columns}
          className="rounded-none border-0 shadow-none"
          emptyState={
            <NoRecordsFound
              icon={CalendarDays}
              title={t('No leave applications found')}
              description={t('Get started by submitting a leave application.')}
              createPermission="create-leave-applications"
              onCreateClick={() => navigate('/hrm/leave-applications/create')}
              createButtonText={t('New application')}
              className="h-auto py-8"
            />
          }
        />
      </ModuleListCard>

      <Dialog open={!!statusRow} onOpenChange={(next) => !next && setStatusRow(null)}>
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
            <Button
              onClick={() =>
                statusRow &&
                statusMutation.mutate({
                  id: statusRow.id,
                  status: statusValue,
                  approver_comment: approverComment || undefined,
                })
              }
              disabled={statusMutation.isPending}
            >
              {t('Update status')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
