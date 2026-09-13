import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ProjectDuplicateOptions, ProjectListRow } from '../taskly-api'

type Props = {
  project: ProjectListRow | null
  open: boolean
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (projectId: number, options: ProjectDuplicateOptions) => void
}

const defaultOptions: ProjectDuplicateOptions = {
  all: false,
  tasks: true,
  taskSubtasks: true,
  taskComments: true,
  bugs: true,
  bugComments: true,
  activity: false,
  teamMembers: true,
  clients: true,
  milestones: true,
  projectFiles: false,
}

export function ProjectDuplicateDialog({
  project,
  open,
  isPending,
  onOpenChange,
  onConfirm,
}: Props) {
  const { t } = useTranslation()
  const [options, setOptions] = useState<ProjectDuplicateOptions>(defaultOptions)

  const setOption = (key: keyof ProjectDuplicateOptions, checked: boolean) => {
    setOptions((prev) => ({ ...prev, [key]: checked }))
  }

  const setAll = (checked: boolean) => {
    setOptions({
      all: checked,
      tasks: checked,
      taskSubtasks: checked,
      taskComments: checked,
      bugs: checked,
      bugComments: checked,
      activity: checked,
      teamMembers: checked,
      clients: checked,
      milestones: checked,
      projectFiles: checked,
    })
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) setOptions(defaultOptions)
    onOpenChange(next)
  }

  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('Duplicate Project')}: {project.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox id="dup-all" checked={options.all} onCheckedChange={(c) => setAll(c === true)} />
            <Label htmlFor="dup-all">{t('Select all')}</Label>
          </div>
          {(
            [
              ['teamMembers', t('Team members')],
              ['clients', t('Clients')],
              ['milestones', t('Milestones')],
              ['tasks', t('Tasks')],
              ['taskSubtasks', t('Task subtasks')],
              ['taskComments', t('Task comments')],
              ['bugs', t('Bugs')],
              ['bugComments', t('Bug comments')],
              ['activity', t('Activity log')],
              ['projectFiles', t('Project files')],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={`dup-${key}`}
                checked={options[key]}
                onCheckedChange={(c) => setOption(key, c === true)}
              />
              <Label htmlFor={`dup-${key}`} className="font-normal">
                {label}
              </Label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => onConfirm(project.id, options)}
          >
            {isPending ? t('Duplicating...') : t('Duplicate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
