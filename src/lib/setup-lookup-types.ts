export type SetupPaymentTermOption = {
  id: number
  name: string
  code: string | null
  net_days: number | null
  is_credit: boolean
}

export type SetupCategoryOption = {
  id: number
  name: string
  code: string | null
}
