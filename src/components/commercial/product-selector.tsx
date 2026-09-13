import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LookupOptionLabel } from '@/components/forms/lookup-option-media'
import { formatCurrency } from '@/utils/helpers'
import type { CommercialProduct } from '@/features/commercial/types'

type Props = {
  products: CommercialProduct[]
  value: number
  onChange: (productId: number, product?: CommercialProduct) => void
  disabled?: boolean
  placeholder?: string
}

export function ProductSelector({ products, value, onChange, disabled, placeholder }: Props) {
  const { t } = useTranslation()
  const selected = products.find((p) => p.id === value)

  return (
    <Select
      disabled={disabled}
      value={value > 0 ? String(value) : undefined}
      onValueChange={(id) => {
        const productId = parseInt(id, 10)
        onChange(productId, products.find((p) => p.id === productId))
      }}
    >
      <SelectTrigger className="w-full">
        {selected ? (
          <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <LookupOptionLabel
              option={{
                label: `${selected.name} — ${formatCurrency(selected.purchase_price ?? selected.sale_price ?? 0)}`,
                image: selected.image,
                mediaKind: 'product',
              }}
            />
          </span>
        ) : (
          <SelectValue placeholder={placeholder ?? t('Select Product')} />
        )}
      </SelectTrigger>
      <SelectContent>
        {products.map((product) => (
          <SelectItem key={product.id} value={String(product.id)} className="py-2 pl-9">
            <LookupOptionLabel
              option={{
                label: `${product.name} — ${formatCurrency(product.purchase_price ?? product.sale_price ?? 0)}`,
                image: product.image,
                mediaKind: 'product',
              }}
            />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
