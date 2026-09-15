import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Folder } from 'lucide-react'
import { api } from '@/lib/api'
import { extractListRows } from '@/hooks/use-resource-list'
import { resolvePageModule } from '@/lib/page-modules'
import { DataTable, type Column } from '@/components/ui/data-table'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { usePageChrome } from '@/contexts/page-chrome-context'

function rowLabel(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const val = row[key]
    if (val !== undefined && val !== null && val !== '') return String(val)
  }
  return `Item #${String(row.id ?? '—')}`
}

export function ModuleIndexPage() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const config = resolvePageModule(pathname)
  const labelKeys = config.labelKeys ?? ['name', 'title', 'id']

  usePageChrome({ pageTitle: config.title })

  const listQuery = useQuery({
    queryKey: ['module-list', config.listApi],
    enabled: Boolean(config.listApi),
    queryFn: async () => {
      const { data } = await api.get(config.listApi!)
      return data
    },
  })

  const statusQuery = useQuery({
    queryKey: ['module-status', config.statusApi],
    enabled: Boolean(config.statusApi) && !config.listApi,
    queryFn: async () => {
      const { data } = await api.get(config.statusApi!)
      return data
    },
  })

  const rows = extractListRows<Record<string, unknown>>(listQuery.data)
  const isLoading = listQuery.isLoading || statusQuery.isLoading
  const error = listQuery.error ?? statusQuery.error

  const columns = useMemo((): Column<Record<string, unknown>>[] => {
    const cols: Column<Record<string, unknown>>[] = labelKeys
      .filter((key) => key !== 'id')
      .map((key) => ({
        key,
        header: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        render: (_v, row) => rowLabel(row, [key]),
      }))
    if (rows.some((r) => r.status != null)) {
      cols.push({
        key: 'status',
        header: t('Status'),
        render: (v) => (v != null ? String(v) : '—'),
      })
    }
    return cols
  }, [labelKeys, rows, t])

  if (!config.listApi) {
    return (
      <ModuleListCard title={config.title} isLoading={isLoading} error={!!error}>
        <div className="mx-6 mb-6 rounded-xl border border-dashed border-border/60 bg-[hsl(var(--section-deep))]/70 p-8 text-center text-sm text-muted-foreground">
          <p className="mb-1 text-base font-semibold tracking-tight text-foreground">{t('Coming soon')}</p>
          <p className="leading-relaxed">
            {t('Full legacy UI is being ported — API expansion may be required.')}
          </p>
        </div>
      </ModuleListCard>
    )
  }

  return (
    <ModuleListCard title={config.title} isLoading={isLoading} error={!!error}>
      <DataTable
        data={rows}
        columns={columns}
        className="rounded-none border-0 shadow-none"
        emptyState={
          <NoRecordsFound
            icon={Folder}
            title={t('No {{entity}} found', { entity: config.title.toLowerCase() })}
            description={t('Records will appear here once available.')}
            className="h-auto py-8"
          />
        }
      />
    </ModuleListCard>
  )
}
