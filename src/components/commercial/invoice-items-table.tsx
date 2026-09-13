import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import type { CommercialInvoiceItem, CommercialProduct } from '@/features/commercial/types'
import { ProductSelector } from '@/components/commercial/product-selector'
import { calculateLineItemAmounts } from '@/components/commercial/tax-calculator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QuantityInput, parseQuantityInput } from '@/components/ui/quantity-input'
import { InputError } from '@/components/ui/input-error'
import { formatQuantity, formatQuantityInputString } from '@/lib/format-quantity'
import { formatCurrency } from '@/utils/helpers'

type Props = {
  items: CommercialInvoiceItem[]
  onChange: (items: CommercialInvoiceItem[]) => void
  errors?: Record<string, string>
  products?: CommercialProduct[]
  showAddButton?: boolean
  maxItems?: number
  invoiceType?: 'product' | 'service'
  depotSelected?: boolean
}

const emptyItem = (): CommercialInvoiceItem => ({
  product_id: 0,
  quantity: 1,
  unit_price: 0,
  discount_percentage: 0,
  discount_amount: 0,
  tax_percentage: 0,
  tax_amount: 0,
  total_amount: 0,
  taxes: [],
})

export function InvoiceItemsTable({
  items,
  onChange,
  errors = {},
  products = [],
  showAddButton = true,
  maxItems,
  invoiceType = 'product',
  depotSelected = true,
}: Props) {
  const { t } = useTranslation()
  const canAddMore = maxItems == null || items.length < maxItems
  const canRemoveRow = maxItems == null || items.length > maxItems
  const productSelectDisabled = invoiceType === 'product' && !depotSelected
  const productSelectPlaceholder = productSelectDisabled
    ? t('Select depot first')
    : products.length === 0
      ? t('No products available in this depot')
      : t('Select Product')

  const recalc = (item: CommercialInvoiceItem) => {
    const calc = calculateLineItemAmounts(
      item.quantity,
      item.unit_price,
      item.discount_percentage,
      item.tax_percentage,
    )
    item.discount_amount = calc.discountAmount
    item.tax_amount = calc.taxAmount
    item.total_amount = calc.totalAmount
  }

  const updateItem = (index: number, field: keyof CommercialInvoiceItem, value: unknown) => {
    const next = [...items]
    next[index] = { ...next[index], [field]: value }
    recalc(next[index])
    onChange(next)
  }

  const handleProductSelect = (index: number, productId: number, product?: CommercialProduct) => {
    const next = [...items]
    const totalTaxRate =
      product?.taxes?.reduce((sum, tax) => sum + Number(tax.rate), 0) ?? 0
    next[index] = {
      ...next[index],
      product_id: productId,
      unit_price: Number(product?.purchase_price ?? product?.sale_price) || 0,
      tax_percentage: totalTaxRate,
      taxes:
        product?.taxes?.map((tax) => ({ tax_name: tax.tax_name, tax_rate: tax.rate })) ?? [],
    }
    recalc(next[index])
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-sm font-semibold">{t('Product')} *</th>
              {invoiceType === 'product' && (
                <th className="px-4 py-3 text-left text-sm font-semibold">{t('Qty')} *</th>
              )}
              <th className="px-4 py-3 text-left text-sm font-semibold">{t('Unit Price')} *</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t('Discount')} %</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t('Tax')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">{t('Total')}</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">{t('Action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item, index) => {
              const selectedProduct =
                item.product_id > 0 ? products.find((p) => p.id === item.product_id) : undefined

              return (
              <tr key={index}>
                <td className="px-4 py-4">
                  <ProductSelector
                    products={products}
                    value={item.product_id}
                    onChange={(id, p) => handleProductSelect(index, id, p)}
                    disabled={productSelectDisabled}
                    placeholder={productSelectPlaceholder}
                  />
                  <InputError message={errors[`items.${index}.product_id`]} />
                </td>
                {invoiceType === 'product' && (
                  <td className="px-4 py-4">
                    <QuantityInput
                      value={
                        item.quantity > 0 ? formatQuantityInputString(String(item.quantity)) : ''
                      }
                      onChange={(display) => {
                        const parsed = parseQuantityInput(display)
                        updateItem(index, 'quantity', parsed ?? 0)
                      }}
                      className="h-9 w-32 min-w-[8rem] max-w-full"
                      placeholder={t('Qty')}
                    />
                    {selectedProduct?.stock_quantity != null ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('Available quantity in depot')}:{' '}
                        {formatQuantity(selectedProduct.stock_quantity)}
                      </p>
                    ) : null}
                    <InputError message={errors[`items.${index}.quantity`]} />
                  </td>
                )}
                <td className="px-4 py-4">
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) =>
                      updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                    }
                    className="w-24"
                    min={0}
                    step="0.01"
                  />
                </td>
                <td className="px-4 py-4">
                  <Input
                    type="number"
                    value={item.discount_percentage}
                    onChange={(e) =>
                      updateItem(index, 'discount_percentage', parseFloat(e.target.value) || 0)
                    }
                    className="w-20"
                    min={0}
                    max={100}
                  />
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  {item.tax_percentage > 0 ? `${item.tax_percentage}%` : t('No tax')}
                </td>
                <td className="px-4 py-4 font-medium">{formatCurrency(item.total_amount)}</td>
                <td className="px-4 py-4 text-center">
                  {canRemoveRow ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onChange(items.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  ) : null}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      {showAddButton && canAddMore ? (
        <Button type="button" size="sm" onClick={() => onChange([...items, emptyItem()])}>
          + {t('Add Item')}
        </Button>
      ) : null}
      <InputError message={errors.items} />
    </div>
  )
}
