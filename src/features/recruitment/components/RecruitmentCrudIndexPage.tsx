import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { ResourceIndexPage } from '@/components/resource/resource-index-page'
import type { CrudFieldDef } from '@/features/shared/components/CrudFormDialog'
import type { Column } from '@/components/ui/data-table'

type MetaRecord = Record<string, unknown>

type EntityConfig = {
  title: string
  listKey: string
  apiBase: string
  metaPath?: string
  labelKeys: string[]
  emptyIcon: LucideIcon
  permissions?: { create?: string; edit?: string; delete?: string }
  buildFields: (meta: MetaRecord, t: (key: string) => string) => CrudFieldDef[]
  buildColumns?: (t: (key: string) => string) => Column<Record<string, unknown>>[]
}

type Props = {
  config: EntityConfig
}

function toOptions(
  rows: Array<{ id: number | string; name?: string; title?: string; first_name?: string; last_name?: string }> | undefined,
): Array<{ value: string; label: string }> {
  return (rows ?? []).map((row) => ({
    value: String(row.id),
    label:
      row.name ??
      row.title ??
      [row.first_name, row.last_name].filter(Boolean).join(' ') ??
      `#${row.id}`,
  }))
}

function statusOptions(
  rows: Array<{ value: string; label: string }> | undefined,
): Array<{ value: string; label: string }> {
  return (rows ?? []).map((r) => ({ value: r.value, label: r.label }))
}

export function RecruitmentCrudIndexPage({ config }: Props) {
  const { t } = useTranslation()

  const { data: metaRes } = useQuery({
    queryKey: ['recruitment', config.listKey, 'meta'],
    queryFn: async () => {
      if (!config.metaPath) return { data: {} as MetaRecord }
      const res = await api.get<{ data: MetaRecord }>(config.metaPath)
      return res.data
    },
    enabled: Boolean(config.metaPath),
  })

  const meta = metaRes?.data ?? {}
  const fields = useMemo(() => config.buildFields(meta, t), [config, meta, t])
  const columns = useMemo(
    () => config.buildColumns?.(t),
    [config, t],
  )

  return (
    <ResourceIndexPage
      title={config.title}
      listKey={config.listKey}
      apiEndpoint={config.apiBase}
      labelKeys={config.labelKeys}
      emptyIcon={config.emptyIcon}
      fields={fields}
      permissions={config.permissions}
      columns={columns}
    />
  )
}

export { toOptions, statusOptions }
export type { EntityConfig }
