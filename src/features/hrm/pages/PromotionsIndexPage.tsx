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
import { usePageChrome } from '@/contexts/page-chrome-context'
import { listPromotions, type PromotionRow } from '../hrm-api'
import { useHrmMeta } from '../hooks/use-hrm-meta'

export function PromotionsIndexPage() {
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
  const [prevBranch, setPrevBranch] = useState('')
  const [prevDept, setPrevDept] = useState('')
  const [prevDesig, setPrevDesig] = useState('')
  const [curBranch, setCurBranch] = useState('')
  const [curDept, setCurDept] = useState('')
  const [curDesig, setCurDesig] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10))
  const [reason, setReason] = useState('')

  usePageChrome({
    pageTitle: t('Promotions'),
    breadcrumbs: [{ label: t('Hrm') }, { label: t('Promotions') }],
  })

  const listQuery = useQuery({
    queryKey: ['hrm-promotions'],
    queryFn: listPromotions,
  })

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post<ApiSuccess<unknown>>('/hrm/promotions', body)
      return data.data
    },
    onSuccess: () => {
      toast.success(t('Promotion recorded'))
      queryClient.invalidateQueries({ queryKey: ['hrm-promotions'] })
      setOpen(false)
    },
    onError: () => toast.error(t('Failed to record promotion')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/hrm/promotions/${id}`),
    onSuccess: () => {
      toast.success(t('Promotion deleted'))
      queryClient.invalidateQueries({ queryKey: ['hrm-promotions'] })
      setDeleteId(null)
    },
    onError: () => toast.error(t('Failed to delete promotion')),
  })

  const columns: Column<PromotionRow>[] = useMemo(
    () => [
      {
        key: 'employee',
        header: t('Employee'),
        render: (_, row) =>
          row.id != null ? (
            <Link to={`/hrm/promotions/${row.id}`} className="font-medium text-primary hover:underline">
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
            designation: row.previous_designation,
            department: row.previous_department,
            branch: row.previous_branch,
          }),
      },
      {
        key: 'to',
        header: t('To'),
        render: (_, row) =>
          orgRolePath({
            designation: row.current_designation,
            department: row.current_department,
            branch: row.current_branch,
          }),
      },
      {
        key: 'effective_date',
        header: t('Effective date'),
        render: (_, row) => formatShortDate(row.effective_date) || '—',
      },
      {
        key: 'reason',
        header: t('Reason'),
        render: (_, row) => row.reason ?? '—',
      },
      {
        key: 'actions',
        header: t('Action'),
        render: (_, row) => (
          <TableRowActions
            onView={row.id != null ? () => navigate(`/hrm/promotions/${row.id}`) : undefined}
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
        title={t('Promotions')}
        canCreate
        onCreateClick={() => setOpen(true)}
        isLoading={listQuery.isLoading}
        error={Boolean(listQuery.error)}
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('Record promotion')}</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                createMutation.mutate({
                  employee_id: Number(employeeId),
                  previous_branch_id: Number(prevBranch),
                  previous_department_id: Number(prevDept),
                  previous_designation_id: Number(prevDesig),
                  current_branch_id: Number(curBranch),
                  current_department_id: Number(curDept),
                  current_designation_id: Number(curDesig),
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
              <p className="text-xs font-medium text-muted-foreground">{t('Previous position')}</p>
              <EntitySelect
                value={prevBranch}
                onValueChange={(v) => {
                  setPrevBranch(v)
                  setPrevDept('')
                  setPrevDesig('')
                }}
                options={branchOptions}
                placeholder={t('Branch')}
                disabled={metaLoading}
              />
              <EntitySelect
                value={prevDept}
                onValueChange={(v) => {
                  setPrevDept(v)
                  setPrevDesig('')
                }}
                options={departmentOptionsFor(prevBranch)}
                placeholder={t('Department')}
                disabled={metaLoading || !prevBranch}
              />
              <EntitySelect
                value={prevDesig}
                onValueChange={setPrevDesig}
                options={designationOptionsFor(prevBranch, prevDept)}
                placeholder={t('Designation')}
                disabled={metaLoading || !prevDept}
              />
              <p className="text-xs font-medium text-muted-foreground">{t('New position')}</p>
              <EntitySelect
                value={curBranch}
                onValueChange={(v) => {
                  setCurBranch(v)
                  setCurDept('')
                  setCurDesig('')
                }}
                options={branchOptions}
                placeholder={t('Branch')}
                disabled={metaLoading}
              />
              <EntitySelect
                value={curDept}
                onValueChange={(v) => {
                  setCurDept(v)
                  setCurDesig('')
                }}
                options={departmentOptionsFor(curBranch)}
                placeholder={t('Department')}
                disabled={metaLoading || !curBranch}
              />
              <EntitySelect
                value={curDesig}
                onValueChange={setCurDesig}
                options={designationOptionsFor(curBranch, curDept)}
                placeholder={t('Designation')}
                disabled={metaLoading || !curDept}
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
        title={t('Delete promotion')}
        message={t('Are you sure you want to delete this promotion?')}
        confirmText={t('Delete')}
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        variant="destructive"
      />
    </>
  )
}
