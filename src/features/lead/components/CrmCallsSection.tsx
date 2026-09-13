import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { getApiErrorMessage } from '@/lib/errors'
import { personName } from '@/features/shared/lib/entity-labels'
import {
  createDealCall,
  createLeadCall,
  deleteDealCall,
  deleteLeadCall,
  fetchLeadMeta,
  updateDealCall,
  updateLeadCall,
  type CrmCallPayload,
  type CrmCallRow,
} from '../lead-api'

type Props = {
  kind: 'lead' | 'deal'
  entityId: number
  calls: CrmCallRow[]
}

const CALL_TYPES = ['Outbound', 'Inbound'] as const

const emptyForm = (userId: number): CrmCallPayload => ({
  subject: '',
  call_type: 'Outbound',
  duration: '',
  user_id: userId,
  description: '',
  call_result: '',
})

export function CrmCallsSection({ kind, entityId, calls }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const queryKey = ['lead', kind === 'lead' ? 'leads' : 'deals', String(entityId)]
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CrmCallRow | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: meta } = useQuery({
    queryKey: ['lead', 'create-meta'],
    queryFn: fetchLeadMeta,
  })

  const defaultUserId = meta?.users?.[0]?.id ?? 0
  const [form, setForm] = useState<CrmCallPayload>(emptyForm(defaultUserId))

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? kind === 'lead'
          ? updateLeadCall(entityId, editing.id, form)
          : updateDealCall(entityId, editing.id, form)
        : kind === 'lead'
          ? createLeadCall(entityId, form)
          : createDealCall(entityId, form),
    onSuccess: () => {
      toast.success(t(editing ? 'Call updated' : 'Call created'))
      setOpen(false)
      setEditing(null)
      setForm(emptyForm(defaultUserId))
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save call'))),
  })

  const deleteMutation = useMutation({
    mutationFn: (callId: number) =>
      kind === 'lead' ? deleteLeadCall(entityId, callId) : deleteDealCall(entityId, callId),
    onSuccess: () => {
      toast.success(t('Call deleted'))
      setDeleteId(null)
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete call'))),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm(defaultUserId))
    setOpen(true)
  }

  const openEdit = (row: CrmCallRow) => {
    setEditing(row)
    setForm({
      subject: row.subject,
      call_type: row.call_type ?? 'Outbound',
      duration: row.duration ?? '',
      user_id: row.user_id ?? row.user?.id ?? defaultUserId,
      description: row.description ?? '',
      call_result: row.call_result ?? '',
    })
    setOpen(true)
  }

  const columns: Column<CrmCallRow>[] = [
    { key: 'subject', header: t('Subject'), render: (_, row) => row.subject },
    { key: 'call_type', header: t('Type'), render: (_, row) => row.call_type ?? '—' },
    { key: 'duration', header: t('Duration'), render: (_, row) => row.duration ?? '—' },
    {
      key: 'user',
      header: t('Assignee'),
      render: (_, row) => personName(row.user, undefined),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(row.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate} disabled={!defaultUserId}>
          <Plus className="mr-1 h-4 w-4" />
          {t('Add call')}
        </Button>
      </div>
      <DataTable embedded columns={columns} data={calls} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t('Edit call') : t('New call')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!form.subject.trim() || !form.user_id) return
              saveMutation.mutate()
            }}
          >
            <div className="space-y-1">
              <Label>{t('Subject')}</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Call type')}</Label>
                <Select value={form.call_type} onValueChange={(v) => setForm((f) => ({ ...f, call_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CALL_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Duration')}</Label>
                <Input
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('Assignee')}</Label>
              <Select
                value={String(form.user_id)}
                onValueChange={(v) => setForm((f) => ({ ...f, user_id: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(meta?.users ?? []).map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('Description')}</Label>
              <Textarea
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('Call result')}</Label>
              <Input
                value={form.call_result ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, call_result: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saveMutation.isPending}>
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteId != null}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title={t('Delete call')}
        description={t('Are you sure you want to delete this call?')}
        confirmLabel={t('Delete')}
        variant="destructive"
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
