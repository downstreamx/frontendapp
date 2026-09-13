import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { EntitySelect } from '@/components/forms/entity-select'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { formatShortDate, orgRolePath, personName } from '@/features/shared/lib/entity-labels'
import { api, type ApiSuccess } from '@/lib/api'
import { extractListRows } from '@/hooks/use-resource-list'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useHrmMeta } from '../hooks/use-hrm-meta'

type TransferRow = {
  id: number
  employee_id?: number
  effective_date?: string
  status?: string
  employee?: { name?: string; email?: string }
  from_branch?: { branch_name?: string }
  from_department?: { department_name?: string }
  from_designation?: { designation_name?: string }
  to_branch?: { branch_name?: string }
  to_department?: { department_name?: string }
  to_designation?: { designation_name?: string }
}

export function EmployeeTransfersIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const {
    employeeOptions,
    branchOptions,
    departmentOptionsFor,
    designationOptionsFor,
    isLoading: metaLoading,
  } = useHrmMeta()
  const [employeeId, setEmployeeId] = useState('')
  const [fromBranch, setFromBranch] = useState('')
  const [fromDept, setFromDept] = useState('')
  const [fromDesig, setFromDesig] = useState('')
  const [toBranch, setToBranch] = useState('')
  const [toDept, setToDept] = useState('')
  const [toDesig, setToDesig] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10))
  const [reason, setReason] = useState('')

  usePageChrome({
    pageTitle: t('Employee transfers'),
    breadcrumbs: [{ label: t('Hrm') }, { label: t('Transfers') }],
  })

  const listQuery = useQuery({
    queryKey: ['hrm-employee-transfers'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<unknown>>('/hrm/employee-transfers')
      return extractListRows<TransferRow>(data.data)
    },
  })

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post<ApiSuccess<unknown>>('/hrm/employee-transfers', body)
      return data.data
    },
    onSuccess: () => {
      toast.success(t('Transfer recorded'))
      queryClient.invalidateQueries({ queryKey: ['hrm-employee-transfers'] })
      setOpen(false)
    },
    onError: () => toast.error(t('Failed to record transfer')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/hrm/employee-transfers/${id}`),
    onSuccess: () => {
      toast.success(t('Transfer deleted'))
      queryClient.invalidateQueries({ queryKey: ['hrm-employee-transfers'] })
      setDeleteId(null)
    },
    onError: () => toast.error(t('Failed to delete transfer')),
  })

  const columns: Column<TransferRow>[] = useMemo(
    () => [
      {
        key: 'employee',
        header: t('Employee'),
        render: (_, row) =>
          row.id != null ? (
            <Link
              to={`/hrm/employee-transfers/${row.id}`}
              className="font-medium text-primary hover:underline"
            >
              {personName(row.employee, row.employee_id)}
            </Link>
          ) : (
            personName(row.employee, row.employee_id)
          ),
      },
      {
        key: 'from',
        header: t('From'),
        render: (_, row) =>
          orgRolePath({
            designation: row.from_designation,
            department: row.from_department,
            branch: row.from_branch,
          }),
      },
      {
        key: 'to',
        header: t('To'),
        render: (_, row) =>
          orgRolePath({
            designation: row.to_designation,
            department: row.to_department,
            branch: row.to_branch,
          }),
      },
      {
        key: 'effective_date',
        header: t('Effective date'),
        render: (_, row) => formatShortDate(row.effective_date) || '—',
      },
      {
        key: 'status',
        header: t('Status'),
        render: (_, row) => row.status ?? '—',
      },
      {
        key: 'actions',
        header: t('Action'),
        render: (_, row) => (
          <TableRowActions
            onView={
              row.id != null ? () => navigate(`/hrm/employee-transfers/${row.id}`) : undefined
            }
            onDelete={() => row.id != null && setDeleteId(row.id)}
          />
        ),
      },
    ],
    [navigate, t],
  )

  return (
    <>
      <ModuleListCard
        title={t('Employee transfers')}
        canCreate
        onCreateClick={() => setOpen(true)}
        isLoading={listQuery.isLoading}
        error={Boolean(listQuery.error)}
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('Record transfer')}</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                createMutation.mutate({
                  employee_id: Number(employeeId),
                  from_branch_id: Number(fromBranch),
                  from_department_id: Number(fromDept),
                  from_designation_id: Number(fromDesig),
                  to_branch_id: Number(toBranch),
                  to_department_id: Number(toDept),
                  to_designation_id: Number(toDesig),
                  effective_date: effectiveDate,
                  reason: reason || undefined,
                })
              }}
            >
              <div className="space-y-1">
                <Label>{t('Employee')}</Label>
                <EntitySelect
                  value={employeeId}
                  onValueChange={setEmployeeId}
                  options={employeeOptions}
                  required
                  disabled={metaLoading}
                />
              </div>
              <p className="text-xs font-medium text-muted-foreground">{t('From')}</p>
              <EntitySelect
                value={fromBranch}
                onValueChange={(v) => {
                  setFromBranch(v)
                  setFromDept('')
                  setFromDesig('')
                }}
                options={branchOptions}
                placeholder={t('Branch')}
                disabled={metaLoading}
              />
              <EntitySelect
                value={fromDept}
                onValueChange={(v) => {
                  setFromDept(v)
                  setFromDesig('')
                }}
                options={departmentOptionsFor(fromBranch)}
                placeholder={t('Department')}
                disabled={metaLoading || !fromBranch}
              />
              <EntitySelect
                value={fromDesig}
                onValueChange={setFromDesig}
                options={designationOptionsFor(fromBranch, fromDept)}
                placeholder={t('Designation')}
                disabled={metaLoading || !fromDept}
              />
              <p className="text-xs font-medium text-muted-foreground">{t('To')}</p>
              <EntitySelect
                value={toBranch}
                onValueChange={(v) => {
                  setToBranch(v)
                  setToDept('')
                  setToDesig('')
                }}
                options={branchOptions}
                placeholder={t('Branch')}
                disabled={metaLoading}
              />
              <EntitySelect
                value={toDept}
                onValueChange={(v) => {
                  setToDept(v)
                  setToDesig('')
                }}
                options={departmentOptionsFor(toBranch)}
                placeholder={t('Department')}
                disabled={metaLoading || !toBranch}
              />
              <EntitySelect
                value={toDesig}
                onValueChange={setToDesig}
                options={designationOptionsFor(toBranch, toDept)}
                placeholder={t('Designation')}
                disabled={metaLoading || !toDept}
              />
              <div className="space-y-1">
                <Label>{t('Effective date')}</Label>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Reason')}</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {t('Save')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <DataTable
          data={listQuery.data ?? []}
          columns={columns}
          className="rounded-none border-0 shadow-none"
        />
      </ModuleListCard>
      <ConfirmationDialog
        open={deleteId != null}
        onOpenChange={(isOpen) => !isOpen && setDeleteId(null)}
        title={t('Delete transfer')}
        message={t('Are you sure you want to delete this transfer?')}
        confirmText={t('Delete')}
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        variant="destructive"
      />
    </>
  )
}
