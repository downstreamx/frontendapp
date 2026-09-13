type SupplierLike = {
  name?: string
  email?: string | null
  company_name?: string | null
}

type SupplierDetailsLike = {
  company_name?: string | null
}

export function purchaseInvoiceSupplierCompanyName(
  supplier?: SupplierLike | null,
  supplierDetails?: SupplierDetailsLike | null,
): string | null {
  const company =
    supplierDetails?.company_name?.trim() || supplier?.company_name?.trim() || null
  return company || null
}

export function purchaseInvoiceSupplierContactName(supplier?: SupplierLike | null): string | null {
  const name = supplier?.name?.trim()
  return name || null
}

export function purchaseInvoiceSupplierPrimaryLabel(
  supplier?: SupplierLike | null,
  supplierDetails?: SupplierDetailsLike | null,
): string {
  return (
    purchaseInvoiceSupplierCompanyName(supplier, supplierDetails) ||
    purchaseInvoiceSupplierContactName(supplier) ||
    '—'
  )
}
