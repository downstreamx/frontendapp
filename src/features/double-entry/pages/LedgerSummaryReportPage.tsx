import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FileText, Printer } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { NoRecordsFound } from '@/components/no-records-found'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/lib/paths'
import { fetchLedgerSummary, fetchLedgerSummaryMeta } from '../double-entry-api'
import type { LedgerSummaryRow } from '../double-entry-api'
import { useDoubleEntryPageChrome } from '../hooks/use-double-entry-page-chrome'
import { defaultReportDateRange } from '../utils/default-date-range'
import { formatCurrency, formatDate } from '@/utils/helpers'

export function LedgerSummaryReportPage() {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  useDoubleEntryPageChrome(t('Ledger summary'), t('Reports'))

  const canPrint = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'print-ledger-summary',
  )

  const defaults = defaultReportDateRange()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  const fromDate = searchParams.get('from_date') ?? defaults.from
  const toDate = searchParams.get('to_date') ?? defaults.to
  const accountId = searchParams.get('account_id') ?? ''
  const search = searchParams.get('search') ?? ''
  const [draftSearch, setDraftSearch] = useState(search)
  const perPage = searchParams.get('per_page') ?? '10'
  const page = Number(searchParams.get('page') ?? '1')
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const metaQuery = useQuery({
    queryKey: ['ledger-summary-meta'],
    queryFn: fetchLedgerSummaryMeta,
  })

  const reportQuery = useQuery({
    queryKey: [
      'ledger-summary',
      fromDate,
      toDate,
      accountId,
      search,
      perPage,
      page,
      sortField,
      sortDirection,
    ],
    queryFn: () =>
      fetchLedgerSummary({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        account_id: accountId || undefined,
        search: search || undefined,
        sort: sortField || undefined,
        direction: sortDirection,
        page,
        per_page: Number(perPage),
      }),
  })

  const { rows = [], lastPage = 1 } = reportQuery.data ?? {}
  const accounts = metaQuery.data?.accounts ?? []

  const activeFilterCount = [accountId, fromDate, toDate].filter(Boolean).length

  const updateParams = (updates: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') next.delete(key)
        else next.set(key, value)
      }
      return next
    })
  }

  const applySearch = () => {
    updateParams({
      search: draftSearch.trim() || null,
      page: '1',
    })
  }

  const clearFilters = () => {
    setDraftSearch('')
    setSearchParams({ per_page: perPage })
  }

  const setSort = (field: string) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    updateParams({ sort: field, direction, page: '1' })
  }

  const openPrint = () => {
    const qs = new URLSearchParams()
    if (fromDate) qs.set('from_date', fromDate)
    if (toDate) qs.set('to_date', toDate)
    if (accountId) qs.set('account_id', accountId)
    if (search) qs.set('search', search)
    if (sortField) qs.set('sort', sortField)
    if (sortDirection) qs.set('direction', sortDirection)
    qs.set('print', '1')
    window.open(`${paths.doubleEntry.ledgerSummaryPrint}?${qs.toString()}`, '_blank')
  }

  const columns: Column<LedgerSummaryRow>[] = useMemo(
    () => [
      {
        key: 'journal_date',
        header: t('Date'),
        sortable: true,
        render: (_, row) => formatDate(row.journal_date),
      },
      {
        key: 'account_code',
        header: t('Account Code'),
        sortable: true,
        render: (_, row) => row.account_code,
      },
      {
        key: 'account_name',
        header: t('Account Name'),
        sortable: true,
        render: (_, row) => row.account_name,
      },
      {
        key: 'reference_type',
        header: t('Reference'),
        render: (value) => String(value ?? '—'),
      },
      {
        key: 'description',
        header: t('Description'),
        render: (_, row) => row.description ?? row.journal_description ?? '—',
      },
      {
        key: 'debit_amount',
        header: t('Debit'),
        render: (_, row) => {
          const amount = Number(row.debit_amount ?? 0)
          return amount > 0 ? formatCurrency(amount) : '—'
        },
      },
      {
        key: 'credit_amount',
        header: t('Credit'),
        render: (_, row) => {
          const amount = Number(row.credit_amount ?? 0)
          return amount > 0 ? formatCurrency(amount) : '—'
        },
      },
    ],
    [t],
  )

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle>{t('Ledger summary')}</CardTitle>
        <CardDescription>{t('Posted journal lines by account and date.')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-0 p-0">
        <div className="flex flex-col gap-4 border-b bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap items-end gap-2">
            <div className="min-w-[200px] flex-1">
              <Label htmlFor="ledger-search" className="sr-only">
                {t('Search')}
              </Label>
              <Input
                id="ledger-search"
                placeholder={t('Search ledger entries...')}
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applySearch()
                }}
              />
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={applySearch}>
              {t('Search')}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PerPageSelector
              value={perPage}
              onChange={(value) => updateParams({ per_page: value, page: '1' })}
            />
            <Button
              type="button"
              variant={showFilters ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowFilters((open) => !open)}
            >
              {t('Filters')}
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid gap-4 border-b bg-muted/20 p-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>{t('Account')}</Label>
              <Select
                value={accountId || 'all'}
                onValueChange={(value) =>
                  updateParams({ account_id: value === 'all' ? null : value, page: '1' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('All Accounts')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All Accounts')}</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {account.account_code} — {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="from_date">{t('From Date')}</Label>
              <Input
                id="from_date"
                type="date"
                value={fromDate}
                onChange={(e) => updateParams({ from_date: e.target.value, page: '1' })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to_date">{t('To Date')}</Label>
              <Input
                id="to_date"
                type="date"
                value={toDate}
                onChange={(e) => updateParams({ to_date: e.target.value, page: '1' })}
              />
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <Button type="button" size="sm" onClick={() => reportQuery.refetch()}>
                {t('Apply')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                {t('Clear')}
              </Button>
              {canPrint ? (
                <Button type="button" variant="outline" size="sm" onClick={openPrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  {t('Print')}
                </Button>
              ) : null}
            </div>
          </div>
        )}

        <div className="p-0">
          {rows.length === 0 && !reportQuery.isLoading ? (
            <NoRecordsFound
              icon={FileText}
              title={t('No ledger entries found')}
              description={t('No journal entries found for the selected filters.')}
              hasFilters={Boolean(search || accountId || fromDate || toDate)}
              onClearFilters={clearFilters}
              className="h-auto py-8"
            />
          ) : (
            <DataTable
              embedded
              data={rows}
              columns={columns}
              onSort={setSort}
              sortKey={sortField}
              sortDirection={sortDirection}
            />
          )}
        </div>

        {lastPage > 1 && (
          <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              {t('Previous')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t('Page')} {page} / {lastPage}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= lastPage}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              {t('Next')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
