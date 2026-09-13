import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
import { getImagePath } from '@/utils/helpers'
import {
  createLeaveApplication,
  fetchLeaveBalance,
  getLeaveApplication,
  updateLeaveApplication,
  type LeaveApplicationFormValues,
} from '../hrm-api'
import { useHrmMeta } from '../hooks/use-hrm-meta'

const emptyForm = (): LeaveApplicationFormValues => ({
  employee_id: '',
  leave_type_id: '',
  start_date: '',
  end_date: '',
  reason: '',
})

export function LeaveApplicationFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const recordId = Number(id)
  const { employeeOptions, leaveTypeOptions, isLoading: metaLoading } = useHrmMeta()
  const [form, setForm] = useState<LeaveApplicationFormValues>(emptyForm())
  const [balance, setBalance] = useState<string | null>(null)
  const [existingAttachment, setExistingAttachment] = useState<string | null>(null)

  const detailQuery = useQuery({
    queryKey: ['hrm', 'leave-application', recordId],
    queryFn: () => getLeaveApplication(recordId),
    enabled: isEdit && Number.isFinite(recordId),
  })

  usePageChrome({
    pageTitle: isEdit ? t('Edit leave application') : t('Submit leave application'),
    breadcrumbs: [
      { label: t('Hrm') },
      { label: t('Leave applications'), url: '/hrm/leave-applications' },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  useEffect(() => {
    if (!detailQuery.data) return
    const row = detailQuery.data
    setForm({
      employee_id: String(row.employee?.id ?? ''),
      leave_type_id: String(row.leave_type?.id ?? ''),
      start_date: row.start_date?.slice(0, 10) ?? '',
      end_date: row.end_date?.slice(0, 10) ?? '',
      reason: row.reason ?? '',
    })
    setExistingAttachment(row.attachment ?? null)
  }, [detailQuery.data])

  useEffect(() => {
    if (!form.employee_id || !form.leave_type_id) {
      setBalance(null)
      return
    }
    const load = async () => {
      try {
        const data = await fetchLeaveBalance({
          employee_id: Number(form.employee_id),
          leave_type_id: Number(form.leave_type_id),
          exclude_id: isEdit ? recordId : undefined,
        })
        setBalance(
          t('Available: {{available}} days (approved {{approved}}, pending {{pending}} of {{total}})', {
            available: data?.available_leaves ?? 0,
            approved: data?.approved_leaves ?? 0,
            pending: data?.pending_leaves ?? 0,
            total: data?.total_leaves ?? 0,
          }),
        )
      } catch {
        setBalance(null)
      }
    }
    void load()
  }, [form.employee_id, form.leave_type_id, isEdit, recordId, t])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        return updateLeaveApplication(recordId, form)
      }
      return createLeaveApplication(form)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Leave application updated') : t('Leave application submitted'))
      navigate(`/hrm/leave-applications/${row.id}`)
    },
    onError: () => toast.error(isEdit ? t('Failed to update leave application') : t('Failed to submit leave application')),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate()
  }

  if (isEdit && detailQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  if (isEdit && (detailQuery.error || !detailQuery.data)) {
    return <p className="text-sm text-destructive">{t('Record not found.')}</p>
  }

  if (isEdit && detailQuery.data?.status !== 'pending') {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <p>{t('Only pending applications can be edited.')}</p>
          <Button asChild variant="link" className="mt-2">
            <Link to={`/hrm/leave-applications/${recordId}`}>{t('View application')}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit leave application') : t('Submit leave application')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="mx-auto max-w-xl space-y-4">
          <Field>
            <Label>{t('Employee')}</Label>
            <EntitySelect
              value={form.employee_id}
              onValueChange={(v) => setForm((f) => ({ ...f, employee_id: v }))}
              options={employeeOptions}
              placeholder={t('Select employee')}
              required
              disabled={metaLoading}
            />
          </Field>
          <Field>
            <Label>{t('Leave type')}</Label>
            <EntitySelect
              value={form.leave_type_id}
              onValueChange={(v) => setForm((f) => ({ ...f, leave_type_id: v }))}
              options={leaveTypeOptions}
              placeholder={t('Select leave type')}
              required
              disabled={metaLoading}
            />
            {balance ? <p className="text-xs text-muted-foreground">{balance}</p> : null}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label>{t('Start date')}</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                required
              />
            </Field>
            <Field>
              <Label>{t('End date')}</Label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                required
              />
            </Field>
          </div>
          <Field>
            <Label>{t('Reason')}</Label>
            <Textarea
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              rows={4}
              required
            />
          </Field>
          <Field>
            <Label>{t('Attachment')}</Label>
            <Input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setForm((f) => ({ ...f, attachment: file, remove_attachment: false }))
              }}
            />
            {existingAttachment && !form.remove_attachment ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <a
                  href={getImagePath(existingAttachment)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {t('View current attachment')}
                </a>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setForm((f) => ({ ...f, remove_attachment: true, attachment: null }))
                    setExistingAttachment(null)
                  }}
                >
                  {t('Remove')}
                </Button>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">{t('Optional. Max 5 MB. JPG, PNG, PDF, or Word.')}</p>
          </Field>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {isEdit ? t('Save changes') : t('Submit application')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={isEdit ? `/hrm/leave-applications/${recordId}` : '/hrm/leave-applications'}>
                {t('Cancel')}
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function Field({ children }: { children: ReactNode }) {
  return <div className="space-y-1">{children}</div>
}
