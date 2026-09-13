import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
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
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import {
  advanceQuotationStatus,
  createQuotation,
  listQuotationsPaginated,
  quotationAdvanceLabels,
  type Quotation,
} from '../quotations-api'
import { useQuotationMeta } from '../hooks/use-quotation-meta'

type AppliedFilters = {
  customer_id: string
  depot_id: string
  status: string
  quotation_date_from: string
  quotation_date_to: string
}

const defaultFilters: AppliedFilters = {
  customer_id: '',
  depot_id: '',
  status: '',
  quotation_date_from: '',
  quotation_date_to: '',
}

const today = new Date().toISOString().slice(0, 10)

function isOverdue(dueDate: string) {
  return new Date(dueDate) < new Date(new Date().toDateString())
}

export function QuotationsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)
  const [createOpen, setCreateOpen] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [depotId, setDepotId] = useState('')
  const [quotationDate, setQuotationDate] = useState(today)
  const [dueDate, setDueDate] = useState(today)
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('')

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  usePageChrome({
    pageTitle: t('Quotations'),
    breadcrumbs: [{ label: t('Quotation') }, { label: t('Quotations') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.customer_id) params.customer_id = appliedFilters.customer_id
    if (appliedFilters.depot_id) params.depot_id = appliedFilters.depot_id
    if (appliedFilters.status) params.status = appliedFilters.status
    if (appliedFilters.quotation_date_from) params.quotation_date_from = appliedFilters.quotation_date_from
    if (appliedFilters.quotation_date_to) params.quotation_date_to = appliedFilters.quotation_date_to
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['quotation', 'quotations', listParams],
    queryFn: () => listQuotationsPaginated(listParams),
  })

  const { meta, customerOptions, depotOptions, productOptions, isLoading: metaLoading } = useQuotationMeta()

  const createMutation = useMutation({
    mutationFn: createQuotation,
    onSuccess: () => {
      toast.success(t('Quotation created'))
      void queryClient.invalidateQueries({ queryKey: ['quotation', 'quotations'] })
      setCreateOpen(false)
      setCustomerId('')
      setDepotId('')
      setQuotationDate(today)
      setDueDate(today)
      setProductId('')
      setQuantity('1')
      setUnitPrice('')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to create quotation'))),
  })

  const advanceMutation = useMutation({
    mutationFn: advanceQuotationStatus,
    onSuccess: () => {
      toast.success(t('Quotation updated'))
      void queryClient.invalidateQueries({ queryKey: ['quotation', 'quotations'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Could not update quotation status'))),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length
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

  const columns: Column<Quotation>[] = [
    {
      key: 'quotation_number',
      header: t('Quotation number'),
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Link to={paths.quotation.show(row.id)} className="text-primary hover:underline">
            {row.quotation_number ?? `#${row.id}`}
          </Link>
          {(row.revision_number ?? 1) > 1 ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
              v{row.revision_number}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'customer',
      header: t('Customer'),
      render: (_, row) => row.customer?.name ?? '—',
    },
    {
      key: 'quotation_date',
      header: t('Quotation date'),
      sortable: true,
      render: (_, row) => formatDate(row.quotation_date),
    },
    {
      key: 'due_date',
      header: t('Due date'),
      sortable: true,
      render: (_, row) => {
        const overdue = isOverdue(row.due_date)
        return (
          <div>
            <span className={overdue ? 'font-medium text-red-600' : undefined}>{formatDate(row.due_date)}</span>
            {overdue ? <div className="mt-0.5 text-xs font-medium text-red-600">{t('Overdue')}</div> : null}
          </div>
        )
      },
    },
    {
      key: 'total_amount',
      header: t('Total'),
      sortable: true,
      render: (_, row) =>
        row.total_amount != null && row.total_amount !== '' ? formatCurrency(row.total_amount) : '—',
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
      render: (_, row) => {
        const advanceLabel = quotationAdvanceLabels[row.status]
        return (
          <div className="flex items-center gap-1">
            <TableRowActions
              viewPermission="manage-quotations"
              onView={() => navigate(paths.quotation.show(row.id))}
            />
            {advanceLabel ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={advanceMutation.isPending}
                onClick={() => advanceMutation.mutate(row.id)}
              >
                {t(advanceLabel)}
              </Button>
            ) : null}
          </div>
        )
      },
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Quotations')}
        description={t('Create and track sales quotations through draft, sent, and accepted.')}
        canCreate
        onCreateClick={() => navigate(paths.quotation.create)}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search quotations...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
              <div className="space-y-1">
                <Label>{t('Customer')}</Label>
                <Select
                  value={draftFilters.customer_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, customer_id: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All customers')} />
                  </SelectTrigger>
                  <LookupSelectContent
                      leadingItem={<SelectItem value="all">{t('All customers')}</SelectItem>}
                      options={customerOptions}
                    />
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Depot')}</Label>
                <Select
                  value={draftFilters.depot_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, depot_id: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('All depots')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All depots')}</SelectItem>
                    {(meta?.depots ?? []).map((depot) => (
                      <SelectItem key={depot.id} value={String(depot.id)}>
                        {depot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
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
                    {(meta?.statuses ?? []).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('From date')}</Label>
                <Input
                  type="date"
                  value={draftFilters.quotation_date_from}
                  onChange={(e) =>
                    setDraftFilters((f) => ({ ...f, quotation_date_from: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>{t('To date')}</Label>
                <Input
                  type="date"
                  value={draftFilters.quotation_date_to}
                  onChange={(e) => setDraftFilters((f) => ({ ...f, quotation_date_to: e.target.value }))}
                />
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
            onCreateClick={() => navigate(paths.quotation.create)}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Create quotation')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!depotId) {
                toast.error(t('Depot is required'))
                return
              }
              createMutation.mutate({
                customer_id: Number(customerId),
                depot_id: Number(depotId),
                quotation_date: quotationDate,
                due_date: dueDate,
                items: [
                  {
                    product_id: Number(productId),
                    quantity: Number(quantity),
                    unit_price: Number(unitPrice),
                  },
                ],
              })
            }}
          >
            <div className="space-y-1">
              <Label>{t('Customer')}</Label>
              <EntitySelect
                value={customerId}
                onValueChange={setCustomerId}
                options={customerOptions}
                required
                disabled={metaLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Depot')}</Label>
                <EntitySelect
                  value={depotId}
                  onValueChange={setDepotId}
                  options={depotOptions}
                  disabled={metaLoading}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Quotation date')}</Label>
                <Input
                  type="date"
                  value={quotationDate}
                  onChange={(e) => setQuotationDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('Due date')}</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Product')}</Label>
              <EntitySelect
                value={productId}
                onValueChange={setProductId}
                options={productOptions}
                required
                disabled={metaLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t('Quantity')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Unit price')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || metaLoading}>
                {t('Save quotation')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
