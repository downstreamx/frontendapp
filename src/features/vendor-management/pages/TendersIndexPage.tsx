import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { TenderWizardDialog } from '@/features/vendor-management/components/TenderWizardDialog'
import {
  deleteTender,
  listTendersPaginated,
  type VmTender,
} from '@/features/vendor-management/vendor-management-api'

export function TendersIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { auth } = useAppContext()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  usePageChrome({ title: t('Tenders'), breadcrumbs: [{ label: t('Vendor Mgt.') }] })

  const canCreate = hasPermission(auth.permissions, auth.roles, auth.userType, 'create-vm-tenders')

  const query = useQuery({
    queryKey: ['vm-tenders'],
    queryFn: () => listTendersPaginated({ per_page: 50 }),
  })

  const remove = useMutation({
    mutationFn: deleteTender,
    onSuccess: () => {
      toast.success(t('Tender deleted'))
      void qc.invalidateQueries({ queryKey: ['vm-tenders'] })
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const openCreate = () => {
    setEditId(null)
    setDialogOpen(true)
  }

  const openEdit = (id: number) => {
    setEditId(id)
    setDialogOpen(true)
  }

  const columns: Column<VmTender>[] = useMemo(
    () => [
      { key: 'name', header: t('Name'), sortable: true },
      { key: 'code', header: t('Code') },
      {
        key: 'status',
        header: t('Status'),
        render: (v) => <Badge variant="secondary">{String(v)}</Badge>,
      },
      {
        key: 'submission_deadline',
        header: t('Deadline'),
        render: (v) => (v ? new Date(String(v)).toLocaleString() : '—'),
      },
      {
        key: 'tender_vendors_count',
        header: t('Vendors'),
        render: (v) => String(v ?? 0),
      },
      {
        key: 'actions',
        header: t('Actions'),
        render: (_, row) => (
          <TableRowActions
            viewPermission="view-vm-tenders"
            editPermission="edit-vm-tenders"
            deletePermission="delete-vm-tenders"
            onView={() => navigate(paths.vendorManagement.tenderShow(row.id))}
            onEdit={row.status === 'draft' ? () => openEdit(row.id) : undefined}
            onDelete={row.status === 'draft' ? () => remove.mutate(row.id) : undefined}
          />
        ),
      },
    ],
    [t, navigate, remove],
  )

  return (
    <ModuleListCard
      title={t('Tenders')}
      canCreate={canCreate}
      onCreateClick={openCreate}
    >
      <div className="px-6 pb-6">
        <DataTable embedded columns={columns} data={query.data?.rows ?? []} />
      </div>

      <TenderWizardDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditId(null)
        }}
        tenderId={editId}
        onSuccess={() => void qc.invalidateQueries({ queryKey: ['vm-tenders'] })}
      />
    </ModuleListCard>
  )
}
