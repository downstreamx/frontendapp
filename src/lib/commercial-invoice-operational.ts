/** Posted commercial invoices (purchase or sales) can show truck load / distribution panels. */
export function shouldShowTruckLoadPanel(status: string | undefined): boolean {
  if (!status) return false
  return status !== 'cancelled'
}
