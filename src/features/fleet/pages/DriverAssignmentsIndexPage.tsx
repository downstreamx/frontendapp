import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { PerPageSelector } from '@/components/ui/per-page-selector'
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
import { EntitySelect, LookupSelectContent } from '@/components/forms/entity-select'
import { toDriverLookupOptions, toTruckLookupOptions } from '@/features/_shared/operations-lookups'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/utils/helpers'
import { Truck } from 'lucide-react'
import {
  TableAvatarFrame,
  TableAvatarMedia,
  TableUserAvatarCell,
} from '@/features/shared/components/table-avatar-cells'
import { truckDriverLabel, truckLabel } from '@/features/shared/lib/entity-labels'
import { FleetStatusBadge } from '../components/FleetStatusBadge'
import { ForbiddenPage } from '@/components/status-page'
import {
  createTruckAssignment,
  fetchTruckAssignmentsIndexMeta,
  listTruckAssignmentsPaginated,
  updateTruckAssignment,
  type TruckAssignmentRow,
} from '../fleet-api'

function toDatetimeLocalValue(value?: string | null): string {
  if (!value) return new Date().toISOString().slice(0, 16)
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  return normalized.slice(0, 16)
}

type AppliedFilters = {
  truck_id: string
  driver_id: string
  status: string
}

const defaultFilters: AppliedFilters = {
  truck_id: '',
  driver_id: '',
  status: '',
}

const defaultAssignmentDateTime = () => new Date().toISOString().slice(0, 16)

