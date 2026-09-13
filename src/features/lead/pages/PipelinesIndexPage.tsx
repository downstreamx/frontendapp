import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { GitBranch, Layers, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import {
  createPipeline,
  deletePipeline,
  listPipelines,
  updatePipeline,
  type PipelineRecord,
} from '../lead-api'
import { PipelineStagesDialog } from '../components/PipelineStagesDialog'

export function PipelinesIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PipelineRecord | null>(null)
  const [name, setName] = useState('')
  const [stagesPipeline, setStagesPipeline] = useState<PipelineRecord | null>(null)
  const [stagesOpen, setStagesOpen] = useState(false)

  usePageChrome({
    pageTitle: t('Pipelines'),
    breadcrumbs: [{ label: t('CRM') }, { label: t('Pipelines') }],
  })

  const { data, isLoading } = useQuery({
    queryKey: ['lead', 'pipelines'],
    queryFn: listPipelines,
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      editing ? updatePipeline(editing.id, { name }) : createPipeline({ name }),
    onSuccess: () => {
      toast.success(editing ? t('Pipeline updated') : t('Pipeline created'))
      setDialogOpen(false)
      setEditing(null)
      setName('')
      void queryClient.invalidateQueries({ queryKey: ['lead', 'pipelines'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save pipeline'))),
  })

  const deleteMutation = useMutation({
    mutationFn: deletePipeline,
    onSuccess: () => {
      toast.success(t('Pipeline deleted'))
      void queryClient.invalidateQueries({ queryKey: ['lead', 'pipelines'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete pipeline'))),
  })

  const openCreate = () => {
    setEditing(null)
    setName('')
    setDialogOpen(true)
  }

  const openEdit = (row: PipelineRecord) => {
    setEditing(row)
    setName(row.name)
    setDialogOpen(true)
  }

  const pipelines = data ?? []

  const columns: Column<PipelineRecord>[] = [
    {
      key: 'name',
      header: t('Pipeline'),
      render: (value) => <span className="font-medium">{String(value)}</span>,
    },
    {
      key: 'stages',
      header: t('Stages'),
      render: (_, row) => {
        const leadStages = row.lead_stages ?? row.leadStages ?? []
        const dealStages = row.deal_stages ?? row.dealStages ?? []
        return (
          <span className="text-xs text-muted-foreground">
            {t('{{leadCount}} lead · {{dealCount}} deal', {
              leadCount: leadStages.length,
              dealCount: dealStages.length,
            })}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: t('Action'),
      render: (_, row) => (
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            title={t('Manage stages')}
            onClick={() => {
              setStagesPipeline(row)
              setStagesOpen(true)
            }}
          >
            <Layers className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              if (window.confirm(t('Delete this pipeline?'))) {
                deleteMutation.mutate(row.id)
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Pipelines')}
        description={t('Manage sales pipelines and their lead/deal stages.')}
        canCreate
        onCreateClick={openCreate}
        isLoading={isLoading}
      >
        {pipelines.length === 0 && !isLoading ? (
          <NoRecordsFound
            icon={GitBranch}
            title={t('No pipelines yet')}
            description={t('Add a pipeline to organize leads and deals.')}
            onCreateClick={openCreate}
            className="h-auto py-8"
          />
        ) : (
          <DataTable embedded data={pipelines} columns={columns} />
        )}
      </ModuleListCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('Edit pipeline') : t('New pipeline')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!name.trim()) return
              saveMutation.mutate()
            }}
          >
            <div className="space-y-1">
              <Label>{t('Name')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saveMutation.isPending}>
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <PipelineStagesDialog
        pipeline={stagesPipeline}
        open={stagesOpen}
        onOpenChange={(open) => {
          setStagesOpen(open)
          if (!open) setStagesPipeline(null)
        }}
      />
    </>
  )
}
