import { api, type ApiSuccess } from '@/lib/api'
import { extractListRows, extractPaginatedList, type PaginatedListResult } from '@/hooks/use-resource-list'

export type PlanRow = {
  id: number
  name: string
  description?: string
  package_price_monthly?: number
  package_price_yearly?: number
  status?: boolean
  free_plan?: boolean
  number_of_users?: number
  storage_limit?: number
  trial?: boolean
  trial_days?: number
  modules?: string[]
  orders_count?: number
}

export type CouponType = 'percentage' | 'flat' | 'fixed'

export type CouponRow = {
  id: number
  name: string
  code: string
  discount: number
  type: CouponType
  description?: string | null
  limit?: number | null
  minimum_spend?: number | string | null
  maximum_spend?: number | string | null
  limit_per_user?: number | null
  expiry_date?: string | null
  included_module?: string[] | null
  excluded_module?: string[] | null
  status?: boolean
  created_at?: string
}

export type CouponUsageRow = {
  id: number
  order_id: string
  created_at?: string
  user?: { id: number; name: string; email?: string }
}

export type CouponDetailPayload = {
  coupon: CouponRow
  usage_records: PaginatedListResult<CouponUsageRow>
}

export type CouponWritePayload = {
  name: string
  code: string
  discount: number
  type: CouponType
  description?: string
  limit?: number
  minimum_spend?: number
  maximum_spend?: number
  limit_per_user?: number
  expiry_date?: string
  included_module?: string[]
  excluded_module?: string[]
  status?: boolean
}

export type PlanModuleRow = {
  id: number
  module: string
  name: string
  alias?: string
  image?: string | null
}

export type AddOnPriceRow = PlanModuleRow & {
  monthly_price?: number | string
  yearly_price?: number | string
}

export type OrderRow = {
  id: number
  order_id: string
  plan_name?: string
  name?: string
  email?: string
  price?: number | string
  currency?: string
  payment_status?: string
  payment_type?: string
  created_at?: string
  plan?: { id: number; name: string }
  user?: { id: number; name: string; email?: string }
}

export async function listPlans(params?: { per_page?: number; active_only?: boolean }) {
  const { data } = await api.get<ApiSuccess<unknown>>('/plans', {
    params: {
      per_page: params?.per_page ?? 50,
      active_only: params?.active_only ? 1 : undefined,
    },
  })
  return extractListRows<PlanRow>(data)
}

export type PlanWritePayload = {
  name: string
  description?: string
  number_of_users?: number
  storage_limit?: number
  status?: boolean
  free_plan?: boolean
  modules?: string[]
  package_price_monthly?: number
  package_price_yearly?: number
  trial?: boolean
  trial_days?: number
}

export async function createPlan(payload: PlanWritePayload) {
  const { data } = await api.post<ApiSuccess<PlanRow>>('/plans', payload)
  return data.data
}

export async function getPlan(id: string | number) {
  const { data } = await api.get<ApiSuccess<PlanRow>>(`/plans/${id}`)
  return data.data
}

export async function updatePlan(id: number, payload: PlanWritePayload) {
  const { data } = await api.put<ApiSuccess<PlanRow>>(`/plans/${id}`, payload)
  return data.data
}

export async function deletePlan(id: number) {
  await api.delete(`/plans/${id}`)
}

export async function fetchPlanModuleCatalog() {
  const { data } = await api.get<ApiSuccess<{ modules: PlanModuleRow[] }>>('/plans/module-catalog')
  return data.data.modules
}

/** @deprecated Use fetchPlanModuleCatalog for plan UI; pricing is package-only. */
export async function fetchAddOnPrices() {
  const { data } = await api.get<ApiSuccess<{ addons: AddOnPriceRow[] }>>('/plans/add-on-prices')
  return data.data.addons
}

export async function updateAddOnPrice(payload: {
  module: string
  monthly_price: number
  yearly_price: number
  name?: string
}) {
  const { data } = await api.put<ApiSuccess<AddOnPriceRow>>('/plans/add-on-prices', payload)
  return data.data
}

export async function listCouponsPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<CouponRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/coupons', { params })
  return extractPaginatedList<CouponRow>(data)
}

