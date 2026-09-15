/** Litres available on a truck row from distribution / fleet meta. */
export function resolveTruckCapacityLitres(truck: {
  capacity_litres?: number
}): number {
  const value = Number(truck.capacity_litres)
  return Number.isFinite(value) && value > 0 ? value : 0
}