export function DriverAssignmentsIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<TruckAssignmentRow | null>(null)
  const [truckId, setTruckId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [assignmentDate, setAssignmentDate] = useState(defaultAssignmentDateTime)
  const [status, setStatus] = useState('active')

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const canManage = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-truck-assignments')
  const canCreate = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-truck-assignments')
  const canEdit = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'edit-truck-assignments')

  usePageChrome({
    pageTitle: t('Driver Assignments'),
    breadcrumbs: [{ label: t('Fleet') }, { label: t('Driver Assignments') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.truck_id) params.truck_id = appliedFilters.truck_id
    if (appliedFilters.driver_id) params.driver_id = appliedFilters.driver_id
    if (appliedFilters.status) params.status = appliedFilters.status
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['fleet', 'truck-assignments', listParams],
    queryFn: () => listTruckAssignmentsPaginated(listParams),
    enabled: canManage,
  })

  const { data: indexMeta, refetch: refetchIndexMeta } = useQuery({
    queryKey: ['fleet', 'truck-assignments', 'index-meta'],
    queryFn: fetchTruckAssignmentsIndexMeta,
    enabled: canManage,
  })

  useEffect(() => {
    if (formOpen) {
      void refetchIndexMeta()
    }
  }, [formOpen, refetchIndexMeta])

  const resetForm = () => {
    setEditingRow(null)
    setTruckId('')
    setDriverId('')
    setAssignmentDate(defaultAssignmentDateTime())
    setStatus('active')
  }

  const openCreate = () => {
    resetForm()
    setFormOpen(true)
  }

  const openEdit = (row: TruckAssignmentRow) => {
    setEditingRow(row)
    setTruckId(String(row.truck_id ?? ''))
    setDriverId(String(row.driver_id ?? ''))
    setAssignmentDate(toDatetimeLocalValue(row.assignment_date))
    setStatus(row.status ?? 'active')
    setFormOpen(true)
  }

  const truckOptions = useMemo(
    () => toTruckLookupOptions(indexMeta?.trucks ?? []),
    [indexMeta?.trucks],
  )

  const driverOptions = useMemo(
    () =>
      toDriverLookupOptions(
        (indexMeta?.drivers ?? []).map((d) => ({
          id: d.id,
          display_name: d.display_name,
          first_name: d.first_name,
          last_name: d.last_name,
          email: d.email,
          avatar: d.avatar,
        })),
      ).map((opt) => {
        const driver = indexMeta?.drivers?.find((d) => d.id === opt.id)
        return driver ? { ...opt, label: truckDriverLabel(driver, driver.id) } : opt
      }),
    [indexMeta?.drivers],
  )

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'fleet.truck-assignments.destroy',
      defaultMessage: t('Are you sure you want to delete this assignment?'),
      onSuccess: () => {
        toast.success(t('Assignment deleted'))
        void queryClient.invalidateQueries({ queryKey: ['fleet', 'truck-assignments'] })
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete assignment'))),
    })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        truck_id: Number(truckId),
        driver_id: Number(driverId),
        assignment_date: assignmentDate,
        status,
      }
      if (editingRow) {
        return updateTruckAssignment(editingRow.id, body)
      }
      return createTruckAssignment(body)
    },
    onSuccess: () => {
      toast.success(editingRow ? t('Assignment updated') : t('Assignment created'))
      void queryClient.invalidateQueries({ queryKey: ['fleet', 'truck-assignments'] })
      setFormOpen(false)
      resetForm()
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(
          err,
          editingRow ? t('Failed to update assignment') : t('Failed to create assignment'),
        ),
      ),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = [
    appliedFilters.truck_id,
    appliedFilters.driver_id,
    appliedFilters.status,
  ].filter(Boolean).length
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

  const applyFilters = () => {
    toolbar.applySearch()
    setAppliedFilters(draftFilters)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', '1')
      return next
    })
  }

  const clearFilters = () => {
    toolbar.clearSearch()
    setDraftFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('page')
      return next
    })
  }

  const setSort = (field: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const current = prev.get('sort') ?? ''
      const dir = prev.get('direction') ?? 'asc'
      if (current === field && dir === 'asc') {
        next.set('direction', 'desc')
      } else {
        next.set('sort', field)
        next.set('direction', 'asc')
      }
      return next
    })
  }

  const columns: Column<TruckAssignmentRow>[] = [
    {
      key: 'truck_id',
      header: t('Truck'),
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <TableAvatarFrame size="md">
            <TableAvatarMedia src={row.truck?.avatar} fallback={Truck} alt={truckLabel(row.truck, row.truck_id)} />
          </TableAvatarFrame>
          <span>{truckLabel(row.truck, row.truck_id)}</span>
        </div>
      ),
    },
    {
      key: 'driver_id',
      header: t('Driver'),
      render: (_, row) => (
        <TableUserAvatarCell
          avatar={row.driver?.user?.avatar}
          name={truckDriverLabel(row.driver, row.driver_id)}
        />
      ),
    },
    {
      key: 'assignment_date',
      header: t('Assignment Date & Time'),
      sortable: true,
      render: (_, row) => (row.assignment_date ? formatDateTime(row.assignment_date) : '—'),
    },
    {
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (_, row) => <FleetStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <TableRowActions
          editPermission="edit-truck-assignments"
          onEdit={canEdit ? () => openEdit(row) : undefined}
          deletePermission="delete-truck-assignments"
          onDelete={() =>
            openDeleteDialog(
              row.id,
              t('Delete assignment for {{truck}}?', {
                truck: truckLabel(row.truck, row.truck_id),
              }),
            )
          }
        />
      ),
    },
  ]

  if (!canManage) {
    return <ForbiddenPage />
  }

  return (
    <>
      <ModuleListCard
        title={t('Driver Assignments')}
        description={t('Assign drivers to trucks and track handover status.')}
        canCreate={canCreate}
        onCreateClick={openCreate}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search assignments...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('Truck')}</Label>
                <Select
                  value={draftFilters.truck_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, truck_id: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All trucks')} />
                  </SelectTrigger>
                  <LookupSelectContent
                      leadingItem={<SelectItem value="all">{t('All trucks')}</SelectItem>}
                      options={truckOptions}
                    />
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Driver')}</Label>
                <Select
                  value={draftFilters.driver_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, driver_id: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All drivers')} />
                  </SelectTrigger>
                  <LookupSelectContent
                      leadingItem={<SelectItem value="all">{t('All drivers')}</SelectItem>}
                      options={driverOptions}
                    />
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Status')}</Label>
                <Select
                  value={draftFilters.status || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, status: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All statuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All statuses')}</SelectItem>
                    {(indexMeta?.statuses ?? []).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : undefined,
        }}
        pagination={pagination}
        onPageChange={(p) =>
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            next.set('page', String(p))
            return next
          })
        }
      >
        {rows.length === 0 && !isLoading ? (
          <NoRecordsFound
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            createPermission="create-truck-assignments"
            onCreateClick={openCreate}
          />
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={setSort}
          />
        )}
      </ModuleListCard>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRow ? t('Edit driver assignment') : t('Assign driver to truck')}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              saveMutation.mutate()
            }}
          >
            <div className="space-y-1">
              <Label>{t('Truck')}</Label>
              <EntitySelect
                value={truckId}
                onValueChange={setTruckId}
                options={truckOptions}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>{t('Driver')}</Label>
              <EntitySelect
                value={driverId}
                onValueChange={setDriverId}
                options={driverOptions}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Assignment date & time')}</Label>
                <Input
                  type="datetime-local"
                  value={assignmentDate}
                  onChange={(e) => setAssignmentDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Status')}</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(indexMeta?.statuses ?? ['active']).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saveMutation.isPending}>
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete Assignment')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
