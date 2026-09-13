import type { CouponRow } from '@/features/saas/saas-api'

export function formatCouponDiscount(coupon: Pick<CouponRow, 'discount' | 'type'>, symbol = '$'): string {
  if (coupon.type === 'percentage') {
    return `${coupon.discount}%`
  }
  return `${symbol}${coupon.discount}`
}
