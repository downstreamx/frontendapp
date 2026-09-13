import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Edit, Eye, Ticket, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { formatDate } from '@/utils/helpers'
import {
  deleteCoupon,
  listCouponsPaginated,
  type CouponRow,
} from '@/features/saas/saas-api'
import { CouponFormDialog } from '../components/CouponFormDialog'
import { formatCouponDiscount } from '../lib/format-coupon-discount'

type AppliedFilters = {
  code: string
  type: string
  status: string
}

const defaultFilters: AppliedFilters = { code: '', type: '', status: '' }

export function CouponsIndexPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { adminAllSetting } = useAppContext()
  const currencySymbol = adminAllSetting.currencySymbol || '$'
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingCoupon, setEditingCoupon] = useState<CouponRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CouponRow | null>(null)

  const page = Number(searchParams.get('page') ?? '1') || 1

  usePageChrome({
    pageTitle: t('Manage Coupons'),
    breadcrumbs: [{ label: t('Billing') }, { label: t('Coupons') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.code) params.code = appliedFilters.code
    if (appliedFilters.type) params.type = appliedFilters.type
    if (appliedFilters.status !== '') params.status = appliedFilters.status
    return params
  }, [appliedFilters, page, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['saas', 'coupons', listParams],
    queryFn: () => listCouponsPaginated(listParams),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCoupon(id),
    onSuccess: () => {
      toast.success(t('The coupon has been deleted.'))
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['saas', 'coupons'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete coupon'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

  const openCreate = () => {
    setDialogMode('create')
    setEditingCoupon(null)
    setDialogOpen(true)
  }

  const openEdit = (coupon: CouponRow) => {
    setDialogMode('edit')
    setEditingCoupon(coupon)
    setDialogOpen(true)
  }

  const applyFilters = () => {
    setAppliedFilters(draftFilters)
    toolbar.applySearch()
    const next = new URLSearchParams(searchParams)
    next.set('page', '1')
    setSearchParams(next)
  }

  const clearFilters = () => {
    setDraftFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
    toolbar.setDraftSearch('')
    toolbar.applySearch(true)
    const next = new URLSearchParams(searchParams)
    next.delete('page')
    setSearchParams(next)
  }

  const columns: Column<CouponRow>[] = [
    {
      key: 'name',
      header: t('Name'),
      render: (_, row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'code',
      header: t('Code'),
      render: (_, row) => (
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs">{row.code}</span>
      ),
    },
    {
      key: 'discount',
      header: t('Discount'),
      render: (_, row) => (
        <span className="font-medium">{formatCouponDiscount(row, currencySymbol)}</span>
      ),
    },
    {
      key: 'type',
      header: t('Type'),
      render: (_, row) => (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">
          {row.type}
        </span>
      ),
    },
    {
      key: 'limit',
      header: t('Limit'),
      render: (_, row) => (row.limit != null ? row.limit : t('Unlimited')),
    },
    {
      key: 'expiry_date',
      header: t('Expiry Date'),
      render: (_, row) =>
        row.expiry_date ? formatDate(row.expiry_date) : t('No Expiry'),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (_, row) => (
        <span
          className={
            row.status !== false
              ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-950 dark:text-green-200'
              : 'rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800 dark:bg-red-950 dark:text-red-200'
          }
        >
          {row.status !== false ? t('Active') : t('Inactive')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-green-600"
            onClick={() => navigate(paths.couponShow(row.id))}
            title={t('View')}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-blue-600"
            onClick={() => openEdit(row)}
            title={t('Edit')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive"
            onClick={() => setDeleteTarget(row)}
            title={t('Delete')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Coupons')}
        description={t('Create and manage discount coupons for subscriptions')}
        canCreate
        onCreateClick={openCreate}
        isLoading={isLoading}
        error={Boolean(error)}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search coupons...'),
          showFilters: toolbar.showFilters,
          onToggleFilters: toolbar.toggleFilters,
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: toolbar.showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label>{t('Code')}</Label>
                <Input
                  placeholder={t('Filter by code')}
                  value={draftFilters.code}
                  onChange={(e) => setDraftFilters((f) => ({ ...f, code: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('Type')}</Label>
                <Select
                  value={draftFilters.type || 'all'}
                  onValueChange={(v) =>
                    setDraftFilters((f) => ({ ...f, type: v === 'all' ? '' : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All types')}</SelectItem>
                    <SelectItem value="percentage">{t('Percentage')}</SelectItem>
                    <SelectItem value="flat">{t('Flat Amount')}</SelectItem>
                    <SelectItem value="fixed">{t('Fixed Price')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('Status')}</Label>
                <Select
                  value={draftFilters.status === '' ? 'all' : draftFilters.status}
                  onValueChange={(v) =>
                    setDraftFilters((f) => ({
                      ...f,
                      status: v === 'all' ? '' : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All')}</SelectItem>
                    <SelectItem value="1">{t('Active')}</SelectItem>
                    <SelectItem value="0">{t('Inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button size="sm" onClick={applyFilters}>
                  {t('Apply')}
                </Button>
                <Button size="sm" variant="outline" onClick={clearFilters}>
                  {t('Clear')}
                </Button>
              </div>
            </div>
          ) : undefined,
        }}
        pagination={
          pagination
            ? {
                ...pagination,
                onPageChange: (p) => {
                  const next = new URLSearchParams(searchParams)
                  next.set('page', String(p))
                  setSearchParams(next)
                },
              }
            : undefined
        }
      >
        {rows.length > 0 ? (
          <DataTable embedded columns={columns} data={rows} />
        ) : (
          <NoRecordsFound
            icon={Ticket}
            title={t('No coupons found')}
            description={t('Get started by creating your first coupon.')}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            onCreateClick={openCreate}
            createButtonText={t('Create Coupon')}
          />
        )}
      </ModuleListCard>

      <CouponFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        coupon={editingCoupon}
      />

      <ConfirmationDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('Delete Coupon')}
        message={t('Are you sure you want to delete this coupon?')}
        variant="destructive"
        confirmText={t('Delete')}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </>
  )
}
