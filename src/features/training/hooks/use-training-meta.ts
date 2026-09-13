import { useQuery } from '@tanstack/react-query'
import { fetchTrainingMeta, fetchTrainingsIndexMeta } from '../training-api'
import type { LookupOption } from '@/features/_shared/operations-lookups'

export function useTrainingMeta() {
  const query = useQuery({
    queryKey: ['training', 'create-meta'],
    queryFn: fetchTrainingMeta,
    staleTime: 60_000,
  })

  const meta = query.data
  const trainingTypeOptions: LookupOption[] =
    meta?.training_types.map((t) => ({ id: t.id, label: t.name })) ?? []
  const trainerOptions: LookupOption[] =
    meta?.trainers.map((t) => ({ id: t.id, label: t.name })) ?? []

  return { ...query, meta, trainingTypeOptions, trainerOptions }
}

export function useTrainingsIndexMeta() {
  const query = useQuery({
    queryKey: ['training', 'trainings', 'index-meta'],
    queryFn: fetchTrainingsIndexMeta,
    staleTime: 60_000,
  })

  const meta = query.data
  const trainingTypeOptions: LookupOption[] =
    meta?.training_types.map((t) => ({ id: t.id, label: t.name })) ?? []
  const trainerOptions: LookupOption[] =
    meta?.trainers.map((t) => ({ id: t.id, label: t.name })) ?? []

  return { ...query, meta, trainingTypeOptions, trainerOptions }
}
