import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getApiErrorMessage } from '@/lib/errors'
import {
  createDealStage,
  createLeadStage,
  deleteDealStage,
  deleteLeadStage,
  updateDealStage,
  updateLeadStage,
  type PipelineRecord,
} from '../lead-api'

type Props = {
  pipeline: PipelineRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PipelineStagesDialog({ pipeline, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [leadName, setLeadName] = useState('')
  const [dealName, setDealName] = useState('')
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null)
  const [editingDealId, setEditingDealId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  const leadStages = pipeline?.lead_stages ?? pipeline?.leadStages ?? []
  const dealStages = pipeline?.deal_stages ?? pipeline?.dealStages ?? []

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['lead', 'pipelines'] })

  const addLeadMutation = useMutation({
    mutationFn: () => createLeadStage(pipeline!.id, { name: leadName.trim() }),
    onSuccess: () => {
      toast.success(t('Lead stage created'))
      setLeadName('')
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to add stage'))),
  })

  const addDealMutation = useMutation({
    mutationFn: () => createDealStage(pipeline!.id, { name: dealName.trim() }),
    onSuccess: () => {
      toast.success(t('Deal stage created'))
      setDealName('')
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to add stage'))),
  })

  const saveEditMutation = useMutation({
    mutationFn: () => {
      if (editingLeadId) return updateLeadStage(editingLeadId, { name: editName.trim() })
      if (editingDealId) return updateDealStage(editingDealId, { name: editName.trim() })
      return Promise.reject(new Error('missing stage'))
    },
    onSuccess: () => {
      toast.success(t('Stage updated'))
      setEditingLeadId(null)
      setEditingDealId(null)
      setEditName('')
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to update stage'))),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ kind, id }: { kind: 'lead' | 'deal'; id: number }) =>
      kind === 'lead' ? deleteLeadStage(id) : deleteDealStage(id),
    onSuccess: () => {
      toast.success(t('Stage deleted'))
      invalidate()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete stage'))),
  })

  if (!pipeline) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Stages for {{name}}', { name: pipeline.name })}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 sm:grid-cols-2">
          <StageColumn
            title={t('Lead stages')}
            stages={leadStages}
            newName={leadName}
            onNewNameChange={setLeadName}
            onAdd={() => leadName.trim() && addLeadMutation.mutate()}
            adding={addLeadMutation.isPending}
            editingId={editingLeadId}
            editName={editName}
            onEditNameChange={setEditName}
            onStartEdit={(id, name) => {
              setEditingLeadId(id)
              setEditingDealId(null)
              setEditName(name)
            }}
            onSaveEdit={() => editName.trim() && saveEditMutation.mutate()}
            onCancelEdit={() => {
              setEditingLeadId(null)
              setEditName('')
            }}
            onDelete={(id) => {
              if (window.confirm(t('Delete this stage?'))) {
                deleteMutation.mutate({ kind: 'lead', id })
              }
            }}
            saving={saveEditMutation.isPending}
          />
          <StageColumn
            title={t('Deal stages')}
            stages={dealStages}
            newName={dealName}
            onNewNameChange={setDealName}
            onAdd={() => dealName.trim() && addDealMutation.mutate()}
            adding={addDealMutation.isPending}
            editingId={editingDealId}
            editName={editName}
            onEditNameChange={setEditName}
            onStartEdit={(id, name) => {
              setEditingDealId(id)
              setEditingLeadId(null)
              setEditName(name)
            }}
            onSaveEdit={() => editName.trim() && saveEditMutation.mutate()}
            onCancelEdit={() => {
              setEditingDealId(null)
              setEditName('')
            }}
            onDelete={(id) => {
              if (window.confirm(t('Delete this stage?'))) {
                deleteMutation.mutate({ kind: 'deal', id })
              }
            }}
            saving={saveEditMutation.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StageColumn({
  title,
  stages,
  newName,
  onNewNameChange,
  onAdd,
  adding,
  editingId,
  editName,
  onEditNameChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  saving,
}: {
  title: string
  stages: Array<{ id: number; name: string }>
  newName: string
  onNewNameChange: (v: string) => void
  onAdd: () => void
  adding: boolean
  editingId: number | null
  editName: string
  onEditNameChange: (v: string) => void
  onStartEdit: (id: number, name: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: (id: number) => void
  saving: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="space-y-1 rounded-md border p-2 text-sm">
        {stages.map((stage) =>
          editingId === stage.id ? (
            <li key={stage.id} className="flex gap-1">
              <Input value={editName} onChange={(e) => onEditNameChange(e.target.value)} className="h-8" />
              <Button type="button" size="sm" onClick={onSaveEdit} disabled={saving}>
                {t('Save')}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onCancelEdit}>
                {t('Cancel')}
              </Button>
            </li>
          ) : (
            <li key={stage.id} className="flex items-center justify-between gap-1 py-1">
              <span>{stage.name}</span>
              <div className="flex shrink-0">
                <Button type="button" size="icon" variant="ghost" onClick={() => onStartEdit(stage.id, stage.name)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => onDelete(stage.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>
      <div className="space-y-1">
        <Label className="text-xs">{t('Add stage')}</Label>
        <div className="flex gap-1">
          <Input value={newName} onChange={(e) => onNewNameChange(e.target.value)} className="h-8" />
          <Button type="button" size="icon" onClick={onAdd} disabled={adding || !newName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
