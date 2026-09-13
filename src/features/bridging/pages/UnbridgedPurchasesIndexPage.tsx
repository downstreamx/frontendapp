import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ShoppingCart } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { paths } from '@/lib/paths'
import { queryKeys } from '@/lib/query-keys'
import { formatQuantity } from '@/lib/format-quantity'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { usePurchasePageChrome } from '@/features/purchase/hooks/use-purchase-page-chrome'
import { listUnbridgedPurchases, type UnbridgedPurchaseRow } from '../bridging-api'
import {
  purchaseBridgingStatusBadgeClass,
  purchaseBridgingStatusLabel,
} from '../bridging-status-ui'

function resolveBridgingStatus(row: UnbridgedPurchaseRow): string {
  return row.bridging_status ?? 'unbridged'
}

export function UnbridgedPurchasesIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar({
    defaultPerPage: searchParams.get('per_page') ?? '10',
    initialSearch: searchParams.get('search') ?? '',
  })
  const page = searchParams.get('page') ?? '1'

  usePurchasePageChrome(t('Unbridged Purchases'), t('Unbridged Purchases'))

  const listParams = useMemo(() => {
    const params: Record<string, string> = { per_page: toolbar.perPage, page }
    if (toolbar.search) params.search = toolbar.search
    return params
  }, [page, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.purchase.unbridged(listParams),
    queryFn: () => listUnbridgedPurchases(listParams),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const columns: Column<UnbridgedPurchaseRow>[] = [
    {
      key: 'invoice_number',
      header: t('Invoice Number'),
      render: (value, row) => (
        <button
          type="button"
          className="text-primary hover:underline"
          onClick={() => navigate(`${paths.purchase.invoices}/${row.id}`)}
        >
          {String(value)}
        </button>
      ),
    },
    {
      key: 'supplier',
      header: t('Supplier'),
      render: (_, row) => row.supplier?.company_name || row.supplier?.name || '—',
    },
    {
      key: 'invoice_date',
      header: t('Invoice Date'),
      render: (value) => formatDate(String(value)),
    },
    {
      key: 'total_bridged_qty',
      header: t('Bridged Qty'),
      render: (_, row) => formatQuantity(row.total_bridged_qty ?? 0),
    },
    {
      key: 'total_balance_qty',
      header: t('Unbridged Qty'),
      render: (_, row) => formatQuantity(row.total_balance_qty ?? 0),
    },
    {
      key: 'bridging_status',
      header: t('Bridging'),
      render: (_, row) => {
        const status = resolveBridgingStatus(row)
        return (
          <span className={purchaseBridgingStatusBadgeClass(status)}>
            {purchaseBridgingStatusLabel(status, t)}
          </span>
        )
      },
    },
    {
      key: 'total_amount',
      header: t('Total'),
      render: (value) => formatCurrency(Number(value)),
    },
  ]

  return (
    <ModuleListCard
      title={t('Unbridged purchases')}
      isLoading={isLoading}
      error={!!error}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: (cleared) => toolbar.applySearch(cleared),
        searchPlaceholder: t('Search invoices...'),
        controls: (
          <PerPageSelector
            value={toolbar.perPage}
            onChange={(value) => {
              toolbar.setPerPage(value)
              const next = new URLSearchParams(searchParams)
              next.set('per_page', value)
              next.set('page', '1')
              setSearchParams(next)
            }}
          />
        ),
      }}
      pagination={pagination ? { ...pagination, onPageChange: goToPage } : undefined}
    >
      {rows.length === 0 ? (
        <NoRecordsFound
          icon={ShoppingCart}
          title={t('No unbridged purchases')}
          description={t('Posted purchase invoices with remaining bridging balance appear here.')}
          hasFilters={Boolean(toolbar.search)}
          onClearFilters={() => toolbar.applySearch(true)}
          className="h-auto py-8"
        />
      ) : (
        <DataTable embedded data={rows} columns={columns} />
      )}
    </ModuleListCard>
  )
}
