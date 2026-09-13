import { useQuery } from '@tanstack/react-query'
import { fetchLeadMeta, type LeadMeta } from '../lead-api'
import type { LookupOption } from '@/features/_shared/operations-lookups'

function userLabel(u: { name: string; email?: string }) {
  return u.email ? `${u.name} (${u.email})` : u.name
}

export function useLeadMeta() {
  const query = useQuery({
    queryKey: ['lead', 'create-meta'],
    queryFn: fetchLeadMeta,
    staleTime: 60_000,
  })

  const meta = query.data

  const pipelineOptions: LookupOption[] =
    meta?.pipelines.map((p) => ({ id: p.id, label: p.name })) ?? []

  const stagesFor = (pipelineId: string, kind: 'lead' | 'deal'): LookupOption[] => {
    if (!meta || !pipelineId) return []
    const pipeline = meta.pipelines.find((p) => String(p.id) === pipelineId)
    const stages =
      kind === 'lead'
        ? (pipeline?.leadStages ?? pipeline?.lead_stages ?? [])
        : (pipeline?.dealStages ?? pipeline?.deal_stages ?? [])
    return stages.map((s) => ({ id: s.id, label: s.name }))
  }

  const stageOptionsFor = (pipelineId: string) => stagesFor(pipelineId, 'lead')
  const dealStageOptionsFor = (pipelineId: string) => stagesFor(pipelineId, 'deal')

  const userOptions: LookupOption[] =
    meta?.users.map((u) => ({ id: u.id, label: userLabel(u) })) ?? []

  return { ...query, meta, pipelineOptions, stageOptionsFor, dealStageOptionsFor, userOptions }
}
