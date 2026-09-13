import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Mail } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getPackageAlias } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import {
  fetchEmailTemplatesIndexMeta,
  listEmailTemplatesPaginated,
  type EmailTemplateRow,
} from '../email-templates-api'

type AppliedFilters = { module_name: string }

const defaultFilters: AppliedFilters = { module_name: '' }

export function EmailTemplatesIndexPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)

  const page = Number(searchParams.get('page') ?? '1') || 1

  usePageChrome({
    pageTitle: t('Email templates'),
    breadcrumbs: [{ label: t('Settings') }, { label: t('Email templates') }],
  })

  const metaQuery = useQuery({
    queryKey: ['email-templates', 'index-meta'],
    queryFn: fetchEmailTemplatesIndexMeta,
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.name = toolbar.search
    if (appliedFilters.module_name) params.module_name = appliedFilters.module_name
    return params
  }, [appliedFilters.module_name, page, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['email-templates', listParams],
    queryFn: () => listEmailTemplatesPaginated(listParams),
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const modules = metaQuery.data?.modules ?? []
  const activeFilterCount = appliedFilters.module_name ? 1 : 0
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

  const applyFilters = () => {
    setAppliedFilters(draftFilters)
    toolbar.applySearch()
    const next = new URLSearchParams(searchParams)
    next.set('page', '1')
    setSearchParams(next)
  }

  const clearFilters = () => {
    setDraftFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
    toolbar.setDraftSearch('')
    toolbar.applySearch(true)
    const next = new URLSearchParams(searchParams)
    next.delete('page')
    setSearchParams(next)
  }

  const columns: Column<EmailTemplateRow>[] = [
    {
      key: 'name',
      header: t('Name'),
      render: (_, row) => (
        <Link
          to={paths.emailTemplateEdit(row.id)}
          className="font-medium text-primary hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: 'module_name',
      header: t('Module'),
      render: (_, row) =>
        row.module_name ? (getPackageAlias(row.module_name) ?? row.module_name) : '—',
    },
    {
      key: 'from',
      header: t('From'),
      render: (_, row) => row.from ?? '—',
    },
    {
      key: 'languages',
      header: t('Languages'),
      render: (_, row) =>
        row.languages?.length
          ? row.languages.map((l) => l.lang).join(', ')
          : t('None'),
    },
  ]

  return (
    <ModuleListCard
      title={t('Email templates')}
      description={t('Customize transactional emails sent by each module.')}
      isLoading={isLoading}
      error={!!error}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: applyFilters,
        searchPlaceholder: t('Search by template name…'),
        showFilters,
        onToggleFilters: () => setShowFilters((v) => !v),
        activeFilterCount,
        controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
        onApplyFilters: applyFilters,
        onClearFilters: clearFilters,
        filtersPanel: showFilters ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label>{t('Module')}</Label>
              <Select
                value={draftFilters.module_name || 'all'}
                onValueChange={(value) =>
                  setDraftFilters((f) => ({ ...f, module_name: value === 'all' ? '' : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('All modules')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All modules')}</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module} value={module}>
                      {getPackageAlias(module) ?? module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : undefined,
      }}
      pagination={
        pagination
          ? {
              ...pagination,
              onPageChange: (p) => {
                const next = new URLSearchParams(searchParams)
                next.set('page', String(p))
                setSearchParams(next)
              },
            }
          : undefined
      }
    >
      {rows.length === 0 ? (
        <NoRecordsFound
          icon={Mail}
          title={t('No email templates found')}
          description={t('Templates are created when modules register notification events.')}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          className="h-auto py-8"
        />
      ) : (
        <DataTable embedded columns={columns} data={rows} />
      )}
    </ModuleListCard>
  )
}
