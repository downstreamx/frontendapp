/** Query helpers for linking distribution screens to a truck load. */

export function distributionListQuery(params: Record<string, string>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  const q = search.toString()
  return q ? `?${q}` : ''
}

export function truckLoadIdParam(truckLoadId: number | string): Record<string, string> {
  return { truck_load_id: String(truckLoadId) }
}

export function truckLoadCreatePrefill(
  truckLoadId: number | string,
  extra: Record<string, string> = {},
): Record<string, string> {
  return { create: '1', ...truckLoadIdParam(truckLoadId), ...extra }
}

/** Filter a distribution list by truck load (does not open the create dialog). */
export function truckLoadListFilter(truckLoadId: number | string): Record<string, string> {
  return truckLoadIdParam(truckLoadId)
}
