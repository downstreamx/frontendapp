import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Layers, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NoRecordsFound } from '@/components/no-records-found'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getApiErrorMessage } from '@/lib/errors'
import { formatQuantity } from '@/lib/format-quantity'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/lib/paths'
import {
  listReorderLevels,
  updateReorderLevel,
  type ReorderLevelRow,
  type ReorderLevelStockStatus,
} from '../api'

function statusBadge(status: ReorderLevelStockStatus, t: (key: string) => string) {
  if (status === 'below_reorder') {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        {t('Below reorder')}
      </Badge>
    )
  }
  if (status === 'ok') {
    return <Badge variant="secondary">{t('OK')}</Badge>
  }
  return <Badge variant="outline">{t('Not set')}</Badge>
}

export function ReorderLevelsIndexPage() {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [depotId, setDepotId] = useState(searchParams.get('depot_id') ?? 'all')
  const [belowOnly, setBelowOnly] = useState(searchParams.get('below_only') === '1')
  const [editRow, setEditRow] = useState<ReorderLevelRow | null>(null)
  const [reorderDraft, setReorderDraft] = useState('')

  const page = searchParams.get('page') ?? '1'

  usePageChrome({
    pageTitle: t('Reorder levels'),
    breadcrumbs: [
      { label: t('Product & Service'), url: paths.inventory.products },
      { label: t('Reorder levels') },
    ],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page,
    }
    if (toolbar.search) params.name = toolbar.search
    if (depotId && depotId !== 'all') params.depot_id = depotId
    if (belowOnly) params.below_only = '1'
    return params
  }, [belowOnly, depotId, page, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['product-service', 'reorder-levels', listParams],
    queryFn: () => listReorderLevels(listParams),
  })

  const rows = data?.rows ?? []
  const depots = data?.depots ?? []
  const pagination = data?.meta
  const schemaPending = data?.schemaPending ?? false

  const mayEdit =
    !schemaPending &&
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-product-service-item')

  const applyFilters = () => {
    toolbar.applySearch()
    const next = new URLSearchParams(searchParams)
    next.set('page', '1')
    if (depotId && depotId !== 'all') next.set('depot_id', depotId)
    else next.delete('depot_id')
    if (belowOnly) next.set('below_only', '1')
    else next.delete('below_only')
    setSearchParams(next)
  }

  const clearFilters = () => {
    setDepotId('all')
    setBelowOnly(false)
    toolbar.setDraftSearch('')
    toolbar.applySearch(true)
    setSearchParams({})
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      updateReorderLevel(editRow!.id, {
        reorder_level: reorderDraft === '' ? null : Number(reorderDraft),
        depot_id: depotId !== 'all' ? Number(depotId) : undefined,
      }),
    onSuccess: () => {
      toast.success(t('Reorder level saved'))
      setEditRow(null)
      void queryClient.invalidateQueries({ queryKey: ['product-service', 'reorder-levels'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'inventory'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save reorder level'))),
  })

  const openEdit = (row: ReorderLevelRow) => {
    setEditRow(row)
    setReorderDraft(row.reorder_level != null ? String(row.reorder_level) : '')
  }

  const columns: Column<ReorderLevelRow>[] = [
    {
      key: 'name',
      header: t('Product'),
      render: (_, row) => (
        <div>
          <Link
            to={paths.inventory.productShow(row.id)}
            className="font-medium text-primary hover:underline"
          >
            {row.name}
          </Link>
          {row.sku ? <p className="text-xs text-muted-foreground">{row.sku}</p> : null}
        </div>
      ),
    },
    {
      key: 'quantity',
      header: t('Current qty'),
      render: (_, row) => formatQuantity(row.quantity),
    },
    {
      key: 'reorder_level',
      header: t('Reorder level'),
      render: (_, row) =>
        row.reorder_level != null ? formatQuantity(row.reorder_level) : '—',
    },
    {
      key: 'stock_status',
      header: t('Status'),
      render: (_, row) => statusBadge(row.stock_status, t),
    },
    ...(mayEdit
      ? [
          {
            key: 'actions',
            header: t('Actions'),
            render: (_: unknown, row: ReorderLevelRow) => (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openEdit(row)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ),
          } satisfies Column<ReorderLevelRow>,
        ]
      : []),
  ]

  const activeFilterCount = [depotId !== 'all', belowOnly].filter(Boolean).length
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

  return (
    <>
      {schemaPending ? (
        <p className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {t(
            'Reorder level columns are not in the database yet. On the API host run: php artisan migrate — then refresh this page to save thresholds.',
          )}
        </p>
      ) : null}
      <ModuleListCard
        title={t('Reorder levels')}
        description={t(
          'Set minimum stock thresholds. Products below their reorder level appear as low stock on the inventory dashboard.',
        )}
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: applyFilters,
          searchPlaceholder: t('Search products...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('Depot')}</Label>
                <Select value={depotId} onValueChange={setDepotId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('All depots (company total)')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All depots (company total)')}</SelectItem>
                    {depots.map((depot) => (
                      <SelectItem key={depot.id} value={String(depot.id)}>
                        {depot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch id="below-only" checked={belowOnly} onCheckedChange={setBelowOnly} />
                <Label htmlFor="below-only">{t('Below reorder only')}</Label>
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
        {rows.length === 0 && !isLoading ? (
          <NoRecordsFound
            icon={Layers}
            title={t('No products found')}
            description={t('Adjust filters or add products to manage reorder levels.')}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            className="h-auto py-8"
          />
        ) : (
          <DataTable embedded columns={columns} data={rows} />
        )}
      </ModuleListCard>

      <Dialog open={Boolean(editRow)} onOpenChange={(open) => !open && setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Set reorder level')}</DialogTitle>
          </DialogHeader>
          {editRow ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {editRow.name}
                {depotId !== 'all'
                  ? ` · ${depots.find((d) => String(d.id) === depotId)?.name ?? t('Depot')}`
                  : ` · ${t('Company-wide total')}`}
              </p>
              <div className="space-y-2">
                <Label htmlFor="reorder-level">{t('Reorder level')}</Label>
                <Input
                  id="reorder-level"
                  type="number"
                  min={0}
                  step="any"
                  value={reorderDraft}
                  onChange={(e) => setReorderDraft(e.target.value)}
                  placeholder={t('Leave empty to clear')}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('Current quantity')}: {formatQuantity(editRow.quantity)}
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditRow(null)}>
              {t('Cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
