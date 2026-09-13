/** @deprecated Import from `./payments-api` instead */
export {
  listCustomerPayments,
  getCustomerPayment,
  getCustomerPaymentCreateMeta,
  getOutstandingInvoices,
  createCustomerPayment,
  updateCustomerPaymentStatus,
  listSupplierPayments,
  getSupplierPayment,
  getSupplierPaymentCreateMeta,
  getSupplierOutstanding,
  createSupplierPayment,
  updateSupplierPaymentStatus,
  type SupplierPaymentRow,
} from './payments-api'

/** @deprecated Use SupplierPaymentRow */
export type SupplierPayment = import('./payments-api').SupplierPaymentRow

export type { CustomerPaymentFormValues } from './types'
