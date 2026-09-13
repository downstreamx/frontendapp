import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { getPackageAlias } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import {
  fetchNotificationTemplatesIndexMeta,
  listNotificationTemplatesPaginated,
  type NotificationTemplateRow,
} from '../notification-templates-api'

export function NotificationTemplatesIndexPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()

  const page = Number(searchParams.get('page') ?? '1') || 1
  const activeType = searchParams.get('type') ?? ''

  const metaQuery = useQuery({
    queryKey: ['notification-templates', 'index-meta'],
    queryFn: fetchNotificationTemplatesIndexMeta,
  })

  const types = metaQuery.data?.types ?? []

  useEffect(() => {
    if (!metaQuery.isSuccess || types.length === 0 || activeType) return
    const next = new URLSearchParams(searchParams)
    next.set('type', types[0])
    setSearchParams(next, { replace: true })
  }, [metaQuery.isSuccess, types, activeType, searchParams, setSearchParams])

  usePageChrome({
    pageTitle: t('Notification templates'),
    breadcrumbs: [{ label: t('Settings') }, { label: t('Notification templates') }],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (activeType) params.type = activeType
    if (toolbar.search) params.action = toolbar.search
    return params
  }, [activeType, page, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['notification-templates', listParams],
    queryFn: () => listNotificationTemplatesPaginated(listParams),
    enabled: Boolean(activeType) || types.length === 0,
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const hasFilters = Boolean(toolbar.search)

  const setType = (type: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('type', type)
    next.set('page', '1')
    setSearchParams(next)
  }

  const applySearch = () => {
    toolbar.applySearch()
    const next = new URLSearchParams(searchParams)
    next.set('page', '1')
    setSearchParams(next)
  }

  const clearFilters = () => {
    toolbar.setDraftSearch('')
    toolbar.applySearch(true)
    const next = new URLSearchParams(searchParams)
    next.delete('page')
    setSearchParams(next)
  }

  const columns: Column<NotificationTemplateRow>[] = [
    {
      key: 'action',
      header: t('Subject'),
      render: (_, row) => (
        <Link
          to={paths.notificationTemplateEdit(row.id)}
          className="font-medium text-primary hover:underline"
        >
          {row.action}
        </Link>
      ),
    },
    {
      key: 'module',
      header: t('Module'),
      render: (_, row) => (row.module ? (getPackageAlias(row.module) ?? row.module) : '—'),
    },
  ]

  const listBody =
    rows.length === 0 ? (
      <NoRecordsFound
        icon={Bell}
        title={t('No notification templates found')}
        description={t('Templates are registered when notification modules are enabled.')}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
        className="h-auto py-8"
      />
    ) : (
      <DataTable embedded columns={columns} data={rows} />
    )

  return (
    <div className="space-y-4">
      {types.length > 0 ? (
        <Tabs value={activeType || types[0]} onValueChange={setType}>
          <TabsList className="flex h-auto flex-wrap gap-1">
            {types.map((type) => (
              <TabsTrigger key={type} value={type} className="capitalize">
                {type}
              </TabsTrigger>
            ))}
          </TabsList>
          {types.map((type) => (
            <TabsContent key={type} value={type} className="mt-4">
              {activeType === type ? (
                <ModuleListCard
                  title={t('Notification templates')}
                  description={t('Customize messages sent via {{type}}.', { type })}
                  isLoading={isLoading}
                  error={!!error}
                  searchToolbar={{
                    searchValue: toolbar.draftSearch,
                    onSearchChange: toolbar.setDraftSearch,
                    onSearch: applySearch,
                    searchPlaceholder: t('Search by subject…'),
                    controls: (
                      <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />
                    ),
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
                  {listBody}
                </ModuleListCard>
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <ModuleListCard
          title={t('Notification templates')}
          description={t('Enable Slack, Telegram, Twilio, or similar modules to seed templates.')}
          isLoading={metaQuery.isLoading || isLoading}
          error={!!error}
        >
          {listBody}
        </ModuleListCard>
      )}
    </div>
  )
}
