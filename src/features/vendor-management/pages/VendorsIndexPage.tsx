import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { getApiErrorMessage } from '@/lib/errors'
import { VendorFormDialog } from '@/features/vendor-management/components/VendorFormDialog'
import { VendorViewDialog } from '@/features/vendor-management/components/VendorViewDialog'
import {
  deleteVendor,
  importVendors,
  listVendorsPaginated,
  type VmVendor,
} from '@/features/vendor-management/vendor-management-api'

export function VendorsIndexPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { auth } = useAppContext()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editing, setEditing] = useState<VmVendor | null>(null)
  const [viewing, setViewing] = useState<VmVendor | null>(null)

  usePageChrome({ title: t('Vendors'), breadcrumbs: [{ label: t('Vendor Mgt.') }] })

  const canCreate = hasPermission(auth.permissions, auth.roles, auth.userType, 'create-vm-vendors')
  const canImport = hasPermission(auth.permissions, auth.roles, auth.userType, 'import-vm-vendors')

  const query = useQuery({
    queryKey: ['vm-vendors', search],
    queryFn: () => listVendorsPaginated({ search: search || undefined, per_page: 50 }),
  })

  const remove = useMutation({
    mutationFn: deleteVendor,
    onSuccess: () => {
      toast.success(t('Vendor deleted'))
      void qc.invalidateQueries({ queryKey: ['vm-vendors'] })
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const importCsv = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(Boolean)
      if (lines.length < 2) throw new Error('CSV needs a header and rows')
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
      const rows = lines.slice(1).map((line) => {
        const cols = line.split(',')
        const row: Record<string, string> = {}
        headers.forEach((h, i) => {
          row[h] = (cols[i] ?? '').trim()
        })
        return {
          name: row.name || row.company_name,
          contact_email: row.contact_email || row.email,
          contact_name: row.contact_name,
          contact_phone: row.contact_phone || row.phone,
          tax_id: row.tax_id,
          capabilities: row.capabilities,
        }
      })
      return importVendors(rows)
    },
    onSuccess: (res) => {
      toast.success(`Imported ${res.created} (skipped ${res.skipped})`)
      void qc.invalidateQueries({ queryKey: ['vm-vendors'] })
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (row: VmVendor) => {
    setEditing(row)
    setFormOpen(true)
  }

  const openView = (row: VmVendor) => {
    setViewing(row)
    setViewOpen(true)
  }

  const refreshVendors = () => void qc.invalidateQueries({ queryKey: ['vm-vendors'] })

  const columns: Column<VmVendor>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('Name'),
        sortable: true,
        render: (value, row) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <span>{String(value ?? '')}</span>
            {row.is_supplier ? (
              <Badge variant="secondary" className="text-[10px] font-normal uppercase tracking-wide">
                {t('Supplier')}
              </Badge>
            ) : null}
          </div>
        ),
      },
      { key: 'code', header: t('Code') },
      { key: 'contact_email', header: t('Email') },
      { key: 'contact_phone', header: t('Phone') },
      {
        key: 'performance_rating',
        header: t('Rating'),
        render: (v) => (v ? String(v) : '—'),
      },
      {
        key: 'actions',
        header: t('Actions'),
        render: (_, row) => (
          <TableRowActions
            viewPermission="view-vm-vendors"
            editPermission="edit-vm-vendors"
            deletePermission="delete-vm-vendors"
            onView={() => openView(row)}
            onEdit={() => openEdit(row)}
            onDelete={() => remove.mutate(row.id)}
          />
        ),
      },
    ],
    [t, remove],
  )

  return (
    <ModuleListCard
      title={t('Vendors')}
      canCreate={canCreate}
      onCreateClick={openCreate}
      actions={
        <div className="flex gap-2">
          {canImport ? (
            <label className="inline-flex cursor-pointer">
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) importCsv.mutate(file)
                  e.target.value = ''
                }}
              />
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <Upload className="mr-1 h-4 w-4" />
                  {t('Import CSV')}
                </span>
              </Button>
            </label>
          ) : null}
          {canCreate ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              {t('Create')}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4 px-6 pb-6">
        <div className="max-w-sm">
          <Input
            placeholder={t('Search vendors...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <DataTable embedded columns={columns} data={query.data?.rows ?? []} />
      </div>

      <VendorViewDialog
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open)
          if (!open) setViewing(null)
        }}
        vendor={viewing}
        onEdit={(vendor) => {
          setViewOpen(false)
          openEdit(vendor)
        }}
        onConverted={() => {
          refreshVendors()
          setViewing((prev) => (prev ? { ...prev, is_supplier: true } : prev))
        }}
      />

      <VendorFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        mode={editing ? 'edit' : 'create'}
        vendor={editing}
        onSuccess={refreshVendors}
      />
    </ModuleListCard>
  )
}
