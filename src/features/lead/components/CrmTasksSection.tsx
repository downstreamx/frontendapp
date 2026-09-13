import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { getApiErrorMessage } from '@/lib/errors'
import { formatDate } from '@/utils/helpers'
import {
  createDealTask,
  createLeadTask,
  deleteDealTask,
  deleteLeadTask,
  updateDealTask,
  updateLeadTask,
  type CrmTaskPayload,
  type CrmTaskRow,
} from '../lead-api'

type Props = {
  kind: 'lead' | 'deal'
  entityId: number
  tasks: CrmTaskRow[]
}

const PRIORITIES = ['Low', 'Medium', 'High'] as const
const STATUSES = ['On Going', 'Complete'] as const

const emptyForm = (): CrmTaskPayload => ({
  name: '',
  date: new Date().toISOString().slice(0, 10),
  time: '09:00',
  priority: 'Medium',
  status: 'On Going',
})

export function CrmTasksSection({ kind, entityId, tasks }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const queryKey = ['lead', kind === 'lead' ? 'leads' : 'deals', String(entityId)]
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CrmTaskRow | null>(null)
  const [form, setForm] = useState<CrmTaskPayload>(emptyForm)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? kind === 'lead'
          ? updateLeadTask(entityId, editing.id, form)
          : updateDealTask(entityId, editing.id, form)
        : kind === 'lead'
          ? createLeadTask(entityId, form)
          : createDealTask(entityId, form),
    onSuccess: () => {
      toast.success(t(editing ? 'Task updated' : 'Task created'))
      setOpen(false)
      setEditing(null)
      setForm(emptyForm())
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save task'))),
  })

  const deleteMutation = useMutation({
    mutationFn: (taskId: number) =>
      kind === 'lead' ? deleteLeadTask(entityId, taskId) : deleteDealTask(entityId, taskId),
    onSuccess: () => {
      toast.success(t('Task deleted'))
      setDeleteId(null)
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete task'))),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setOpen(true)
  }

  const openEdit = (row: CrmTaskRow) => {
    setEditing(row)
    setForm({
      name: row.name,
      date: row.date ? String(row.date).slice(0, 10) : emptyForm().date,
      time: row.time ? String(row.time).slice(0, 5) : '09:00',
      priority: row.priority ?? 'Medium',
      status: row.status === 'Complete' || row.status === 'Completed' ? 'Complete' : 'On Going',
    })
    setOpen(true)
  }

  const columns: Column<CrmTaskRow>[] = [
    { key: 'name', header: t('Name'), render: (_, row) => row.name },
    {
      key: 'date',
      header: t('Date'),
      render: (_, row) => (row.date ? formatDate(row.date) : '—'),
    },
    { key: 'time', header: t('Time'), render: (_, row) => row.time ?? '—' },
    { key: 'priority', header: t('Priority'), render: (_, row) => row.priority ?? '—' },
    { key: 'status', header: t('Status'), render: (_, row) => row.status ?? '—' },
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
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          {t('Add task')}
        </Button>
      </div>
      <DataTable embedded columns={columns} data={tasks} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('Edit task') : t('New task')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!form.name.trim()) return
              saveMutation.mutate()
            }}
          >
            <div className="space-y-1">
              <Label>{t('Name')}</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Date')}</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Time')}</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Priority')}</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {t(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Status')}</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
        title={t('Delete task')}
        description={t('Are you sure you want to delete this task?')}
        confirmLabel={t('Delete')}
        variant="destructive"
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
