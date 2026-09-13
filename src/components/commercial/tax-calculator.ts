import { useMemo } from 'react'

export type LineItemCalc = {
  quantity: number
  unit_price: number
  discount_amount: number
  tax_amount: number
  total_amount: number
}

export function calculateLineItemAmounts(
  quantity: number,
  unitPrice: number,
  discountPercentage = 0,
  taxPercentage = 0,
) {
  const lineTotal = quantity * unitPrice
  const discountAmount = (lineTotal * discountPercentage) / 100
  const afterDiscount = lineTotal - discountAmount
  const taxAmount = (afterDiscount * taxPercentage) / 100
  const totalAmount = afterDiscount + taxAmount
  return { discountAmount, taxAmount, totalAmount }
}

export function useTaxCalculator(items: LineItemCalc[]) {
  return useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    const discountAmount = items.reduce((sum, item) => sum + (item.discount_amount || 0), 0)
    const taxAmount = items.reduce((sum, item) => sum + (item.tax_amount || 0), 0)
    const total = items.reduce((sum, item) => sum + (item.total_amount || 0), 0)
    return { subtotal, discountAmount, taxAmount, total }
  }, [items])
}
