import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { paths } from '@/lib/paths'
import { formatDate } from '@/utils/helpers'
import { getCouponDetail, type CouponUsageRow } from '@/features/saas/saas-api'
import { formatCouponDiscount } from '../lib/format-coupon-discount'

export function CouponShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { adminAllSetting } = useAppContext()
  const currencySymbol = adminAllSetting.currencySymbol || '$'
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [userNameFilter, setUserNameFilter] = useState('')
  const [appliedUserName, setAppliedUserName] = useState('')

  const page = Number(searchParams.get('page') ?? '1') || 1

  const usageParams = useMemo(
    () => ({
      per_page: toolbar.perPage,
      page: String(page),
      ...(appliedUserName ? { user_name: appliedUserName } : {}),
    }),
    [appliedUserName, page, toolbar.perPage],
  )

  const detailQuery = useQuery({
    queryKey: ['saas', 'coupons', id, usageParams],
    queryFn: () => getCouponDetail(id!, usageParams),
    enabled: Boolean(id),
  })

  const coupon = detailQuery.data?.coupon
  const usage = detailQuery.data?.usage_records
  const rows = usage?.rows ?? []

  usePageChrome({
    pageTitle: t('Coupon Details'),
    breadcrumbs: [
      { label: t('Coupons'), url: paths.coupons },
      { label: coupon?.name ?? `#${id}` },
    ],
  })

  const applyUsageFilter = () => {
    setAppliedUserName(userNameFilter.trim())
    const next = new URLSearchParams(searchParams)
    next.set('page', '1')
    setSearchParams(next)
  }

  const clearUsageFilter = () => {
    setUserNameFilter('')
    setAppliedUserName('')
    const next = new URLSearchParams(searchParams)
    next.delete('page')
    setSearchParams(next)
  }

  const usageColumns: Column<CouponUsageRow>[] = [
    {
      key: 'user_name',
      header: t('User Name'),
      render: (_, row) => row.user?.name ?? '—',
    },
    {
      key: 'user_email',
      header: t('User Email'),
      render: (_, row) => row.user?.email ?? '—',
    },
    {
      key: 'order_id',
      header: t('Order ID'),
      render: (_, row) => (
        <span className="font-mono text-xs">{row.order_id || '—'}</span>
      ),
    },
    {
      key: 'created_at',
      header: t('Used At'),
      render: (_, row) => (row.created_at ? formatDate(row.created_at) : '—'),
    },
  ]

  if (detailQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  if (!coupon) {
    return <p className="text-sm text-destructive">{t('Coupon not found.')}</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{coupon.name}</h1>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.couponEdit(coupon.id)}>{t('Edit')}</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.coupons}>{t('Back')}</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 font-mono text-base">
            {coupon.code}
            <span
              className={
                coupon.status !== false
                  ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-sans text-green-800'
                  : 'rounded-full bg-red-100 px-2 py-0.5 text-xs font-sans text-red-800'
              }
            >
              {coupon.status !== false ? t('Active') : t('Inactive')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <p>
            <span className="font-medium">{t('Discount')}:</span>{' '}
            {formatCouponDiscount(coupon, currencySymbol)}
          </p>
          <p>
            <span className="font-medium">{t('Type')}:</span>{' '}
            <span className="capitalize">{coupon.type}</span>
          </p>
          <p>
            <span className="font-medium">{t('Usage limit')}:</span>{' '}
            {coupon.limit != null ? coupon.limit : t('Unlimited')}
          </p>
          {coupon.limit_per_user != null ? (
            <p>
              <span className="font-medium">{t('Limit Per User')}:</span> {coupon.limit_per_user}
            </p>
          ) : null}
          {coupon.minimum_spend != null ? (
            <p>
              <span className="font-medium">{t('Minimum Spend')}:</span> {currencySymbol}
              {coupon.minimum_spend}
            </p>
          ) : null}
          {coupon.maximum_spend != null ? (
            <p>
              <span className="font-medium">{t('Maximum Spend')}:</span> {currencySymbol}
              {coupon.maximum_spend}
            </p>
          ) : null}
          <p>
            <span className="font-medium">{t('Expiry')}:</span>{' '}
            {coupon.expiry_date ? formatDate(coupon.expiry_date) : t('No Expiry')}
          </p>
          {coupon.description ? (
            <p className="sm:col-span-2 lg:col-span-3 whitespace-pre-wrap">{coupon.description}</p>
          ) : null}
        </CardContent>
      </Card>

      <ModuleListCard
        title={t('Usage history')}
        description={t('Customers who redeemed this coupon')}
        isLoading={detailQuery.isFetching && !detailQuery.isLoading}
        searchToolbar={{
          searchValue: userNameFilter,
          onSearchChange: setUserNameFilter,
          onSearch: applyUsageFilter,
          searchPlaceholder: t('Search by user name...'),
          showFilters: false,
          onToggleFilters: () => undefined,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
        }}
        pagination={
          usage?.meta
            ? {
                ...usage.meta,
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
          <DataTable embedded columns={usageColumns} data={rows} />
        ) : (
          <NoRecordsFound
            icon={Users}
            title={t('No usage records found')}
            description={t('This coupon has not been used yet.')}
            hasFilters={Boolean(appliedUserName)}
            onClearFilters={clearUsageFilter}
          />
        )}
      </ModuleListCard>
    </div>
  )
}
