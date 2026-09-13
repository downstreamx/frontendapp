import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiSelectEnhanced } from '@/components/ui/multi-select-enhanced'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { bulkMarkAttendances } from '../hrm-api'
import { useHrmMeta } from '../hooks/use-hrm-meta'

const statusOptions = [
  { value: 'present', label: 'Present' },
  { value: 'half day', label: 'Half day' },
  { value: 'absent', label: 'Absent' },
] as const

export function AttendanceBulkMarkPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { employeeOptions, isLoading: metaLoading } = useHrmMeta()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState<'present' | 'half day' | 'absent'>('present')
  const [employeeIds, setEmployeeIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  usePageChrome({
    pageTitle: t('Bulk mark attendance'),
    breadcrumbs: [
      { label: t('Hrm') },
      { label: t('Attendances'), href: '/hrm/attendances' },
      { label: t('Bulk mark') },
    ],
  })

  const mutation = useMutation({
    mutationFn: bulkMarkAttendances,
    onSuccess: (result) => {
      const created = result.created.length
      const skipped = result.skipped.length
      if (created > 0) {
        toast.success(t('Marked {{count}} attendance record(s)', { count: created }))
      }
      if (skipped > 0) {
        toast.message(t('Skipped {{count}} (already recorded)', { count: skipped }))
      }
      void queryClient.invalidateQueries({ queryKey: ['hrm', 'attendances'] })
      navigate('/hrm/attendances')
    },
    onError: () => toast.error(t('Failed to bulk mark attendance')),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (employeeIds.length === 0) {
      toast.error(t('Select at least one employee'))
      return
    }
    mutation.mutate({
      date,
      status,
      employee_ids: employeeIds.map(Number),
      notes: notes || undefined,
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/hrm/attendances">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('Back to attendances')}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t('Bulk mark attendance')}</CardTitle>
          <CardDescription>
            {t('Record the same status for multiple employees on one date. Clock times use each employee’s shift.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <Label>{t('Date')}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <Label>{t('Status')}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>{t('Employees')}</Label>
              <MultiSelectEnhanced
                options={employeeOptions.map((e) => ({ value: String(e.id), label: e.label }))}
                value={employeeIds}
                onValueChange={setEmployeeIds}
                placeholder={metaLoading ? t('Loading…') : t('Select employees')}
                searchable
              />
            </div>

            <div className="space-y-1">
              <Label>{t('Notes')}</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate('/hrm/attendances')}>
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {t('Mark attendance')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
