import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Barcode,
  CreditCard,
  Home,
  Image,
  Package,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EntitySelect } from '@/components/forms/entity-select'
import { toCustomerLookupOptions } from '@/features/_shared/operations-lookups'
import { useAppContext } from '@/contexts/app-context'
import { getActiveSettings } from '@/lib/page-props-bridge'
import { canCreatePos } from '@/lib/pos-permissions'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { formatCurrency, formatDate, getImagePath } from '@/utils/helpers'
import {
  createPosSale,
  fetchPosTerminalMeta,
  fetchPosTerminalProducts,
  type PosTerminalProduct,
} from '../pos-api'
import { PosReceiptModal, type CompletedPosSale } from '../components/PosReceiptModal'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import {
  cartSubtotal,
  cartTaxAmount,
  cartTaxBreakdown,
  cartTotal,
  type PosCartItem,
} from '../pos-terminal-utils'

const DEPOT_STORAGE_KEY = 'pos_selected_depot'
const BANK_STORAGE_KEY = 'pos_selected_bank_account'
const EMPTY_TERMINAL_PRODUCTS: PosTerminalProduct[] = []

export function PosTerminalPage() {
  const { t } = useTranslation()
  const appContext = useAppContext()
  const { auth } = appContext
  const settings = getActiveSettings(appContext)

  const canCreate = canCreatePos({
    permissions: auth.permissions,
    roles: auth.roles,
    userType: auth.user?.type,
  })

  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedDepot, setSelectedDepot] = useState(() => sessionStorage.getItem(DEPOT_STORAGE_KEY) ?? '')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [skuInput, setSkuInput] = useState('')
  const [cart, setCart] = useState<PosCartItem[]>([])
  const [qtyDrafts, setQtyDrafts] = useState<Record<number, string>>({})
  const [discountAmount, setDiscountAmount] = useState(0)
  const [bankAccountId, setBankAccountId] = useState(
    () => sessionStorage.getItem(BANK_STORAGE_KEY) ?? '',
  )
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [completedSale, setCompletedSale] = useState<CompletedPosSale | null>(null)

  const metaQuery = useQuery({
    queryKey: ['pos', 'terminal', 'meta'],
    queryFn: fetchPosTerminalMeta,
    enabled: canCreate,
  })

  const customerOptions = useMemo(
    () => toCustomerLookupOptions(metaQuery.data?.customers ?? []),
    [metaQuery.data?.customers],
  )

  const categoryId =
    selectedCategory !== 'all' ? Number(selectedCategory) : undefined

  const productsQuery = useQuery({
    queryKey: ['pos', 'terminal', 'products', selectedDepot, categoryId],
    queryFn: () =>
      fetchPosTerminalProducts({
        depot_id: Number(selectedDepot),
        category_id: categoryId,
      }),
    enabled: canCreate && Boolean(selectedDepot),
  })

  const products = useMemo(
    () => productsQuery.data ?? EMPTY_TERMINAL_PRODUCTS,
    [productsQuery.data],
  )

  const firstDepotId = metaQuery.data?.depots?.[0]?.id

  useEffect(() => {
    if (selectedDepot || firstDepotId == null) return
    const id = String(firstDepotId)
    setSelectedDepot(id)
    sessionStorage.setItem(DEPOT_STORAGE_KEY, id)
  }, [selectedDepot, firstDepotId])

  useEffect(() => {
    if (!bankAccountId && metaQuery.data?.bank_accounts?.length) {
      const id = String(metaQuery.data.bank_accounts[0].id)
      setBankAccountId(id)
      sessionStorage.setItem(BANK_STORAGE_KEY, id)
    }
  }, [bankAccountId, metaQuery.data?.bank_accounts])

  useEffect(() => {
    setCart([])
    setQtyDrafts({})
  }, [selectedDepot])

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products
    const q = searchTerm.trim().toLowerCase()
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q),
    )
  }, [products, searchTerm])

  const addToCart = (product: PosTerminalProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item,
        )
      }
      if (product.stock <= 0) return prev
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (id: number, quantity: number) => {
    setQtyDrafts((prev) => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })

    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id))
      return
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.min(quantity, item.stock) } : item)),
    )
  }

  const getQtyDisplay = (item: PosCartItem) => qtyDrafts[item.id] ?? String(item.quantity)

  const handleQtyInputChange = (id: number, value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) return
    setQtyDrafts((prev) => ({ ...prev, [id]: value }))
  }

  const commitQtyInput = (item: PosCartItem) => {
    const raw = qtyDrafts[item.id]
    if (raw === undefined) return

    if (raw === '') {
      updateQuantity(item.id, item.quantity)
      return
    }

    const parsed = Number.parseInt(raw, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      updateQuantity(item.id, 0)
      return
    }

    updateQuantity(item.id, parsed)
  }

  const handleSkuInput = (value: string) => {
    setSkuInput(value)
    if (!value.trim() || !selectedDepot) return
    const match = products.find((p) => p.sku === value.trim())
    if (match) {
      addToCart(match)
      setSkuInput('')
    }
  }

  const subtotal = cartSubtotal(cart)
  const taxAmount = cartTaxAmount(cart)
  const taxBreakdown = cartTaxBreakdown(cart)
  const total = cartTotal(cart, discountAmount)

  const checkoutMutation = useMutation({
    mutationFn: () =>
      createPosSale({
        pos_date: new Date().toISOString().slice(0, 10),
        depot_id: Number(selectedDepot),
        customer_id: selectedCustomer ? Number(selectedCustomer) : undefined,
        bank_account_id: bankAccountId ? Number(bankAccountId) : undefined,
        status: 'completed',
        discount: discountAmount,
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      }),
    onSuccess: (sale) => {
      const customer = metaQuery.data?.customers.find(
        (c) => String(c.id) === selectedCustomer,
      )
      const depot = metaQuery.data?.depots.find((d) => String(d.id) === selectedDepot)
      setCompletedSale({
        id: sale.id,
        sale_number: sale.sale_number ?? `#${sale.id}`,
        items: [...cart],
        subtotal,
        tax: taxAmount,
        discount: discountAmount,
        total,
        customer: customer ? { name: customer.name } : null,
        depot: depot ? { name: depot.name } : null,
      })
      setShowPaymentModal(false)
      setShowReceiptModal(true)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Payment failed'))),
  })

  const handlePaymentComplete = () => {
    setShowReceiptModal(false)
    setCart([])
    setQtyDrafts({})
    setSelectedCustomer('')
    setDiscountAmount(0)
    setCompletedSale(null)
  }

  if (!canCreate) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('You do not have permission to create POS sales.')}
      </p>
    )
  }

  if (metaQuery.isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  const bankOptions =
    metaQuery.data?.bank_accounts.map((b) => ({
      id: b.id,
      label: b.bank_name ? `${b.account_name} (${b.bank_name})` : b.account_name,
    })) ?? []

  return (
    <div className="-mx-4 -mt-2 flex h-[calc(100vh-3.5rem)] flex-col bg-muted/30 md:-mx-0">
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 sm:gap-4 sm:p-4 lg:flex-row">
        <Card className="order-2 flex min-h-0 min-w-0 flex-1 flex-col lg:order-1">
          <CardContent className="flex h-full flex-col overflow-hidden p-3 sm:p-6">
            <div className="mb-4 flex-shrink-0 space-y-3">
              <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
                <Button asChild variant="outline" size="icon" className="h-10 w-10 shrink-0">
                  <Link to={paths.pos.index} title={t('POS Dashboard')}>
                    <Home className="h-4 w-4" />
                  </Link>
                </Button>

                <div className="relative min-w-0 flex-1 lg:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-10 pl-9"
                    placeholder={t('Search products…')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <EntitySelect
                  value={selectedCustomer}
                  onValueChange={setSelectedCustomer}
                  options={customerOptions}
                  placeholder={t('Walk-in Customer')}
                  disabled={customerOptions.length === 0}
                />

                <Select
                  value={selectedDepot}
                  onValueChange={(value) => {
                    setSelectedDepot(value)
                    sessionStorage.setItem(DEPOT_STORAGE_KEY, value)
                  }}
                >
                  <SelectTrigger className="h-10 w-full lg:w-64">
                    <SelectValue placeholder={t('Select depot')} />
                  </SelectTrigger>
                  <SelectContent>
                    {metaQuery.data?.depots.map((depot) => (
                      <SelectItem key={depot.id} value={String(depot.id)}>
                        {depot.name}
                        {depot.address ? ` — ${depot.address}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative w-full lg:w-56">
                  <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-10 pl-9"
                    placeholder={t('Add to cart by SKU')}
                    value={skuInput}
                    onChange={(e) => handleSkuInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto">
                <Button
                  size="sm"
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                >
                  {t('All')}
                </Button>
                {metaQuery.data?.categories.map((category) => (
                  <Button
                    key={category.id}
                    size="sm"
                    variant={selectedCategory === String(category.id) ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(String(category.id))}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {!selectedDepot ? (
                <p className="py-12 text-center text-muted-foreground">{t('Select a depot')}</p>
              ) : productsQuery.isLoading ? (
                <p className="py-12 text-center text-muted-foreground">{t('Loading products…')}</p>
              ) : filteredProducts.length === 0 ? (
                <div className="py-12 text-center">
                  <Package className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">{t('No products available')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer transition-shadow hover:shadow-md"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="mb-2 flex aspect-square items-center justify-center rounded bg-muted">
                          {product.image ? (
                            <img
                              src={getImagePath(product.image)}
                              alt={product.name}
                              className="h-full w-full rounded object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <Image className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <h3 className="truncate font-medium">{product.name}</h3>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-bold text-green-600">
                            {formatCurrency(product.price)}
                          </span>
                          <Badge variant={product.stock > 0 ? 'secondary' : 'destructive'}>
                            {Math.floor(product.stock)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="order-1 flex max-h-[45vh] w-full shrink-0 flex-col lg:order-2 lg:max-h-none lg:w-80 xl:w-96">
          <CardContent className="flex-shrink-0 border-b p-3 sm:p-4">
            {bankOptions.length > 0 ? (
              <div className="mb-3 space-y-1">
                <Label className="text-xs">{t('Bank account')}</Label>
                <EntitySelect
                  value={bankAccountId}
                  onValueChange={(value) => {
                    setBankAccountId(value)
                    sessionStorage.setItem(BANK_STORAGE_KEY, value)
                  }}
                  options={bankOptions}
                  placeholder={t('Select bank account')}
                />
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-bold">
                <ShoppingCart className="h-5 w-5" />
                {t('Shopping Cart')}
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{cart.length}</Badge>
                {cart.length > 0 ? (
                  <button
                    type="button"
                    className="text-destructive hover:text-destructive/80"
                    onClick={() => {
                      setCart([])
                      setQtyDrafts({})
                    }}
                    aria-label={t('Clear cart')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </CardContent>

          <CardContent className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <ShoppingCart className="mx-auto mb-2 h-10 w-10 opacity-40" />
                {t('Your cart is empty')}
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="rounded-lg border bg-muted/20 p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-green-600">
                          {formatCurrency(item.price)} {t('each')}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive"
                        onClick={() => updateQuantity(item.id, 0)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-col gap-1">
                        <Label htmlFor={`cart-qty-${item.id}`} className="text-xs text-muted-foreground">
                          {t('Qty')}
                        </Label>
                        <Input
                          id={`cart-qty-${item.id}`}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={getQtyDisplay(item)}
                          onChange={(e) => handleQtyInputChange(item.id, e.target.value)}
                          onBlur={() => commitQtyInput(item)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur()
                            }
                          }}
                          className="h-10 w-32 min-w-[8rem] max-w-full text-center text-base font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          aria-label={t('Quantity')}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('Max')}: {item.stock.toLocaleString()}
                        </p>
                      </div>
                      <span className="shrink-0 font-bold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {cart.length > 0 ? (
            <CardContent className="flex-shrink-0 space-y-2 border-t p-3 sm:p-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('Subtotal')}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {taxBreakdown.length > 0
                ? taxBreakdown.map((tax) => (
                    <div key={tax.name} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{tax.name}</span>
                      <span>{formatCurrency(tax.amount)}</span>
                    </div>
                  ))
                : (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('Tax')}</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('Discount')}</span>
                <Input
                  type="number"
                  min={0}
                  max={subtotal + taxAmount}
                  className="h-7 w-20 text-right text-xs"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                />
              </div>
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>{t('Total')}</span>
                <span className="text-green-600">{formatCurrency(total)}</span>
              </div>
              <Button
                className="w-full"
                disabled={!selectedDepot || cart.length === 0}
                onClick={() => setShowPaymentModal(true)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {t('Checkout')}
              </Button>
            </CardContent>
          ) : null}
        </Card>
      </div>

      <Dialog
        open={showPaymentModal}
        onOpenChange={(open) => !checkoutMutation.isPending && setShowPaymentModal(open)}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('Process Payment')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p>
                  <span className="text-muted-foreground">{t('Date')}: </span>
                  {formatDate(new Date().toISOString())}
                </p>
                <p>
                  <span className="text-muted-foreground">{t('Customer')}: </span>
                  {selectedCustomer
                    ? metaQuery.data?.customers.find((c) => String(c.id) === selectedCustomer)?.name
                    : t('Walk-in Customer')}
                </p>
                <p>
                  <span className="text-muted-foreground">{t('Depot')}: </span>
                  {metaQuery.data?.depots.find((d) => String(d.id) === selectedDepot)?.name}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{settings.company_name || t('Company')}</p>
                {settings.company_address ? (
                  <p className="text-muted-foreground">{settings.company_address}</p>
                ) : null}
              </div>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[500px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left">{t('Product')}</th>
                    <th className="p-2 text-center">{t('Qty')}</th>
                    <th className="p-2 text-right">{t('Price')}</th>
                    <th className="p-2 text-right">{t('Total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => {
                    const lineSubtotal = item.price * item.quantity
                    const lineTax = (item.taxes ?? []).reduce(
                      (sum, tax) => sum + (lineSubtotal * tax.rate) / 100,
                      0,
                    )
                    return (
                      <tr key={item.id} className="border-t">
                        <td className="p-2">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.sku}</p>
                        </td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(lineSubtotal + lineTax)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 rounded-md border p-4">
              <div className="flex justify-between">
                <span>{t('Subtotal')}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('Tax')}</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>{t('Discount')}</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>{t('Total')}</span>
                <span className="text-green-600">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                disabled={checkoutMutation.isPending}
              >
                {t('Cancel')}
              </Button>
              <Button
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? t('Processing…') : t('Complete Sale')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PosReceiptModal
        open={showReceiptModal}
        sale={completedSale}
        companyName={settings.company_name}
        onNewSale={handlePaymentComplete}
      />
    </div>
  )
}
