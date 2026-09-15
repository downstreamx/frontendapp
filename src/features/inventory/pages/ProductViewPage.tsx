import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Image, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageSlider } from '@/components/ui/image-slider'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import { usePageChrome } from '@/contexts/page-chrome-context'
import {
  DetailInfoTile,
  DetailSectionHeading,
} from '@/features/shared/components/detail-info-tile'
import {
  getProduct,
  listProductPriceHistory,
  parseProductImages,
  setProductPrice,
} from '../api'
import { SetProductPriceDialog } from '../components/SetProductPriceDialog'
import { paths } from '@/lib/paths'
import { getApiErrorMessage } from '@/lib/errors'
import { formatQuantity } from '@/lib/format-quantity'
import { formatCurrency, formatDate, getImagePath } from '@/utils/helpers'

function InfoTile({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <DetailInfoTile label={label} className={className}>
      {children}
    </DetailInfoTile>
  )
}

export function ProductViewPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: Boolean(id),
  })

  const { data: priceHistory = [], isLoading: priceHistoryLoading } = useQuery({
    queryKey: ['product', id, 'prices'],
    queryFn: () => listProductPriceHistory(id!),
    enabled: Boolean(id),
  })

  const setPriceMutation = useMutation({
    mutationFn: (values: {
      cost_price: number
      selling_price: number
      narration?: string
      effective_at?: string
    }) => setProductPrice(id!, values),
    onSuccess: () => {
      toast.success(t('Price updated.'))
      setPriceDialogOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['product', id] })
      void queryClient.invalidateQueries({ queryKey: ['product', id, 'prices'] })
      void queryClient.invalidateQueries({ queryKey: ['product-service', 'items'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to update price'))),
  })

  usePageChrome({
    pageTitle: t('Item Details'),
    breadcrumbs: [
      { label: t('Items'), url: paths.inventory.products },
      { label: t('Item Details') },
    ],
  })

  if (isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }
  if (error || !product) {
    return <p className="text-sm text-destructive">{t('Product not found.')}</p>
  }

  const unitName =
    product.unit_relation?.unit_name ??
    product.unitRelation?.unit_name ??
    product.unit_relation?.name ??
    product.unitRelation?.name

  const imageUrl = product.image ? getImagePath(product.image) : ''
  const additionalImages = parseProductImages(product.images)
  const depotStocks = product.depot_stocks ?? []
  const taxes = product.taxes ?? []

  return (
    <>
      <Card>
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-xl tracking-tight">
              <Package className="h-5 w-5 text-primary" />
              {product.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setPriceDialogOpen(true)}>
                {t('Set new price')}
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to={paths.inventory.productEdit(product.id)}>{t('Edit')}</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link to={paths.inventory.products}>{t('Back to list')}</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section>
                <DetailSectionHeading>{t('Basic Information')}</DetailSectionHeading>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {product.sku ? (
                    <InfoTile label={t('SKU')}>
                      <p className="text-muted-foreground">{product.sku}</p>
                    </InfoTile>
                  ) : null}
                  <InfoTile label={t('Category')}>
                    <p className="text-muted-foreground">{product.category?.name || '-'}</p>
                  </InfoTile>
                  <InfoTile label={t('Type')}>
                    <p className="text-muted-foreground capitalize">{product.type || '-'}</p>
                  </InfoTile>
                </div>
              </section>

              <section>
                <DetailSectionHeading>{t('Pricing & Inventory')}</DetailSectionHeading>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {product.sale_price != null && Number(product.sale_price) > 0 ? (
                    <InfoTile
                      label={t('Sale Price')}
                      className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-900"
                    >
                      <p className="text-xl font-bold text-green-800 dark:text-green-300">
                        {formatCurrency(Number(product.sale_price))}
                      </p>
                    </InfoTile>
                  ) : null}
                  {product.purchase_price != null && Number(product.purchase_price) > 0 ? (
                    <InfoTile
                      label={t('Purchase Price')}
                      className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900"
                    >
                      <p className="text-xl font-bold text-blue-800 dark:text-blue-300">
                        {formatCurrency(Number(product.purchase_price))}
                      </p>
                    </InfoTile>
                  ) : null}
                  <InfoTile
                    label={t('Balance Quantity')}
                    className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg border border-orange-200 dark:border-orange-900"
                  >
                    <p className="text-xl font-bold text-orange-800 dark:text-orange-300">
                      {formatQuantity(product.balance_qty ?? product.total_quantity)}
                    </p>
                  </InfoTile>
                  <InfoTile label={t('Inventory Value')}>
                    <p className="text-xl font-bold tabular-nums">
                      {formatCurrency(Number(product.inventory_value ?? 0))}
                    </p>
                  </InfoTile>
                </div>
              </section>

              <section>
                <DetailSectionHeading>{t('Inventory Movement Summary')}</DetailSectionHeading>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <InfoTile label={t('Purchased')}>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatQuantity(product.purchased_qty)}
                    </p>
                  </InfoTile>
                  <InfoTile label={t('Sold')}>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatQuantity(product.sold_qty)}
                    </p>
                  </InfoTile>
                  <InfoTile label={t('Distributed')}>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatQuantity(product.distributed_qty)}
                    </p>
                  </InfoTile>
                  <InfoTile label={t('Bridged')}>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatQuantity(product.bridged_qty)}
                    </p>
                  </InfoTile>
                </div>
              </section>

              {depotStocks.length > 0 ? (
                <section>
                  <DetailSectionHeading>{t('Depot Stock')}</DetailSectionHeading>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="space-y-2">
                      {depotStocks.map((stock, index) => (
                        <div
                          key={`${stock.depot_name}-${index}`}
                          className="flex justify-between items-center py-2 border-b last:border-b-0"
                        >
                          <span className="font-medium text-foreground">{stock.depot_name}</span>
                          <span className="text-lg font-semibold tabular-nums">
                            {formatQuantity(stock.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}

              <section>
                <DetailSectionHeading>{t('Price History')}</DetailSectionHeading>
                {priceHistoryLoading ? (
                  <PageContentLoader className="min-h-[8rem] py-6" />
                ) : priceHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('No price history yet.')}</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">{t('Effective date')}</th>
                          <th className="px-4 py-2 text-right font-medium">{t('Purchase Price')}</th>
                          <th className="px-4 py-2 text-right font-medium">{t('Sale Price')}</th>
                          <th className="px-4 py-2 text-left font-medium">{t('Narration')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {priceHistory.map((row) => (
                          <tr key={row.id} className="border-t">
                            <td className="px-4 py-2">{formatDate(row.effective_at)}</td>
                            <td className="px-4 py-2 text-right tabular-nums">
                              {formatCurrency(Number(row.cost_price))}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums">
                              {formatCurrency(Number(row.selling_price))}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">{row.narration || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section>
                <DetailSectionHeading>{t('Additional Details')}</DetailSectionHeading>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoTile label={t('Unit')}>
                    <p className="text-muted-foreground">{unitName || '-'}</p>
                  </InfoTile>
                  <InfoTile label={t('Taxes')}>
                    {taxes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {taxes.map((tax) => (
                          <Badge key={tax.id} variant="outline" className="text-sm">
                            {tax.tax_name} ({tax.rate}%)
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p>-</p>
                    )}
                  </InfoTile>
                </div>
                {product.description ? (
                  <InfoTile label={t('Description')} className="bg-muted/50 p-4 rounded-lg mt-4">
                    <p className="leading-relaxed whitespace-pre-wrap">{product.description}</p>
                  </InfoTile>
                ) : null}
              </section>

              <section>
                <DetailSectionHeading>{t('Audit')}</DetailSectionHeading>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoTile label={t('Created')}>
                    <p className="text-muted-foreground">
                      {product.created_at ? formatDate(product.created_at) : '—'}
                    </p>
                  </InfoTile>
                  <InfoTile label={t('Last updated')}>
                    <p className="text-muted-foreground">
                      {product.updated_at ? formatDate(product.updated_at) : '—'}
                    </p>
                  </InfoTile>
                </div>
              </section>
            </div>

            <div className="space-y-6 lg:col-span-1">
              <div className="border rounded-lg p-6 shadow-sm bg-card">
                <DetailSectionHeading>{t('Product Image')}</DetailSectionHeading>
                {product.image ? (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg border shadow-md cursor-pointer"
                    onClick={() => window.open(imageUrl, '_blank')}
                  />
                ) : (
                  <div className="w-full h-48 bg-muted rounded-lg border-2 border-dashed flex items-center justify-center">
                    <div className="text-center">
                      <Image className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">{t('No Image Available')}</p>
                    </div>
                  </div>
                )}
              </div>

              {additionalImages.length > 0 ? (
                <div className="border rounded-lg p-6 shadow-sm bg-card">
                  <DetailSectionHeading>{t('Additional Images')}</DetailSectionHeading>
                  <ImageSlider
                    images={additionalImages}
                    className="w-full"
                    aspectRatio="square"
                    showZoom
                    showDownload
                    autoPlay={additionalImages.length > 1}
                    autoPlayInterval={5000}
                    onImageClick={(index) => {
                      window.open(getImagePath(additionalImages[index]!), '_blank')
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <SetProductPriceDialog
        open={priceDialogOpen}
        costPrice={product.purchase_price != null ? Number(product.purchase_price) : undefined}
        sellingPrice={product.sale_price != null ? Number(product.sale_price) : undefined}
        isPending={setPriceMutation.isPending}
        onOpenChange={setPriceDialogOpen}
        onSubmit={(values) => setPriceMutation.mutate(values)}
      />
    </>
  )
}
