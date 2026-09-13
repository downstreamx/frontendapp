import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Package, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NoRecordsFound } from '@/components/no-records-found'
import { Pagination } from '@/components/ui/pagination'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import { SearchInput } from '@/components/ui/search-input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { addProductStock, listProductStock, type StockListRow } from '../api'
import { TableProductAvatarCell } from '@/features/shared/components/table-avatar-cells'
import { paths } from '@/lib/paths'
import { getApiErrorMessage } from '@/lib/errors'
import { hasPermission } from '@/lib/permissions'
import { formatQuantity } from '@/lib/format-quantity'

export function StockIndexPage() {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar({
    defaultPerPage: searchParams.get('per_page') ?? '10',
    initialSearch: searchParams.get('name') ?? searchParams.get('search') ?? '',
  })

  const page = searchParams.get('page') ?? '1'

  const mayManage = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'manage-stock',
  )
  const mayCreate = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'create-stock',
  )

  usePageChrome({
    pageTitle: t('Product Stock'),
    breadcrumbs: [
      { label: t('Product & Service'), url: paths.inventory.products },
      { label: t('Product Stock') },
    ],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page,
    }
    if (toolbar.search) params.name = toolbar.search
    return params
  }, [page, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['product-service', 'stock', listParams],
    queryFn: () => listProductStock(listParams),
  })

  const rows = data?.rows ?? []
  const depots = data?.depots ?? []
  const pagination = data?.meta

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StockListRow | null>(null)
  const [depotId, setDepotId] = useState('')
  const [quantity, setQuantity] = useState('')

  const openModal = (item: StockListRow) => {
    setSelectedItem(item)
    setDepotId('')
    setQuantity('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedItem(null)
    setDepotId('')
    setQuantity('')
  }

  const addMutation = useMutation({
    mutationFn: () =>
      addProductStock({
        product_id: selectedItem!.id,
        depot_id: Number(depotId),
        quantity: Number(quantity),
      }),
    onSuccess: () => {
      toast.success(t('Stock entry created successfully.'))
      void queryClient.invalidateQueries({ queryKey: ['product-service', 'stock'] })
      void queryClient.invalidateQueries({ queryKey: ['product-service', 'items'] })
      closeModal()
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to add stock'))),
  })

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const syncSearchToUrl = (name: string) => {
    const next = new URLSearchParams(searchParams)
    if (name) next.set('name', name)
    else next.delete('name')
    next.delete('search')
    next.set('page', '1')
    setSearchParams(next)
  }

  const columns = useMemo((): Column<StockListRow>[] => {
    const cols: Column<StockListRow>[] = [
      {
        key: 'name',
        header: t('Name'),
        render: (_, row) => (
          <Link to={paths.inventory.productShow(row.id)} className="inline-block hover:underline">
            <TableProductAvatarCell image={row.image} name={row.name} />
          </Link>
        ),
      },
      { key: 'sku', header: t('SKU') },
      {
        key: 'total_quantity',
        header: t('Quantity'),
        render: (value) => formatQuantity(Math.floor(Number(value ?? 0))),
      },
    ]

    if (mayCreate) {
      cols.push({
        key: 'actions',
        header: t('Actions'),
        render: (_value, row) => (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                onClick={() => openModal(row)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('Add Stock')}</p>
            </TooltipContent>
          </Tooltip>
        ),
      })
    }

    return cols
  }, [mayCreate, t])

  if (!mayManage) {
    return <p className="text-sm text-destructive">{t('Permission denied')}</p>
  }

  return (
    <TooltipProvider>
      <Card className="shadow-sm">
        <CardContent className="border-b bg-muted/30 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="max-w-md flex-1">
              <SearchInput
                value={toolbar.draftSearch}
                onChange={toolbar.setDraftSearch}
                onSearch={(cleared) => {
                  const term = cleared ? '' : toolbar.draftSearch.trim()
                  toolbar.applySearch(cleared)
                  syncSearchToUrl(term)
                }}
                placeholder={t('Search by name...')}
                className="w-full"
              />
            </div>
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
          </div>
        </CardContent>

        <CardContent className="p-0">
          {isLoading ? (
            <Skeleton className="m-6 h-48 w-[calc(100%-3rem)]" />
          ) : error ? (
            <p className="p-6 text-sm text-destructive">{t('Failed to load stock.')}</p>
          ) : (
            <div className="max-h-[70vh] w-full overflow-y-auto">
              <div className="min-w-[600px]">
                <DataTable
                  data={rows}
                  columns={columns}
                  className="rounded-none"
                  emptyState={
                    <NoRecordsFound
                      icon={Package}
                      title={t('No stock found')}
                      description={t('No product stock records available.')}
                      hasFilters={Boolean(toolbar.search)}
                      className="h-auto"
                    />
                  }
                />
              </div>
            </div>
          )}
        </CardContent>

        {pagination && pagination.last_page > 1 ? (
          <CardContent className="border-t bg-muted/20 px-4 py-2">
            <Pagination data={pagination} onPageChange={goToPage} />
          </CardContent>
        ) : null}
      </Card>

      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Add Stock')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!depotId || quantity === '') return
              addMutation.mutate()
            }}
          >
            <div className="space-y-2">
              <Label>{t('Product Name')}</Label>
              <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">{selectedItem?.name}</div>
            </div>
            <div className="space-y-2">
              <Label>{t('SKU')}</Label>
              <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                {selectedItem?.sku || '—'}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="depot_id">{t('Depot')}</Label>
              <Select value={depotId} onValueChange={setDepotId} required>
                <SelectTrigger id="depot_id">
                  <SelectValue placeholder={t('Select depot')} />
                </SelectTrigger>
                <SelectContent>
                  {depots.map((depot) => (
                    <SelectItem key={depot.id} value={String(depot.id)}>
                      {depot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">{t('Quantity')}</Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={t('Enter quantity')}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={closeModal}>
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={addMutation.isPending || !depotId || quantity === ''}>
                {addMutation.isPending ? t('Creating...') : t('Create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
