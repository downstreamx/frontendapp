import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarClock, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
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
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { EntitySelect } from '@/components/forms/entity-select'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { formatShortDate } from '@/features/shared/lib/entity-labels'
import {
  createAttendance,
  deleteAttendance,
  listAttendancesPaginated,
  updateAttendance,
  type AttendanceRow,
} from '../hrm-api'
import { useHrmMeta } from '../hooks/use-hrm-meta'

function toDateTimeLocal(value?: string): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toApiDateTime(local: string): string {
  const d = new Date(local)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

function statusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'present') return 'default'
  if (status === 'absent') return 'destructive'
  return 'secondary'
}

type FormState = {
  employee_id: string
  date: string
  clock_in: string
  clock_out: string
  break_hour: string
  notes: string
}

const emptyForm = (): FormState => ({
  employee_id: '',
  date: new Date().toISOString().slice(0, 10),
  clock_in: '',
  clock_out: '',
  break_hour: '0',
  notes: '',
})

export function AttendancesIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const { employeeOptions, isLoading: metaLoading } = useHrmMeta()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AttendanceRow | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const page = Number(searchParams.get('page') ?? '1') || 1

  usePageChrome({
    pageTitle: t('Attendances'),
    breadcrumbs: [{ label: t('Hrm') }, { label: t('Attendances') }],
  })

  const canCreate = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-attendances')
  const canEdit = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'edit-attendances')
  const canDelete = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'delete-attendances')

  const listParams = useMemo(
    () => ({
      per_page: toolbar.perPage,
      page: String(page),
      ...(toolbar.search ? { search: toolbar.search } : {}),
      ...(filterEmployee ? { employee_id: filterEmployee } : {}),
      ...(filterStatus ? { status: filterStatus } : {}),
      ...(filterDateFrom ? { date_from: filterDateFrom } : {}),
      ...(filterDateTo ? { date_to: filterDateTo } : {}),
    }),
    [page, toolbar.perPage, toolbar.search, filterEmployee, filterStatus, filterDateFrom, filterDateTo],
  )

  const listQuery = useQuery({
    queryKey: ['hrm', 'attendances', listParams],
    queryFn: () => listAttendancesPaginated(listParams),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['hrm', 'attendances'] })

  useEffect(() => {
    if (!open && !editing) return
    if (editing) {
      setForm({
        employee_id: String(editing.employee_id ?? editing.user?.id ?? ''),
        date: editing.date?.slice(0, 10) ?? '',
        clock_in: toDateTimeLocal(editing.clock_in),
        clock_out: toDateTimeLocal(editing.clock_out),
        break_hour: String(editing.break_hour ?? 0),
        notes: editing.notes ?? '',
      })
    } else {
      setForm(emptyForm())
    }
  }, [open, editing])

  const buildPayload = () => ({
    employee_id: Number(form.employee_id),
    date: form.date,
    clock_in: toApiDateTime(form.clock_in),
    clock_out: toApiDateTime(form.clock_out),
    break_hour: form.break_hour ? Number(form.break_hour) : undefined,
    notes: form.notes || undefined,
  })

  const createMutation = useMutation({
    mutationFn: createAttendance,
    onSuccess: () => {
      toast.success(t('Attendance created'))
      invalidate()
      setOpen(false)
    },
    onError: () => toast.error(t('Failed to create attendance')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ReturnType<typeof buildPayload> }) =>
      updateAttendance(id, payload),
    onSuccess: () => {
      toast.success(t('Attendance updated'))
      invalidate()
      setEditing(null)
    },
    onError: () => toast.error(t('Failed to update attendance')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAttendance,
    onSuccess: () => {
      toast.success(t('Attendance deleted'))
      invalidate()
    },
    onError: () => toast.error(t('Failed to delete attendance')),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = buildPayload()
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const columns: Column<AttendanceRow>[] = [
    { key: 'employee', header: t('Employee'), render: (_, row) => row.user?.name ?? '—' },
    {
      key: 'date',
      header: t('Date'),
      render: (_, row) => (row.date ? formatShortDate(row.date) : '—'),
    },
    { key: 'shift', header: t('Shift'), render: (_, row) => row.shift?.shift_name ?? '—' },
    {
      key: 'clock_in',
      header: t('Clock in'),
      render: (_, row) => (row.clock_in ? new Date(row.clock_in).toLocaleString() : '—'),
    },
    {
      key: 'clock_out',
      header: t('Clock out'),
      render: (_, row) => (row.clock_out ? new Date(row.clock_out).toLocaleString() : '—'),
    },
    { key: 'total_hour', header: t('Hours'), render: (_, row) => row.total_hour ?? '—' },
    {
      key: 'status',
      header: t('Status'),
      render: (_, row) => <Badge variant={statusVariant(row.status)}>{row.status ?? '—'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (_, row) => (
        <TableRowActions
          editPermission="edit-attendances"
          deletePermission="delete-attendances"
          onEdit={canEdit ? () => setEditing(row) : undefined}
          onDelete={canDelete ? () => deleteMutation.mutate(row.id) : undefined}
        />
      ),
    },
  ]

  const dialogOpen = open || !!editing
  const rows = listQuery.data?.rows ?? []

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      {canCreate && (
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to="/hrm/attendances/bulk-mark">
              <Users className="mr-2 h-4 w-4" />
              {t('Bulk mark')}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/hrm/shifts/assign">{t('Assign shift')}</Link>
          </Button>
        </>
      )}
      {canCreate && (
        <Button size="sm" onClick={() => setOpen(true)}>
          {t('Create')}
        </Button>
      )}
    </div>
  )

  return (
    <>
      <ModuleListCard
        title={t('Attendances')}
        description={t('Track employee clock-in and clock-out records.')}
        actions={headerActions}
        isLoading={listQuery.isLoading}
        error={!!listQuery.error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: () => {
            toolbar.applySearch()
            const next = new URLSearchParams(searchParams)
            next.set('page', '1')
            setSearchParams(next)
          },
          searchPlaceholder: t('Search by employee or date…'),
          showFilters,
          onToggleFilters: () => setShowFilters((v) => !v),
          filtersPanel: showFilters ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label>{t('Employee')}</Label>
                <EntitySelect
                  value={filterEmployee}
                  onValueChange={setFilterEmployee}
                  options={[{ id: '', label: t('All') }, ...employeeOptions]}
                  placeholder={t('All employees')}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Status')}</Label>
                <Select value={filterStatus || 'all'} onValueChange={(v) => setFilterStatus(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All')}</SelectItem>
                    <SelectItem value="present">{t('Present')}</SelectItem>
                    <SelectItem value="half day">{t('Half day')}</SelectItem>
                    <SelectItem value="absent">{t('Absent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('From')}</Label>
                <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('To')}</Label>
                <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
              </div>
            </div>
          ) : undefined,
        }}
        pagination={
          listQuery.data?.meta
            ? {
                ...listQuery.data.meta,
                onPageChange: (p) => {
                  const next = new URLSearchParams(searchParams)
                  next.set('page', String(p))
                  setSearchParams(next)
                },
              }
            : undefined
        }
      >
        {rows.length === 0 && !listQuery.isLoading ? (
          <NoRecordsFound
            icon={CalendarClock}
            title={t('No attendances found')}
            description={t('Get started by recording your first attendance.')}
            createPermission="create-attendances"
            onCreateClick={() => setOpen(true)}
            createButtonText={t('Create attendance')}
            className="h-auto py-8"
          />
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            className="rounded-none border-0 shadow-none"
          />
        )}
      </ModuleListCard>

      <Dialog
        open={dialogOpen}
        onOpenChange={(next) => {
          if (!next) {
            setOpen(false)
            setEditing(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('Edit attendance') : t('Create attendance')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <Label>{t('Employee')}</Label>
              <EntitySelect
                value={form.employee_id}
                onValueChange={(v) => setForm((f) => ({ ...f, employee_id: v }))}
                options={employeeOptions}
                placeholder={t('Select employee')}
                required
                disabled={metaLoading}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('Date')}</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Clock in')}</Label>
                <Input
                  type="datetime-local"
                  value={form.clock_in}
                  onChange={(e) => setForm((f) => ({ ...f, clock_in: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Clock out')}</Label>
                <Input
                  type="datetime-local"
                  value={form.clock_out}
                  onChange={(e) => setForm((f) => ({ ...f, clock_out: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('Break hours')}</Label>
              <Input
                type="number"
                step="0.25"
                min="0"
                value={form.break_hour}
                onChange={(e) => setForm((f) => ({ ...f, break_hour: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('Notes')}</Label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? t('Save') : t('Create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
