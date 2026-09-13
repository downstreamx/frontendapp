import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EntitySelect } from '@/components/forms/entity-select'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { formatQuantity } from '@/lib/format-quantity'
import { paths } from '@/lib/paths'
import {
  fetchDistributionInformation,
  fetchDistributionInformationLookups,
  type DistributionInformationSearchType,
} from '../distribution-api'

function DetailGrid({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function RelatedList({
  title: sectionTitle,
  items,
  renderItem,
}: {
  title: string
  items: unknown[]
  renderItem: (row: Record<string, unknown>) => ReactNode
}) {
  if (!items.length) return null
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">{sectionTitle}</h2>
      <ul className="divide-y rounded-md border text-sm">
        {items.map((row) => {
          const record = row as Record<string, unknown>
          return (
            <li key={String(record.id ?? record.transit_number ?? record.delivery_number)} className="px-3 py-2">
              {renderItem(record)}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.filter((item) => item && typeof item === 'object') as Record<string, unknown>[]
}

function driverName(driver: Record<string, unknown> | null): string {
  if (!driver) return '—'
  return [driver.first_name, driver.last_name].filter(Boolean).join(' ') || '—'
}

const SEARCH_TYPES: Array<{ value: DistributionInformationSearchType; labelKey: string }> = [
  { value: 'truck-load', labelKey: 'Truck load' },
  { value: 'loading-schedule', labelKey: 'Loading schedule' },
  { value: 'delivery-confirmation', labelKey: 'Delivery confirmation' },
]

function truckLoadIdFromParams(params: URLSearchParams): string {
  return params.get('truck_load_id') ?? ''
}

function searchTypeFromParams(params: URLSearchParams): DistributionInformationSearchType {
  if (params.get('loading_schedule_id')) return 'loading-schedule'
  if (params.get('delivery_confirmation_id')) return 'delivery-confirmation'
  return 'truck-load'
}

function recordIdFromParams(
  params: URLSearchParams,
  type: DistributionInformationSearchType,
): string {
  if (type === 'loading-schedule') return params.get('loading_schedule_id') ?? ''
  if (type === 'delivery-confirmation') return params.get('delivery_confirmation_id') ?? ''
  return truckLoadIdFromParams(params)
}

function buildSearchParams(type: DistributionInformationSearchType, recordId: string) {
  const next = new URLSearchParams()
  if (!recordId) return next

  if (type === 'loading-schedule') {
    next.set('loading_schedule_id', recordId)
  } else if (type === 'delivery-confirmation') {
    next.set('delivery_confirmation_id', recordId)
  } else {
    next.set('truck_load_id', recordId)
  }

  return next
}

export function DistributionInformationPage() {
  const { t } = useTranslation()
  const [params, setSearchParams] = useSearchParams()

  const activeType = searchTypeFromParams(params)
  const activeRecordId = recordIdFromParams(params, activeType)

  const [searchType, setSearchType] = useState<DistributionInformationSearchType>(activeType)
  const [recordId, setRecordId] = useState(activeRecordId)

  useEffect(() => {
    setSearchType(activeType)
    setRecordId(activeRecordId)
  }, [activeRecordId, activeType])

  const truckLoadId = truckLoadIdFromParams(params)

  const queryKey = {
    truck_load_id: truckLoadId || undefined,
    loading_schedule_id: params.get('loading_schedule_id') ?? undefined,
    delivery_confirmation_id: params.get('delivery_confirmation_id') ?? undefined,
  }

  const hasQuery = Boolean(
    queryKey.truck_load_id || queryKey.loading_schedule_id || queryKey.delivery_confirmation_id,
  )

  const {
    data: lookupOptions = [],
    isLoading: lookupsLoading,
    isError: lookupsError,
  } = useQuery({
    queryKey: ['distribution-information', 'lookups', searchType],
    queryFn: () => fetchDistributionInformationLookups(searchType),
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['distribution-information', queryKey],
    queryFn: () => fetchDistributionInformation(queryKey),
    enabled: hasQuery,
  })

  usePageChrome({
    pageTitle: t('Distribution information'),
    breadcrumbs: [
      { label: t('Depots & Distribution') },
      { label: t('Distribution information') },
    ],
  })

  const truckLoad = asRecord(data?.truck_load)
  const loadingSchedule = asRecord(data?.loading_schedule)
  const sale = asRecord(data?.sale)
  const purchase = asRecord(data?.purchase)
  const truck = asRecord(data?.truck)
  const driver = asRecord(data?.driver)
  const confirmation = asRecord(data?.delivery_confirmation)

  const loadingSchedules = asArray(data?.loading_schedules)
  const deliverySchedules = asArray(data?.delivery_schedules)
  const transits = asArray(data?.transits)
  const confirmations = asArray(data?.delivery_confirmations)
  const shortages = asArray(data?.shortages)
  const overages = asArray(data?.overages)
  const salesAllocations = asArray(data?.sales_allocations)

  const loadNumber = String(
    truckLoad?.load_number ?? '—',
  )
  const truckLoadIdValue =
    typeof truckLoad?.id === 'number' ? truckLoad.id : Number(truckLoad?.id)

  const summaryItems = useMemo(
    () => [
      {
        label: t('Load number'),
        value:
          Number.isFinite(truckLoadIdValue) && loadNumber !== '—' ? (
            <Link
              to={paths.bridging.truckLoadShow(truckLoadIdValue)}
              className="text-primary hover:underline"
            >
              {loadNumber}
            </Link>
          ) : (
            loadNumber
          ),
      },
      {
        label: t('Phase'),
        value: String(truckLoad?.phase ?? truckLoad?.status ?? '—'),
      },
      {
        label: t('Loading schedule'),
        value: String(loadingSchedule?.schedule_number ?? '—'),
      },
      {
        label: salesAllocations.length > 1 ? t('Primary sale invoice') : t('Sale invoice'),
        value:
          sale?.id != null && sale?.invoice_number != null ? (
            <Link
              to={`${paths.sales.invoices}/${String(sale.id)}`}
              className="text-primary hover:underline"
            >
              {String(sale.invoice_number)}
            </Link>
          ) : (
            String(sale?.invoice_number ?? '—')
          ),
      },
      { label: t('Purchase invoice'), value: String(purchase?.invoice_number ?? '—') },
      {
        label: t('Truck'),
        value: String(truck?.plate_number ?? '—'),
      },
      {
        label: t('Driver'),
        value: driverName(driver),
      },
      {
        label: t('Destination'),
        value: String(truckLoad?.destination ?? loadingSchedule?.destination ?? '—'),
      },
      {
        label: t('Quantity'),
        value: formatQuantity(
          (truckLoad?.quantity ?? loadingSchedule?.planned_quantity) as string | number | null | undefined,
        ),
      },
      {
        label: t('Assigned qty'),
        value:
          truckLoad?.assigned_qty != null ? formatQuantity(truckLoad.assigned_qty as number | string) : '—',
      },
      {
        label: t('Remaining on truck'),
        value:
          truckLoad?.quantity != null && truckLoad?.assigned_qty != null
            ? formatQuantity(
                Math.max(
                  0,
                  Number(truckLoad.quantity) - Number(truckLoad.assigned_qty),
                ),
              )
            : '—',
      },
    ],
    [loadNumber, truckLoad, truckLoadIdValue, driver, loadingSchedule, purchase, sale, salesAllocations.length, t, truck],
  )

  const confirmationItems = confirmation
    ? [
        {
          label: t('Quantity delivered'),
          value: formatQuantity(confirmation.quantity_delivered as number | string | undefined),
        },
        {
          label: t('Shortage'),
          value: formatQuantity(confirmation.shortage_qty as number | string | undefined),
        },
        { label: t('Delivered at'), value: String(confirmation.delivered_at ?? '—') },
        { label: t('Comment'), value: String(confirmation.comment ?? '—') },
      ]
    : []

  const handleSearch = () => {
    if (!recordId) return
    setSearchParams(buildSearchParams(searchType, recordId))
  }

  const handleRecordChange = (id: string) => {
    setRecordId(id)
    if (id) {
      setSearchParams(buildSearchParams(searchType, id))
    }
  }

  const typeLabel = useMemo(
    () => SEARCH_TYPES.find((item) => item.value === searchType)?.labelKey ?? '',
    [searchType],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Distribution information')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          className="grid gap-4 rounded-md border bg-muted/20 p-4 sm:grid-cols-[180px_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault()
            handleSearch()
          }}
        >
          <div className="space-y-1">
            <Label>{t('Record type')}</Label>
            <Select
              value={searchType}
              onValueChange={(value) => {
                setSearchType(value as DistributionInformationSearchType)
                setRecordId('')
                setSearchParams(new URLSearchParams())
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select type')} />
              </SelectTrigger>
              <SelectContent>
                {SEARCH_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t(typeLabel)}</Label>
            <EntitySelect
              key={searchType}
              value={recordId}
              onValueChange={handleRecordChange}
              options={lookupOptions}
              placeholder={lookupsLoading ? t('Loading…') : t('Select record')}
              disabled={lookupsLoading}
              emptyMessage={
                lookupsError
                  ? t('Could not load records')
                  : t('No records found for this type')
              }
            />
            {!lookupsLoading && !lookupsError && lookupOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t('No {{type}} records yet. Create one first, then return here.', {
                  type: t(typeLabel).toLowerCase(),
                })}
              </p>
            ) : null}
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={!recordId || lookupsLoading}>
              <Search className="mr-2 h-4 w-4" />
              {t('Search')}
            </Button>
          </div>
        </form>

        {!hasQuery ? (
          <p className="text-sm text-muted-foreground">
            {t(
              'Choose a record type and record above to view the full distribution trail (loading, transit, delivery, shortages, and overages).',
            )}
          </p>
        ) : null}
        {isLoading ? <p className="text-sm text-muted-foreground">{t('Loading…')}</p> : null}
        {error ? (
          <p className="text-sm text-destructive">{t('Could not load distribution information.')}</p>
        ) : null}
        {data ? (
          <div className="space-y-6">
            <section className="space-y-2">
              <h2 className="text-sm font-semibold">{t('Overview')}</h2>
              <DetailGrid items={summaryItems} />
            </section>

            {confirmationItems.length ? (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold">{t('Delivery confirmation')}</h2>
                <DetailGrid items={confirmationItems} />
              </section>
            ) : null}

            {salesAllocations.length ? (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold">{t('Sales invoice allocations')}</h2>
                <ul className="divide-y rounded-md border text-sm">
                  {salesAllocations.map((row) => {
                    const invoiceId = row.sales_invoice_id
                    const invoiceNumber = String(row.invoice_number ?? `#${invoiceId}`)
                    const product = row.product as { name?: string } | null
                    return (
                      <li key={String(row.id)} className="flex flex-wrap items-center gap-x-2 px-3 py-2">
                        {invoiceId != null ? (
                          <Link
                            to={`${paths.sales.invoices}/${String(invoiceId)}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {invoiceNumber}
                          </Link>
                        ) : (
                          <span className="font-medium">{invoiceNumber}</span>
                        )}
                        {product?.name ? (
                          <span className="text-muted-foreground">· {product.name}</span>
                        ) : null}
                        <span className="text-muted-foreground">
                          · {formatQuantity(row.quantity as number | string | undefined)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : null}

            <RelatedList
              title={t('Loading schedules')}
              items={loadingSchedules}
              renderItem={(row) => (
                <>
                  <span className="font-medium">
                    {String(row.schedule_number ?? `#${row.id}`)}
                  </span>
                  {row.status ? <span className="text-muted-foreground"> · {String(row.status)}</span> : null}
                  {(row.depot as { name?: string })?.name ? (
                    <span className="text-muted-foreground">
                      {' '}
                      · {(row.depot as { name?: string }).name}
                    </span>
                  ) : null}
                  {row.planned_quantity != null ? (
                    <span className="text-muted-foreground">
                      {' '}
                      · {formatQuantity(row.planned_quantity as number | string)}
                    </span>
                  ) : null}
                </>
              )}
            />

            <RelatedList
              title={t('Delivery schedules')}
              items={deliverySchedules}
              renderItem={(row) => (
                <>
                  <span className="font-medium">
                    {String(row.delivery_number ?? `#${row.id}`)}
                  </span>
                  {row.status ? <span className="text-muted-foreground"> · {String(row.status)}</span> : null}
                  {row.quantity != null ? (
                    <span className="text-muted-foreground">
                      {' '}
                      · {formatQuantity(row.quantity as number | string)}
                    </span>
                  ) : null}
                </>
              )}
            />

            <RelatedList
              title={t('Transits')}
              items={transits}
              renderItem={(row) => (
                <>
                  <span className="font-medium">
                    {String(row.transit_number ?? `#${row.id}`)}
                  </span>
                  {row.status ? <span className="text-muted-foreground"> · {String(row.status)}</span> : null}
                  {(row.from_depot as { name?: string })?.name &&
                  (row.to_depot as { name?: string })?.name ? (
                    <span className="text-muted-foreground">
                      {' '}
                      · {(row.from_depot as { name?: string }).name} →{' '}
                      {(row.to_depot as { name?: string }).name}
                    </span>
                  ) : null}
                </>
              )}
            />

            <RelatedList
              title={t('Delivery confirmations')}
              items={confirmations}
              renderItem={(row) => (
                <>
                  <span className="font-medium">#{String(row.id)}</span>
                  {row.delivered_at ? (
                    <span className="text-muted-foreground"> · {String(row.delivered_at)}</span>
                  ) : null}
                  {row.quantity_delivered != null ? (
                    <span className="text-muted-foreground">
                      {' '}
                      · {t('Delivered')}: {formatQuantity(row.quantity_delivered as number | string)}
                    </span>
                  ) : null}
                </>
              )}
            />

            {shortages.length ? (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold">{t('Shortages')}</h2>
                <ul className="divide-y rounded-md border text-sm">
                  {shortages.map((row) => (
                    <li key={String(row.id)} className="px-3 py-2">
                      {(row.product as { name?: string })?.name ?? t('Shortage')} —{' '}
                      {formatQuantity(
                        (row.shortage_quantity ?? row.actual_quantity) as number | string | undefined,
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {overages.length ? (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold">{t('Overages')}</h2>
                <ul className="divide-y rounded-md border text-sm">
                  {overages.map((row) => (
                    <li key={String(row.id)} className="px-3 py-2">
                      {(row.product as { name?: string })?.name ?? t('Overage')} —{' '}
                      {formatQuantity(
                        (row.overage_quantity ?? row.actual_quantity) as number | string | undefined,
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {!loadingSchedules.length &&
            !deliverySchedules.length &&
            !transits.length &&
            !confirmations.length &&
            !shortages.length &&
            !overages.length &&
            !confirmationItems.length ? (
              <p className="text-sm text-muted-foreground">
                {t('No related distribution activity found for this record yet.')}
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
