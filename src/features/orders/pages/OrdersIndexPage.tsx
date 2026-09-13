import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, ShoppingCart } from 'lucide-react'
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
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { paths } from '@/lib/paths'
import { listOrdersPaginated, type OrderRow } from '@/features/saas/saas-api'

type AppliedFilters = {
  payment_status: string
  payment_type: string
}

const defaultFilters: AppliedFilters = { payment_status: '', payment_type: '' }

const PAYMENT_STATUSES = ['pending', 'succeeded', 'failed', 'cancelled'] as const

export function OrdersIndexPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const isSuperAdmin = auth.user?.type === 'superadmin'

  usePageChrome({
    pageTitle: t('Subscription orders'),
    breadcrumbs: [{ label: t('Subscription') }, { label: t('Orders') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.payment_status) params.payment_status = appliedFilters.payment_status
    if (appliedFilters.payment_type) params.payment_type = appliedFilters.payment_type
    return params
  }, [appliedFilters, page, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['saas', 'orders', listParams],
    queryFn: () => listOrdersPaginated(listParams),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

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

  const formatMoney = (row: OrderRow) => {
    if (row.price == null) return '—'
    const amount = typeof row.price === 'string' ? row.price : String(row.price)
    return `${row.currency ?? 'USD'} ${amount}`
  }

  const columns: Column<OrderRow>[] = [
    {
      key: 'order_id',
      header: t('Order'),
      render: (_, row) => (
        <Link to={paths.orderShow(row.id)} className="font-medium text-primary hover:underline">
          {row.order_id}
        </Link>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            key: 'customer',
            header: t('Customer'),
            render: (_: unknown, row: OrderRow) => (
              <div>
                <p className="font-medium">{row.user?.name ?? row.name ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{row.user?.email ?? row.email ?? ''}</p>
              </div>
            ),
          } as Column<OrderRow>,
        ]
      : [
          {
            key: 'name',
            header: t('Name'),
            render: (_: unknown, row: OrderRow) => row.name ?? '—',
          } as Column<OrderRow>,
          {
            key: 'email',
            header: t('Email'),
            render: (_: unknown, row: OrderRow) => row.email ?? '—',
          } as Column<OrderRow>,
        ]),
    {
      key: 'plan',
      header: t('Plan'),
      render: (_, row) => row.plan?.name ?? row.plan_name ?? '—',
    },
    {
      key: 'price',
      header: t('Amount'),
      render: (_, row) => formatMoney(row),
    },
    {
      key: 'payment_type',
      header: t('Payment'),
      render: (_, row) => row.payment_type ?? '—',
    },
    {
      key: 'payment_status',
      header: t('Status'),
      render: (_, row) =>
        row.payment_status ? (
          <FleetStatusBadge status={row.payment_status} label={row.payment_status} />
        ) : (
          '—'
        ),
    },
    {
      key: 'created_at',
      header: t('Date'),
      render: (_, row) =>
        row.created_at ? new Date(row.created_at).toLocaleDateString() : '—',
    },
  ]

  const headerActions = (
    <Button size="sm" onClick={() => navigate(paths.orderCreate)}>
      <Plus className="h-4 w-4 sm:mr-1" />
      <span className="hidden sm:inline">{t('New order')}</span>
    </Button>
  )

  return (
    <ModuleListCard
      title={t('Subscription orders')}
      description={
        isSuperAdmin
          ? t('All subscription orders across companies on your platform.')
          : t('Orders for your subscription and billing history.')
      }
      actions={headerActions}
      isLoading={isLoading}
      error={!!error}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: applyFilters,
        searchPlaceholder: t('Search orders, email, plan…'),
        showFilters,
        onToggleFilters: () => setShowFilters((v) => !v),
        activeFilterCount,
        controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
        onApplyFilters: applyFilters,
        onClearFilters: clearFilters,
        filtersPanel: showFilters ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label>{t('Payment status')}</Label>
              <Select
                value={draftFilters.payment_status || 'all'}
                onValueChange={(value) =>
                  setDraftFilters((f) => ({ ...f, payment_status: value === 'all' ? '' : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('All statuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All statuses')}</SelectItem>
                  {PAYMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('Payment type')}</Label>
              <Select
                value={draftFilters.payment_type || 'all'}
                onValueChange={(value) =>
                  setDraftFilters((f) => ({ ...f, payment_type: value === 'all' ? '' : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('All types')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All types')}</SelectItem>
                  <SelectItem value="bank_transfer">{t('Bank transfer')}</SelectItem>
                  <SelectItem value="Bank Transfer">{t('Bank Transfer')}</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="button" size="sm" onClick={applyFilters}>
                {t('Apply')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
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
      {rows.length === 0 ? (
        <NoRecordsFound
          icon={ShoppingCart}
          title={t('No orders found')}
          description={t('Orders appear when companies subscribe or you create one manually.')}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          onCreateClick={() => navigate(paths.orderCreate)}
          createButtonText={t('New order')}
          className="h-auto py-8"
        />
      ) : (
        <DataTable embedded columns={columns} data={rows} />
      )}
    </ModuleListCard>
  )
}
