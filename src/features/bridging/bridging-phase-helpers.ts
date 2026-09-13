/** Truck at depot — eligible for customer distribution assignment. */
export function isTruckLoadArrivedAtDepot(phase: string | undefined): boolean {
  return phase === 'arrived' || phase === 'loaded'
}

/** En route from supplier after bridging approval. */
export function isTruckLoadInTransitBridged(phase: string | undefined): boolean {
  return phase === 'in_transit_bridged' || phase === 'loaded'
}

/** Assigned to sales and in customer delivery flow. */
export function isTruckLoadInDistribution(phase: string | undefined): boolean {
  return (
    phase === 'assigned' ||
    phase === 'in_transit_distribution' ||
    phase === 'in_transit'
  )
}
