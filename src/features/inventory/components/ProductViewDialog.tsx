import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Image, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { getApiErrorMessage } from '@/lib/errors'
import { formatQuantity } from '@/lib/format-quantity'
import { formatCurrency, formatDate, getImagePath } from '@/utils/helpers'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { getProduct } from '../api'

type Props = {
  productId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (id: number) => void
  onDeleted?: () => void
}

export function ProductViewDialog({ productId, open, onOpenChange, onEdit, onDeleted }: Props) {
  const { t } = useTranslation()
  const { auth } = useAppContext()

  const canEdit = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'edit-product-service-item',
  )

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProduct(productId!),
    enabled: open && productId != null,
  })

  const canDelete =
    hasPermission(
      auth.permissions,
      auth.roles,
      auth.user?.type,
      'delete-product-service-item',
    ) && !product?.is_system

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'product-service.items.destroy',
      defaultMessage: t('Are you sure you want to delete this item?'),
      onSuccess: () => {
        toast.success(t('The item has been deleted.'))
        onOpenChange(false)
        onDeleted?.()
      },
      onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete product'))),
    })

  const unitName =
    product?.unit_relation?.unit_name ??
    product?.unitRelation?.unit_name ??
    product?.unit_relation?.name ??
    product?.unitRelation?.name

  const fields: Array<{ label: string; value: ReactNode }> = product
    ? [
        { label: t('SKU'), value: product.sku ?? '—' },
        { label: t('Category'), value: product.category?.name ?? '—' },
        {
          label: t('Type'),
          value: (
            <Badge variant="secondary" className="capitalize">
              {t(String(product.type ?? 'product'))}
            </Badge>
          ),
        },
        {
          label: t('Status'),
          value: (
            <Badge variant={product.is_active === false ? 'outline' : 'default'}>
              {product.is_active === false ? t('Inactive') : t('Active')}
            </Badge>
          ),
        },
        {
          label: t('Sale Price'),
          value:
            product.sale_price != null ? formatCurrency(Number(product.sale_price)) : '—',
        },
        {
          label: t('Purchase Price'),
          value:
            product.purchase_price != null ? formatCurrency(Number(product.purchase_price)) : '—',
        },
        {
          label: t('Balance'),
          value: formatQuantity(product.balance_qty ?? product.total_quantity),
        },
        {
          label: t('Inventory Value'),
          value: formatCurrency(Number(product.inventory_value ?? 0)),
        },
        { label: t('Purchased'), value: formatQuantity(product.purchased_qty) },
        { label: t('Sold'), value: formatQuantity(product.sold_qty) },
        { label: t('Distributed'), value: formatQuantity(product.distributed_qty) },
        { label: t('Bridged'), value: formatQuantity(product.bridged_qty) },
        { label: t('Unit'), value: unitName ?? '—' },
        {
          label: t('Taxes'),
          value:
            (product.taxes ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {product.taxes!.map((tax) => (
                  <Badge key={tax.id} variant="outline" className="text-xs">
                    {tax.tax_name} ({tax.rate}%)
                  </Badge>
                ))}
              </div>
            ) : (
              '—'
            ),
        },
        {
          label: t('Created'),
          value: product.created_at ? formatDate(product.created_at) : '—',
        },
        {
          label: t('Last updated'),
          value: product.updated_at ? formatDate(product.updated_at) : '—',
        },
      ]
    : []

  const imageUrl = product?.image ? getImagePath(product.image) : null
  const depotStocks = product?.depot_stocks ?? []

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">{t('Loading...')}</p>
          ) : error || !product ? (
            <p className="p-6 text-sm text-destructive">{t('Product not found.')}</p>
          ) : (
            <>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="h-auto w-full object-contain"
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center bg-muted">
                  <div className="text-center">
                    <Image className="mx-auto mb-2 h-16 w-16 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{t('No Image Available')}</p>
                  </div>
                </div>
              )}
              <div className="space-y-4 p-6">
                <DialogHeader className="space-y-1 text-left">
                  <DialogTitle>{product.name}</DialogTitle>
                </DialogHeader>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {fields.map((field) => (
                    <div key={field.label}>
                      <dt className="text-sm font-medium text-muted-foreground">{field.label}</dt>
                      <dd className="mt-1 text-sm">{field.value}</dd>
                    </div>
                  ))}
                </dl>
                {depotStocks.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('Depot Stock')}</p>
                    <div className="mt-2 space-y-2 rounded-md bg-muted/40 p-3">
                      {depotStocks.map((stock, index) => (
                        <div
                          key={`${stock.depot_name}-${index}`}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>{stock.depot_name}</span>
                          <span className="font-semibold tabular-nums">{formatQuantity(stock.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {product.description ? (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('Description')}</p>
                    <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm">
                      {product.description}
                    </p>
                  </div>
                ) : null}
                {product.long_description ? (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('Long Description')}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm">
                      {product.long_description}
                    </p>
                  </div>
                ) : null}
                {canEdit || canDelete ? (
                  <DialogFooter className="gap-2 sm:justify-start">
                    {canEdit && onEdit ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onOpenChange(false)
                          onEdit(product.id)
                        }}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        {t('Edit')}
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          openDeleteDialog(
                            product.id,
                            t('Are you sure you want to delete "{{name}}"? This action cannot be undone.', {
                              name: product.name,
                            }),
                          )
                        }
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        {t('Delete')}
                      </Button>
                    ) : null}
                  </DialogFooter>
                ) : null}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(next) => !next && closeDeleteDialog()}
        title={t('Delete item')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  )
}
