import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  createMilestone,
  deleteMilestone,
  type ProjectMilestone,
  updateMilestone,
} from '../api'
import { ProjectMilestoneFormDialog, type MilestoneFormValues } from './ProjectMilestoneFormDialog'

type Props = {
  projectId: number
  milestones: ProjectMilestone[]
}

function toPayload(values: MilestoneFormValues) {
  return {
    title: values.title,
    cost: values.cost ? Number(values.cost) : undefined,
    start_date: values.start_date || undefined,
    end_date: values.end_date || undefined,
    summary: values.summary || undefined,
    status: values.status,
    progress: values.progress ? Number(values.progress) : undefined,
  }
}

export function ProjectMilestoneList({ projectId, milestones }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['project', String(projectId)] })

  const createMutation = useMutation({
    mutationFn: (values: MilestoneFormValues) => createMilestone(projectId, toPayload(values)),
    onSuccess: () => {
      toast.success(t('Milestone created'))
      invalidate()
    },
    onError: () => toast.error(t('Failed to create milestone')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: MilestoneFormValues }) =>
      updateMilestone(projectId, id, toPayload(values)),
    onSuccess: () => {
      toast.success(t('Milestone updated'))
      invalidate()
    },
    onError: () => toast.error(t('Failed to update milestone')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMilestone(projectId, id),
    onSuccess: () => {
      toast.success(t('Milestone deleted'))
      invalidate()
    },
    onError: () => toast.error(t('Failed to delete milestone')),
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t('Milestones')}</CardTitle>
        <ProjectMilestoneFormDialog
          triggerLabel={t('Add milestone')}
          onSubmit={(values) => createMutation.mutateAsync(values)}
        />
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('No milestones yet.')}</p>
        ) : (
          <ul className="divide-y text-sm">
            {milestones.map((m) => (
              <li key={m.id} className="py-3 flex flex-wrap justify-between gap-2 items-center">
                <div>
                  <span className="font-medium">{m.title}</span>
                  <span className="text-muted-foreground ml-2">{m.status}</span>
                  <span className="text-muted-foreground ml-2">{m.progress ?? 0}%</span>
                </div>
                <span className="flex gap-2">
                  <ProjectMilestoneFormDialog
                    triggerLabel={t('Edit')}
                    initial={m}
                    onSubmit={(values) => updateMutation.mutateAsync({ id: m.id, values })}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (window.confirm(t('Delete this milestone?'))) {
                        deleteMutation.mutate(m.id)
                      }
                    }}
                  >
                    {t('Delete')}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
