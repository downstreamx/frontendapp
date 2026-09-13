import type { PosTerminalProduct } from './pos-api'

export type PosCartItem = PosTerminalProduct & { quantity: number }

export function cartSubtotal(cart: PosCartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export function cartTaxAmount(cart: PosCartItem[]): number {
  let totalTax = 0
  for (const item of cart) {
    const itemSubtotal = item.price * item.quantity
    for (const tax of item.taxes ?? []) {
      totalTax += (itemSubtotal * tax.rate) / 100
    }
  }
  return totalTax
}

export function cartTaxBreakdown(cart: PosCartItem[]): Array<{ name: string; amount: number }> {
  const breakdown: Record<string, { name: string; amount: number }> = {}
  for (const item of cart) {
    const itemSubtotal = item.price * item.quantity
    for (const tax of item.taxes ?? []) {
      const taxAmount = (itemSubtotal * tax.rate) / 100
      const key = `${tax.name}_${tax.rate}`
      if (breakdown[key]) {
        breakdown[key].amount += taxAmount
      } else {
        breakdown[key] = { name: `${tax.name} (${tax.rate}%)`, amount: taxAmount }
      }
    }
  }
  return Object.values(breakdown)
}

export function cartTotal(cart: PosCartItem[], discount: number): number {
  return cartSubtotal(cart) + cartTaxAmount(cart) - discount
}
