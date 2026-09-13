import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { formatDateTime } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import {
  fetchLoginHistoryIndexMeta,
  listLoginHistoryPaginated,
  type LoginHistoryRow,
} from '../admin-api'

type AppliedFilters = {
  ip: string
  role: string
}

const defaultFilters: AppliedFilters = {
  ip: '',
  role: '',
}

function formatLocation(details: LoginHistoryRow['details']): string {
  const city = details.city
  const country = details.country
  if (city && country) return `${city}, ${country}`
  if (country) return country
  return 'Unknown'
}

export function UserLoginHistoryPage() {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbar = useListToolbar()
  const [showFilters, setShowFilters] = useState(false)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(defaultFilters)

  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortField = searchParams.get('sort') ?? ''
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'

  const canFilterByRole = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-roles')

  usePageChrome({
    pageTitle: t('User Login History'),
    breadcrumbs: [
      { label: t('Users'), url: paths.users.index },
      { label: t('Login History') },
    ],
  })

  const listParams = useMemo(() => {
    const params: Record<string, string> = {
      per_page: toolbar.perPage,
      page: String(page),
    }
    if (toolbar.search) params.user_name = toolbar.search
    if (appliedFilters.ip) params.ip = appliedFilters.ip
    if (appliedFilters.role) params.role = appliedFilters.role
    if (sortField) {
      params.sort = sortField
      params.direction = sortDirection
    }
    return params
  }, [appliedFilters, page, sortDirection, sortField, toolbar.perPage, toolbar.search])

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', 'login-history', listParams],
    queryFn: () => listLoginHistoryPaginated(listParams),
  })

  const metaQuery = useQuery({
    queryKey: ['users', 'login-history', 'index-meta'],
    queryFn: fetchLoginHistoryIndexMeta,
  })

  const rows = data?.rows ?? []
  const pagination = data?.meta
  const roleOptions = metaQuery.data?.roles ?? {}

  const activeFilterCount = [appliedFilters.ip, appliedFilters.role].filter(Boolean).length
  const hasFilters = Boolean(toolbar.search) || activeFilterCount > 0

  const setSort = (field: string) => {
    const next = new URLSearchParams(searchParams)
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    next.set('sort', field)
    next.set('direction', direction)
    next.set('page', '1')
    setSearchParams(next)
  }

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

  const columns: Column<LoginHistoryRow>[] = [
    {
      key: 'user.name',
      header: t('User'),
      sortable: true,
      render: (_, row) =>
        row.user ? (
          <div>
            <div className="font-medium">{row.user.name}</div>
            <div className="text-sm text-muted-foreground">{row.user.email}</div>
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'ip',
      header: t('IP Address'),
      sortable: true,
      render: (_, row) => row.ip,
    },
    {
      key: 'details',
      header: t('Location & Device'),
      render: (_, row) => (
        <div className="space-y-1 text-sm">
          <div>{formatLocation(row.details)}</div>
          <div className="text-muted-foreground">
            {row.details.browser_name ?? 'Unknown'} on {row.details.os_name ?? 'Unknown'}
          </div>
          {row.details.device_type ? (
            <div className="capitalize text-muted-foreground">{row.details.device_type}</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'type',
      header: t('Role'),
      sortable: true,
      render: (_, row) => (
        <Badge variant="secondary" className="font-normal capitalize">
          {roleOptions[row.type] ?? row.type}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: t('Time'),
      sortable: true,
      render: (_, row) => formatDateTime(row.created_at),
    },
  ]

  return (
    <ModuleListCard
      title={t('User Login History')}
      description={t('Review sign-in activity across your team.')}
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to={paths.users.index}>{t('Back to users')}</Link>
        </Button>
      }
      isLoading={isLoading}
      error={!!error}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: applyFilters,
        searchPlaceholder: t('Search by user name...'),
        showFilters,
        onToggleFilters: () => setShowFilters((open) => !open),
        activeFilterCount,
        controls: <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />,
        onApplyFilters: applyFilters,
        onClearFilters: clearFilters,
        filtersPanel: showFilters ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label>{t('IP Address')}</Label>
              <Input
                placeholder={t('Filter by IP address')}
                value={draftFilters.ip}
                onChange={(e) => setDraftFilters((f) => ({ ...f, ip: e.target.value }))}
              />
            </div>
            {canFilterByRole ? (
              <div className="space-y-1">
                <Label>{t('Role')}</Label>
                <Select
                  value={draftFilters.role || 'all'}
                  onValueChange={(value) =>
                    setDraftFilters((f) => ({ ...f, role: value === 'all' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Filter by role')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All roles')}</SelectItem>
                    {Object.entries(roleOptions).map(([name, label]) => (
                      <SelectItem key={name} value={name}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="flex items-end gap-2">
              <Button type="button" size="sm" onClick={applyFilters}>
                {t('Apply')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                {t('Clear')}
              </Button>
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
          icon={History}
          title={t('No login history found')}
          description={t('No login records available.')}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          className="h-auto py-8"
        />
      ) : (
        <DataTable
          embedded
          columns={columns}
          data={rows}
          sortKey={sortField || undefined}
          sortDirection={sortDirection}
          onSort={setSort}
        />
      )}
    </ModuleListCard>
  )
}
