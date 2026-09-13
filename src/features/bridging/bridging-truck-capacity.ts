/** Litres available on a truck row from distribution / fleet meta. */
export function resolveTruckCapacityLitres(truck: {
  capacity_litres?: number
  fuel_capacity?: number
}): number {
  const capacity = truck.capacity_litres ?? truck.fuel_capacity
  const value = Number(capacity)
  return Number.isFinite(value) && value > 0 ? value : 0
}
