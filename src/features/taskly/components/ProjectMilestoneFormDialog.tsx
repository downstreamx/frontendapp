import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import type { ProjectMilestone } from '../api'

export type MilestoneFormValues = {
  title: string
  cost?: string
  start_date?: string
  end_date?: string
  summary?: string
  status?: string
  progress?: string
}

type Props = {
  triggerLabel: string
  initial?: ProjectMilestone
  onSubmit: (values: MilestoneFormValues) => Promise<void>
}

export function ProjectMilestoneFormDialog({ triggerLabel, initial, onSubmit }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [values, setValues] = useState<MilestoneFormValues>({
    title: initial?.title ?? '',
    cost: initial?.cost != null ? String(initial.cost) : '',
    start_date: initial?.start_date?.slice(0, 10) ?? '',
    end_date: initial?.end_date?.slice(0, 10) ?? '',
    summary: initial?.summary ?? '',
    status: initial?.status ?? 'Incomplete',
    progress: initial?.progress != null ? String(initial.progress) : '0',
  })

  const handleSubmit = async () => {
    setPending(true)
    try {
      await onSubmit(values)
      setOpen(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? t('Edit milestone') : t('Add milestone')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="ms-title">{t('Title')}</Label>
            <Input
              id="ms-title"
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ms-start">{t('Start')}</Label>
              <Input
                id="ms-start"
                type="date"
                value={values.start_date}
                onChange={(e) => setValues((v) => ({ ...v, start_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="ms-end">{t('End')}</Label>
              <Input
                id="ms-end"
                type="date"
                value={values.end_date}
                onChange={(e) => setValues((v) => ({ ...v, end_date: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="ms-summary">{t('Summary')}</Label>
            <Textarea
              id="ms-summary"
              value={values.summary}
              onChange={(e) => setValues((v) => ({ ...v, summary: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit} disabled={pending || !values.title.trim()}>
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
