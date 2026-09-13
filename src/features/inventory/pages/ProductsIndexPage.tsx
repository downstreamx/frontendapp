import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Package, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NoRecordsFound } from '@/components/no-records-found'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { TableRowActions } from '@/features/shared/components/TableRowActions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { hasPermission } from '@/lib/permissions'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { listCategories, listProducts, type ProductItem } from '../api'
import { TableProductAvatarCell } from '@/features/shared/components/table-avatar-cells'
import { ProductViewDialog } from '../components/ProductViewDialog'
import { ProductFormPage } from './ProductFormPage'
import { paths } from '@/lib/paths'
import { getApiErrorMessage } from '@/lib/errors'
import { formatQuantity } from '@/lib/format-quantity'
import { formatCurrency } from '@/utils/helpers'
import { useCreateDialogFromQuery } from '@/hooks/use-create-dialog-from-query'

//const ITEM_TYPES = ['product', 'service', 'part'] as const
const ITEM_TYPES = ['product'] as const

function productUnitName(row: ProductItem): string | undefined {
  return row.unit_relation?.unit_name ?? row.unitRelation?.unit_name
}

function formatPriceWithUnit(price: number | string | undefined, unitName?: string) {
  if (price == null || price === '') return '—'
  const formatted = formatCurrency(Number(price))
  return unitName ? `${formatted}/${unitName}` : formatted
}

type AppliedFilters = {
  type: string
  category_id: string
  is_active: string
}

const defaultFilters: AppliedFilters = {
  type: '',
  category_id: '',
  is_active: '',
}

