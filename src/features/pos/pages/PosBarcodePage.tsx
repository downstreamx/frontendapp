import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Download, Package, Printer, QrCode, Search } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/errors'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EntitySelect } from '@/components/forms/entity-select'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { canManagePosBarcodes } from '@/lib/pos-permissions'
import { paths } from '@/lib/paths'
import { formatCurrency } from '@/utils/helpers'
import { usePosBarcodes } from '../hooks/use-pos-barcodes'
import { posBarcodeValue, type PosBarcodeProduct } from '../pos-barcode-utils'
import { downloadPosBarcodePdf, fetchPosBarcodeMeta, fetchPosBarcodeProducts } from '../pos-api'

const EMPTY_PRODUCTS: PosBarcodeProduct[] = []

export function PosBarcodePage() {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const [depotId, setDepotId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [copiesById, setCopiesById] = useState<Record<number, number>>({})
  const [pdfLoading, setPdfLoading] = useState(false)

  const canManage = canManagePosBarcodes({
    permissions: auth.permissions,
    roles: auth.roles,
    userType: auth.user?.type,
  })

  usePageChrome({
    pageTitle: t('Print Barcode'),
    breadcrumbs: [
      { label: t('POS'), url: paths.pos.index },
      { label: t('Print Barcode') },
    ],
  })

  const metaQuery = useQuery({
    queryKey: ['pos', 'barcode', 'meta'],
    queryFn: fetchPosBarcodeMeta,
  })

  const productsQuery = useQuery({
    queryKey: ['pos', 'barcode', 'products', depotId],
    queryFn: () => fetchPosBarcodeProducts(Number(depotId)),
    enabled: Boolean(depotId),
  })

  const depotOptions = useMemo(
    () => metaQuery.data?.depots.map((d) => ({ id: d.id, label: d.name })) ?? [],
    [metaQuery.data?.depots],
  )
  const products = useMemo(
    () => productsQuery.data ?? EMPTY_PRODUCTS,
    [productsQuery.data],
  )

  const firstDepotId = metaQuery.data?.depots?.[0]?.id

  useEffect(() => {
    if (depotId || firstDepotId == null) return
    setDepotId(String(firstDepotId))
  }, [depotId, firstDepotId])

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q) ||
        String(p.id).includes(q),
    )
  }, [products, searchTerm])

  const barcodeDataUrls = usePosBarcodes(filteredProducts)

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id))

  const printLabels = useMemo(() => {
    const labels: Array<{ product: PosBarcodeProduct; copyIndex: number }> = []
    for (const product of selectedProducts) {
      const copies = Math.min(50, Math.max(1, copiesById[product.id] ?? 1))
      for (let i = 0; i < copies; i++) {
        labels.push({ product, copyIndex: i })
      }
    }
    return labels
  }, [selectedProducts, copiesById])

  const toggleProduct = (productId: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, productId])
      setCopiesById((prev) => ({ ...prev, [productId]: prev[productId] ?? 1 }))
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== productId))
      setCopiesById((prev) => {
        const next = { ...prev }
        delete next[productId]
        return next
      })
    }
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = filteredProducts.map((p) => p.id)
      setSelectedIds(ids)
      const copies: Record<number, number> = {}
      ids.forEach((id) => {
        copies[id] = copiesById[id] ?? 1
      })
      setCopiesById(copies)
    } else {
      setSelectedIds([])
      setCopiesById({})
    }
  }

  const allFilteredSelected =
    filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.includes(p.id))

  const handlePrint = () => {
    if (printLabels.length === 0) return
    window.print()
  }

  const handleDownloadPdf = async () => {
    if (!depotId || selectedProducts.length === 0) return
    setPdfLoading(true)
    try {
      await downloadPosBarcodePdf({
        depot_id: Number(depotId),
        items: selectedProducts.map((p) => ({
          product_id: p.id,
          copies: copiesById[p.id] ?? 1,
        })),
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('Failed to download barcode PDF')))
    } finally {
      setPdfLoading(false)
    }
  }

  const columns: Column<PosBarcodeProduct>[] = [
    {
      key: 'select',
      header: '',
      render: (_, row) => (
        <Checkbox
          checked={selectedIds.includes(row.id)}
          onCheckedChange={(v) => toggleProduct(row.id, v === true)}
          aria-label={t('Select product')}
        />
      ),
    },
    { key: 'name', header: t('Product') },
    {
      key: 'sku',
      header: t('SKU'),
      render: (_, row) => row.sku || posBarcodeValue(row),
    },
    {
      key: 'sale_price',
      header: t('Price'),
      className: 'text-right',
      render: (_, row) => formatCurrency(Number(row.sale_price ?? 0)),
    },
    {
      key: 'barcode',
      header: t('Barcode'),
      render: (_, row) =>
        barcodeDataUrls[row.id] ? (
          <img
            src={barcodeDataUrls[row.id]}
            alt={posBarcodeValue(row)}
            className="h-16 w-40 object-contain"
            style={{ imageRendering: 'crisp-edges' }}
          />
        ) : (
          <span className="text-xs text-muted-foreground">{t('Generating…')}</span>
        ),
    },
    {
      key: 'copies',
      header: t('Copies'),
      className: 'text-center',
      render: (_, row) =>
        selectedIds.includes(row.id) ? (
          <Input
            type="number"
            min={1}
            max={50}
            className="mx-auto h-8 w-16 text-center"
            value={copiesById[row.id] ?? 1}
            onChange={(e) => {
              const n = Math.min(50, Math.max(1, Number(e.target.value) || 1))
              setCopiesById((prev) => ({ ...prev, [row.id]: n }))
            }}
          />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ]

  if (!canManage) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('You do not have permission to manage POS barcodes.')}
      </p>
    )
  }

  return (
    <>
      <div className="space-y-6 print:hidden">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              {t('Product barcode generator')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <div className="space-y-1">
              <Label>{t('Depot')}</Label>
              <EntitySelect
                value={depotId}
                onValueChange={(value) => {
                  setDepotId(value)
                  setSelectedIds([])
                  setCopiesById({})
                  setSearchTerm('')
                }}
                options={depotOptions}
                placeholder={t('Select depot')}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('Search products')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={t('Search by name or SKU…')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!depotId}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 md:col-span-2 lg:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={printLabels.length === 0}
                onClick={handlePrint}
              >
                <Printer className="mr-2 h-4 w-4" />
                {t('Print selected')} ({printLabels.length})
              </Button>
              <Button
                type="button"
                disabled={selectedProducts.length === 0 || pdfLoading}
                onClick={() => void handleDownloadPdf()}
              >
                <Download className="mr-2 h-4 w-4" />
                {pdfLoading ? t('Generating PDF…') : t('Download PDF')} ({selectedProducts.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5" />
              {t('Available products')}
              <Badge variant="secondary">{filteredProducts.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-3">
              {filteredProducts.length > 0 ? (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={allFilteredSelected}
                    onCheckedChange={(v) => toggleSelectAll(v === true)}
                    aria-label={t('Select all')}
                  />
                  {t('Select all')}
                </label>
              ) : null}
              {selectedIds.length > 0 ? (
                <Badge>
                  {selectedIds.length} {t('selected')}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {!depotId ? (
              <p className="text-sm text-muted-foreground">{t('Select a depot to load products.')}</p>
            ) : null}
            {depotId && productsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">{t('Loading products…')}</p>
            ) : null}
            {depotId && !productsQuery.isLoading && filteredProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? t('No products match your search.')
                  : t('No stocked products in this depot. Add inventory to generate barcodes.')}
              </p>
            ) : null}
            {depotId && filteredProducts.length > 0 ? (
              <DataTable columns={columns} data={filteredProducts} />
            ) : null}
          </CardContent>
        </Card>

        {selectedProducts.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Label preview')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {selectedProducts.slice(0, 12).map((product) => (
                  <div
                    key={product.id}
                    className="w-36 rounded border p-2 text-center"
                  >
                    <p className="truncate text-xs font-medium">{product.name}</p>
                    {barcodeDataUrls[product.id] ? (
                      <img
                        src={barcodeDataUrls[product.id]}
                        alt={posBarcodeValue(product)}
                        className="mx-auto my-1 h-14 w-full object-contain"
                      />
                    ) : null}
                    <p className="font-mono text-[10px]">{posBarcodeValue(product)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      ×{copiesById[product.id] ?? 1}
                    </p>
                  </div>
                ))}
                {selectedProducts.length > 12 ? (
                  <p className="self-center text-xs text-muted-foreground">
                    +{selectedProducts.length - 12} {t('more')}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {printLabels.length > 0 ? (
        <div className="hidden print:block">
          <div className="grid grid-cols-3 gap-4 p-4">
            {printLabels.map(({ product, copyIndex }) => (
              <div
                key={`${product.id}-${copyIndex}`}
                className="break-inside-avoid rounded border p-3 text-center"
              >
                <p className="text-sm font-medium">{product.name}</p>
                {barcodeDataUrls[product.id] ? (
                  <img
                    src={barcodeDataUrls[product.id]}
                    alt={posBarcodeValue(product)}
                    className="mx-auto my-2 h-20 w-full max-w-[12rem] object-contain"
                  />
                ) : null}
                <p className="font-mono text-xs tracking-wide">{posBarcodeValue(product)}</p>
                {product.sale_price != null ? (
                  <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(Number(product.sale_price))}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}