/** @deprecated Use listCouponsPaginated */
export async function listCoupons() {
  const result = await listCouponsPaginated({ per_page: 100 })
  return result.rows
}

export async function createCoupon(payload: CouponWritePayload) {
  const { data } = await api.post<ApiSuccess<CouponRow>>('/coupons', payload)
  return data.data
}

export async function getCouponDetail(
  id: string | number,
  params?: Record<string, string | number | undefined>,
): Promise<CouponDetailPayload> {
  const { data } = await api.get<ApiSuccess<CouponDetailPayload>>(`/coupons/${id}`, { params })
  return data.data
}

/** @deprecated Use getCouponDetail */
export async function getCoupon(id: string | number) {
  const detail = await getCouponDetail(id)
  return detail.coupon
}

export async function updateCoupon(id: number, payload: CouponWritePayload) {
  const { data } = await api.put<ApiSuccess<CouponRow>>(`/coupons/${id}`, payload)
  return data.data
}

export async function deleteCoupon(id: number) {
  await api.delete(`/coupons/${id}`)
}

export async function listOrdersPaginated(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedListResult<OrderRow>> {
  const { data } = await api.get<ApiSuccess<unknown>>('/orders', { params })
  return extractPaginatedList<OrderRow>(data)
}

/** @deprecated Use listOrdersPaginated */
export async function listOrders() {
  const result = await listOrdersPaginated({ per_page: '100' })
  return result.rows
}

export async function createOrder(payload: { plan_id: number; name?: string; email?: string }) {
  const { data } = await api.post<ApiSuccess<OrderRow>>('/orders', payload)
  return data.data
}

export async function getOrder(id: string | number) {
  const { data } = await api.get<ApiSuccess<OrderRow & { plan?: PlanRow }>>(`/orders/${id}`)
  return data.data
}

export type PaymentOptions = {
  stripe: boolean
  paypal: boolean
  bank_transfer: boolean
  bank_transfer_instructions?: string | null
}

export async function checkoutSubscription(
  planId: number,
  paymentMethod: 'bank_transfer' | 'stripe' | 'paypal' = 'bank_transfer',
  options?: {
    time_period?: 'Month' | 'Year' | 'Trial'
    user_module_input?: string
    coupon_code?: string
    receipt?: File | null
  },
) {
  type CheckoutResponse = ApiSuccess<{
    plan_id: number
    plan_name: string
    message?: string
    payment_method?: string
    bank_transfer_instructions?: string | null
    order?: { id: number; order_id: string }
  }>

  const { receipt, ...fields } = options ?? {}

  if (receipt) {
    const formData = new FormData()
    formData.append('plan_id', String(planId))
    formData.append('payment_method', paymentMethod)
    if (fields.time_period) formData.append('time_period', fields.time_period)
    if (fields.user_module_input) formData.append('user_module_input', fields.user_module_input)
    if (fields.coupon_code) formData.append('coupon_code', fields.coupon_code)
    formData.append('receipt', receipt)

    const { data } = await api.post<CheckoutResponse>('/subscription/checkout', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  }

  const { data } = await api.post<CheckoutResponse>('/subscription/checkout', {
    plan_id: planId,
    payment_method: paymentMethod,
    ...fields,
  })
  return data.data
}

export async function listAvailableModules() {
  const { data } = await api.get<ApiSuccess<{ modules: string[] }>>('/modules')
  return data.data.modules
}

export async function listActiveModules() {
  const { data } = await api.get<ApiSuccess<{ modules: string[] }>>('/modules/active')
  return data.data.modules
}

export async function activateModule(module: string) {
  const { data } = await api.post<ApiSuccess<unknown>>('/modules/activate', { module })
  return data.data
}

export async function deactivateModule(module: string) {
  await api.delete(`/modules/${encodeURIComponent(module)}`)
}

export async function getSubscription() {
  const { data } = await api.get<ApiSuccess<{
    active: boolean
    plan?: { id: number; name: string; package_price_monthly?: number; modules?: string[] }
    active_modules?: string[]
    payment_options?: PaymentOptions
  }>>('/subscription')
  return data.data
}