export function ProductsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const mayManageStock = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'manage-stock',
  )
  const canCreate = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'create-product-service-item',
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar({
    defaultPerPage: searchParams.get('per_page') ?? '10',
    initialSearch: searchParams.get('search') ?? '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(() => ({
    type: searchParams.get('type') ?? '',
    category_id: searchParams.get('category_id') ?? '',
    is_active: searchParams.get('is_active') ?? '',
  }))
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(() => ({
    type: searchParams.get('type') ?? '',
    category_id: searchParams.get('category_id') ?? '',
    is_active: searchParams.get('is_active') ?? '',
  }))
  const { open: createOpen, setOpen: setCreateOpen } = useCreateDialogFromQuery(canCreate)
  const openCreate = () => setCreateOpen(true)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingId, setViewingId] = useState<number | null>(null)

  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'asc') as 'asc' | 'desc'
  const page = searchParams.get('page') ?? '1'

  usePageChrome({
    pageTitle: t('Manage Products'),
    breadcrumbs: [{ label: t('Products') }, { label: t('Items') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page,
    }
    if (toolbar.search) params.search = toolbar.search
    if (appliedFilters.type) params.type = appliedFilters.type
    if (appliedFilters.category_id) params.category_id = appliedFilters.category_id
    if (appliedFilters.is_active !== '') params.is_active = appliedFilters.is_active
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['product-service', 'items', listParams],
    queryFn: () => listProducts(listParams),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['product-service', 'categories'],
    queryFn: listCategories,
  })

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'product-service.items.destroy',
      defaultMessage: t('Are you sure you want to delete this item?'),
      onSuccess: () => {
        toast.success(t('The item has been deleted.'))
        void queryClient.invalidateQueries({ queryKey: ['product-service', 'items'] })
        void queryClient.invalidateQueries({ queryKey: ['product'] })
      },
      onError: (error) =>
        toast.error(getApiErrorMessage(error, t('Failed to delete product'))),
    })

  const rows = data?.rows ?? []
  const pagination = data?.meta

  const activeFilterCount = [
    appliedFilters.type,
    appliedFilters.category_id,
    appliedFilters.is_active !== '' ? appliedFilters.is_active : '',
  ].filter(Boolean).length

  const hasFilters = Boolean(toolbar.search || activeFilterCount > 0)

  const setSort = (field: string) => {
    const next = new URLSearchParams(searchParams)
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    next.set('sort', field)
    next.set('direction', direction)
    next.set('page', '1')
    setSearchParams(next)
  }

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const syncFiltersToUrl = (filters: AppliedFilters, search: string) => {
    const next = new URLSearchParams(searchParams)
    if (search) next.set('search', search)
    else next.delete('search')
    if (filters.type) next.set('type', filters.type)
    else next.delete('type')
    if (filters.category_id) next.set('category_id', filters.category_id)
    else next.delete('category_id')
    if (filters.is_active !== '') next.set('is_active', filters.is_active)
    else next.delete('is_active')
    next.set('page', '1')
    setSearchParams(next)
  }

  const openView = (row: ProductItem) => {
    setViewingId(row.id)
    setViewDialogOpen(true)
  }

  const columns: Column<ProductItem>[] = [
    {
      key: 'name',
      header: t('Name'),
      sortable: true,
      render: (_, row) => (
        <button type="button" onClick={() => openView(row)} className="text-left hover:underline">
          <TableProductAvatarCell image={row.image} name={row.name} />
        </button>
      ),
    },
    {
      key: 'sale_price',
      header: t('Sale Price'),
      sortable: true,
      render: (_, row) => formatPriceWithUnit(row.sale_price, productUnitName(row)),
    },
    {
      key: 'purchase_price',
      header: t('Purchase Price'),
      sortable: true,
      render: (_, row) => formatPriceWithUnit(row.purchase_price, productUnitName(row)),
    },
    {
      key: 'total_quantity',
      header: t('Balance'),
      render: (_, row) => formatQuantity(row.balance_qty ?? row.total_quantity),
    },
    {
      key: 'purchased_qty',
      header: t('Purchased'),
      render: (_, row) => formatQuantity(row.purchased_qty),
    },
    {
      key: 'sold_qty',
      header: t('Sold'),
      render: (_, row) => formatQuantity(row.sold_qty),
    },
    {
      key: 'inventory_value',
      header: t('Inventory Value'),
      render: (_, row) => formatCurrency(Number(row.inventory_value ?? 0)),
    },
    {
      key: 'type',
      header: t('Type'),
      sortable: true,
      render: (v) => (
        <Badge variant="secondary" className="capitalize">
          {t(String(v ?? 'product'))}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      header: t('Status'),
      render: (v) => (
        <Badge variant={v === false ? 'outline' : 'default'}>
          {v === false ? t('Inactive') : t('Active')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <TableRowActions
          viewPermission="view-product-service-item"
          editPermission="edit-product-service-item"
          deletePermission="delete-product-service-item"
          onView={() => openView(row)}
          onEdit={() => navigate(paths.inventory.productEdit(row.id))}
          onDelete={
            row.is_system
              ? undefined
              : () =>
                  openDeleteDialog(
                    row.id,
                    t('Are you sure you want to delete "{{name}}"? This action cannot be undone.', {
                      name: row.name,
                    }),
                  )
          }
        />
      ),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Products')}
        actions={
          <div className="flex items-center gap-2">
            {mayManageStock ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(paths.inventory.stock)}
                  >
                    <Package className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('Product Stock')}</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('Create')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        }
        isLoading={isLoading}
        error={!!error}
        searchToolbar={{
          searchValue: toolbar.draftSearch,
          onSearchChange: toolbar.setDraftSearch,
          onSearch: (cleared) => {
            toolbar.applySearch(cleared)
            syncFiltersToUrl(appliedFilters, cleared ? '' : toolbar.draftSearch.trim())
          },
          searchPlaceholder: t('Search products...'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
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
          onApplyFilters: () => {
            setAppliedFilters(draftFilters)
            syncFiltersToUrl(draftFilters, toolbar.search)
            toolbar.applySearch()
          },
          onClearFilters: () => {
            setDraftFilters(defaultFilters)
            setAppliedFilters(defaultFilters)
            toolbar.setDraftSearch('')
            toolbar.applySearch(true)
            setSearchParams({ per_page: toolbar.perPage })
          },
          filtersPanel: (
            <>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Item Type')}</Label>
                <Select
                  value={draftFilters.type || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({ ...prev, type: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by item type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All types')}</SelectItem>
                    {ITEM_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Category')}</Label>
                <Select
                  value={draftFilters.category_id || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      category_id: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by category')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All categories')}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('Status')}</Label>
                <Select
                  value={
                    draftFilters.is_active === ''
                      ? 'all'
                      : draftFilters.is_active === '1'
                        ? 'active'
                        : 'inactive'
                  }
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      is_active:
                        value === 'all' ? '' : value === 'active' ? '1' : '0',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All')}</SelectItem>
                    <SelectItem value="active">{t('Active')}</SelectItem>
                    <SelectItem value="inactive">{t('Inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ),
        }}
        pagination={
          pagination
            ? {
                ...pagination,
                onPageChange: goToPage,
              }
            : undefined
        }
      >
        {rows.length === 0 ? (
          <NoRecordsFound
            icon={Package}
            title={t('No products found')}
            description={t('Get started by creating your first item.')}
            hasFilters={hasFilters}
            onClearFilters={() => {
              setDraftFilters(defaultFilters)
              setAppliedFilters(defaultFilters)
              toolbar.setDraftSearch('')
              toolbar.applySearch(true)
              setSearchParams({ per_page: toolbar.perPage })
            }}
            createPermission="create-product-service-item"
            onCreateClick={openCreate}
            createButtonText={t('Create Product')}
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
      </ModuleListCard>

      <ProductViewDialog
        productId={viewingId}
        open={viewDialogOpen}
        onOpenChange={(open) => {
          setViewDialogOpen(open)
          if (!open) setViewingId(null)
        }}
        onEdit={(id) => navigate(paths.inventory.productEdit(id))}
        onDeleted={() => {
          void queryClient.invalidateQueries({ queryKey: ['product-service', 'items'] })
          void queryClient.invalidateQueries({ queryKey: ['product'] })
        }}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('Create Product')}</DialogTitle>
          </DialogHeader>
          {createOpen ? (
            <ProductFormPage
              presentation="dialog"
              onCancel={() => setCreateOpen(false)}
              onSuccess={() => {
                setCreateOpen(false)
                void queryClient.invalidateQueries({ queryKey: ['product-service', 'items'] })
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete product')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
