import { useQuery } from '@tanstack/react-query'
import {
  toDriverLookupOptions,
  toTruckLookupOptions,
} from '@/features/_shared/operations-lookups'
import { fetchFleetMeta } from '../fleet-api'

export function useFleetMeta() {
  const query = useQuery({
    queryKey: ['fleet', 'create-meta'],
    queryFn: fetchFleetMeta,
    staleTime: 60_000,
  })

  const optionsFor = (key: 'truck' | 'driver' | 'truck_provider' | 'maintenance_provider') => {
    const meta = query.data
    if (!meta) return []
    switch (key) {
      case 'truck':
        return toTruckLookupOptions(meta.trucks)
      case 'driver':
        return toDriverLookupOptions(
          meta.drivers.map((d) => ({
            id: d.id,
            name: d.name,
            display_name: d.display_name,
            first_name: d.first_name,
            last_name: d.last_name,
            email: d.email,
            avatar: d.avatar,
          })),
        )
      case 'truck_provider':
        return meta.truck_providers.map((p) => ({ id: p.id, label: p.name }))
      case 'maintenance_provider':
        return meta.maintenance_providers.map((p) => ({ id: p.id, label: p.name }))
    }
  }

  return { ...query, optionsFor }
}
