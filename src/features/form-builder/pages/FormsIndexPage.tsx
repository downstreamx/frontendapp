import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { CrudFormDialog, type CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import {
  createForm,
  deleteForm,
  listFormsPaginated,
  updateForm,
  type FormListItem,
} from '../form-builder-api'
import { useFormsMeta } from '../hooks/use-form-builder-meta'

type AppliedFilters = {
  is_active: string
}

const defaultFilters: AppliedFilters = {
  is_active: '',
}

const formFields: CrudFieldDef[] = [
  { name: 'name', label: 'Name', required: true },
  {
    name: 'is_active',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'true', label: 'Active' },
      { value: 'false', label: 'Inactive' },
    ],
  },
  {
    name: 'default_layout',
    label: 'Layout',
    type: 'select',
    options: [
      { value: 'single', label: 'Single column' },
      { value: 'two-column', label: 'Two column' },
      { value: 'card', label: 'Card' },
    ],
  },
]

function toFormValues(row: FormListItem): Record<string, unknown> {
  return {
    ...row,
    is_active: row.is_active === false ? 'false' : 'true',
    default_layout: row.default_layout ?? 'single',
  }
}

function toPayload(raw: Record<string, unknown>): Record<string, unknown> {
  const payload = { ...raw }
  if (payload.is_active === 'true') payload.is_active = true
  if (payload.is_active === 'false') payload.is_active = false
  return payload
}

export function FormsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | ''>('')
  const [editRow, setEditRow] = useState<FormListItem | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const { data: indexMeta } = useFormsMeta()

  usePageChrome({
    pageTitle: t('Forms'),
    breadcrumbs: [{ label: t('Form builder') }, { label: t('Forms') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.is_active !== '') params.is_active = appliedFilters.is_active
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['form-builder', 'forms', listParams],
    queryFn: () => listFormsPaginated(listParams),
  })

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ['form-builder', 'forms'] })

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createForm(payload as Parameters<typeof createForm>[0]),
    onSuccess: (row) => {
      toast.success(t('Created successfully'))
      invalidate()
      setModalMode('')
      navigate(paths.formBuilder(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to create'))),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateForm(id, payload as Parameters<typeof updateForm>[1]),
    onSuccess: () => {
      toast.success(t('Saved successfully'))
      invalidate()
      setModalMode('')
      setEditRow(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save'))),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteForm,
    onSuccess: () => {
      toast.success(t('Deleted successfully'))
      invalidate()
      setDeleteId(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = Object.values(appliedFilters).filter((v) => v !== '').length
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

  const copyFormCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
      toast.success(t('Copied!'))
    } catch {
      toast.error(t('Failed to copy'))
    }
  }

  const columns: Column<FormListItem>[] = [
    {
      key: 'name',
      header: t('Name'),
      sortable: true,
      render: (_, row) => (
        <Link to={paths.formBuilder(row.id)} className="text-primary hover:underline">
          {row.name}
        </Link>
      ),
    },
    {
      key: 'fields_count',
      header: t('Fields'),
      render: (_, row) => String(row.fields_count ?? 0),
    },
    {
      key: 'responses_count',
      header: t('Responses'),
      render: (_, row) => String(row.responses_count ?? 0),
    },
    {
      key: 'is_active',
      header: t('Status'),
      sortable: true,
      render: (_, row) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'}>
          {row.is_active ? t('Active') : t('Inactive')}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: t('Created at'),
      sortable: true,
      render: (_, row) => (row.created_at ? formatDateTime(row.created_at) : '—'),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {row.code ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => void copyFormCode(row.code!)}
            >
              {copiedCode === row.code ? t('Copied!') : t('Copy code')}
            </Button>
          ) : null}
          <TableRowActions
            editPermission="edit-formbuilder-form"
            deletePermission="delete-formbuilder-form"
            onEdit={() => navigate(paths.formBuilder(row.id))}
            onDelete={() => setDeleteId(row.id)}
          />
        </div>
      ),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Forms')}
        description={t('Build and manage lead capture forms with custom fields.')}
        canCreate
        onCreateClick={() => {
          setEditRow(null)
          setModalMode('add')
        }}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search forms...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>{t('Status')}</Label>
                <Select
                  value={draftFilters.is_active === '' ? 'all' : draftFilters.is_active}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, is_active: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All statuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All statuses')}</SelectItem>
                    {(indexMeta?.active_options ?? []).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
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
            onCreateClick={() => {
              setEditRow(null)
              setModalMode('add')
            }}
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

      <CrudFormDialog
        open={modalMode === 'add' || modalMode === 'edit'}
        mode={modalMode === 'edit' ? 'edit' : 'add'}
        title={
          modalMode === 'edit'
            ? t('Edit {{entity}}', { entity: t('Form') })
            : t('Create {{entity}}', { entity: t('Form') })
        }
        fields={formFields}
        initialValues={
          editRow
            ? toFormValues(editRow)
            : { is_active: 'true', default_layout: 'single' }
        }
        isPending={createMutation.isPending || updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setModalMode('')
            setEditRow(null)
          }
        }}
        onSubmit={(raw) => {
          const payload = toPayload(raw)
          if (modalMode === 'edit' && editRow?.id != null) {
            updateMutation.mutate({ id: editRow.id, payload })
          } else {
            createMutation.mutate(payload)
          }
        }}
      />

      <ConfirmationDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('Delete {{entity}}', { entity: t('Form') })}
        message={t('Are you sure you want to delete this form?')}
        confirmText={t('Delete')}
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        variant="destructive"
      />
    </>
  )
}
