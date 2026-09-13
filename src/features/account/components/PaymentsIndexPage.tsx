import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Banknote } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import { PaymentListFilters } from './PaymentListFilters'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { PaymentStatusBadge } from './PaymentStatusBadge'
import {
  listCustomerPayments,
  listSupplierPayments,
  type SupplierPaymentRow,
} from '../payments-api'
import type { CustomerPayment } from '../types'
import { paths } from '@/lib/paths'
import { formatCurrency, formatDate } from '@/utils/helpers'

type PaymentRow = CustomerPayment | SupplierPaymentRow

type Props = {
  kind: 'customer' | 'supplier'
}

export function PaymentsIndexPage({ kind }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const toolbar = useListToolbar()
  const status = searchParams.get('status') ?? ''

  const isCustomer = kind === 'customer'
  const title = isCustomer ? t('Customer payments') : t('Supplier payments')
  const createPath = isCustomer
    ? paths.account.customerPayments.create
    : paths.account.supplierPayments.create
  const showPath = isCustomer
    ? paths.account.customerPayments.show
    : paths.account.supplierPayments.show

  useAccountPageChrome(title, title)

  const params: Record<string, string> = {}
  if (status) params.status = status

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: [isCustomer ? 'customer-payments' : 'supplier-payments', params],
    queryFn: () =>
      isCustomer ? listCustomerPayments(params) : listSupplierPayments(params),
  })

  const partyName = (row: PaymentRow) =>
    isCustomer
      ? (row as CustomerPayment).customer?.name
      : (row as SupplierPaymentRow).supplier?.name

  const columns: Column<PaymentRow>[] = [
    {
      key: 'payment_number',
      header: t('Payment'),
      render: (_, row) => (
        <Link to={showPath(row.id)} className="font-medium text-primary hover:underline">
          {row.payment_number ?? `#${row.id}`}
        </Link>
      ),
    },
    {
      key: 'party',
      header: isCustomer ? t('Customer') : t('Supplier'),
      render: (_, row) => partyName(row) ?? '—',
    },
    {
      key: 'payment_date',
      header: t('Date'),
      render: (_, row) => (row.payment_date ? formatDate(row.payment_date) : '—'),
    },
    {
      key: 'payment_amount',
      header: t('Amount'),
      render: (_, row) => formatCurrency(Number(row.payment_amount)),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (_, row) => <PaymentStatusBadge status={row.status} />,
    },
  ]

  return (
    <ModuleListCard
      title={title}
      canCreate
      onCreateClick={() => navigate(createPath)}
      isLoading={isLoading}
      error={!!error}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: toolbar.applySearch,
        searchPlaceholder: t('Search payments...'),
        showFilters,
        onToggleFilters: () => setShowFilters((open) => !open),
        activeFilterCount: status ? 1 : 0,
        onApplyFilters: () => toolbar.applySearch(),
        onClearFilters: () => {
          const sp = new URLSearchParams(searchParams)
          sp.delete('status')
          setSearchParams(sp)
          toolbar.setDraftSearch('')
          toolbar.applySearch(true)
        },
        filtersPanel: (
          <PaymentListFilters
            value={status}
            onChange={(next) => {
              const sp = new URLSearchParams(searchParams)
              if (next) sp.set('status', next)
              else sp.delete('status')
              setSearchParams(sp)
            }}
          />
        ),
      }}
    >
      <DataTable
        embedded
        data={rows}
        columns={columns}
        emptyState={
          <NoRecordsFound
            icon={Banknote}
            title={t('No payments yet')}
            description={t('Record a payment against outstanding invoices.')}
            onCreateClick={() => navigate(createPath)}
            createButtonText={t('Create')}
            className="h-auto py-8"
          />
        }
      />
    </ModuleListCard>
  )
}
