import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { assignEmployeeShift, listEmployees, listShifts } from '../hrm-api'

export function ShiftAssignPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [shiftId, setShiftId] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())

  usePageChrome({
    pageTitle: t('Assign shift'),
    breadcrumbs: [
      { label: t('Hrm') },
      { label: t('Shifts'), href: '/hrm/shifts' },
      { label: t('Assign shift') },
    ],
  })

  const employeesQuery = useQuery({
    queryKey: ['hrm', 'employees', 'assign-shift'],
    queryFn: () => listEmployees({ per_page: '200' }),
  })

  const shiftsQuery = useQuery({
    queryKey: ['hrm', 'shifts'],
    queryFn: listShifts,
  })

  const rows = useMemo(
    () =>
      (employeesQuery.data ?? []).filter((e) => e.user?.id).map((e) => ({
        userId: e.user!.id,
        name: e.user?.name ?? '—',
        currentShift: e.shift?.shift_name ?? t('None'),
      })),
    [employeesQuery.data, t],
  )

  const toggle = (userId: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(rows.map((r) => r.userId)))
    }
  }

  const mutation = useMutation({
    mutationFn: assignEmployeeShift,
    onSuccess: (result) => {
      toast.success(t('Updated shift for {{count}} employee(s)', { count: result.updated }))
      void queryClient.invalidateQueries({ queryKey: ['hrm', 'employees'] })
      navigate('/hrm/shifts')
    },
    onError: () => toast.error(t('Failed to assign shift')),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shiftId) {
      toast.error(t('Select a shift'))
      return
    }
    if (selected.size === 0) {
      toast.error(t('Select at least one employee'))
      return
    }
    mutation.mutate({
      shift_id: Number(shiftId),
      employee_ids: [...selected],
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/hrm/shifts">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('Back to shifts')}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t('Assign shift to employees')}</CardTitle>
          <CardDescription>
            {t('Set the work shift used for attendance clock times and payroll calculations.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <Label>{t('Shift')}</Label>
              <Select value={shiftId} onValueChange={setShiftId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Select shift')} />
                </SelectTrigger>
                <SelectContent>
                  {(shiftsQuery.data ?? []).map((shift) => (
                    <SelectItem key={shift.id} value={String(shift.id)}>
                      {shift.shift_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('Employees')}</Label>
                <Button type="button" variant="link" size="sm" onClick={toggleAll}>
                  {selected.size === rows.length ? t('Clear all') : t('Select all')}
                </Button>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border p-3">
                {employeesQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
                ) : rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('No employees found')}</p>
                ) : (
                  rows.map((row) => (
                    <label
                      key={row.userId}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selected.has(row.userId)}
                        onCheckedChange={() => toggle(row.userId)}
                      />
                      <span className="flex-1 text-sm font-medium">{row.name}</span>
                      <span className="text-xs text-muted-foreground">{row.currentShift}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate('/hrm/shifts')}>
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {t('Assign shift')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
