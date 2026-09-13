import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import { useListToolbar } from '@/hooks/use-list-toolbar'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'
import { formatCurrency } from '@/utils/helpers'
import {
  deleteAsset,
  fetchAssetMeta,
  listAssetsPaginated,
  type AssetRow,
} from '../asset-management-api'

export function AssetsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toolbar = useListToolbar()
  const [page, setPage] = useState(1)
  const [depotId, setDepotId] = useState('')
  const [status, setStatus] = useState('')

  usePageChrome(t('Assets'), t('Assets'))

  const metaQuery = useQuery({ queryKey: ['asset-meta'], queryFn: fetchAssetMeta })

  const listParams = useMemo(
    () => ({
      per_page: toolbar.perPage,
      page: String(page),
      ...(toolbar.search ? { search: toolbar.search } : {}),
      ...(depotId ? { depot_id: depotId } : {}),
      ...(status ? { status } : {}),
    }),
    [page, toolbar.perPage, toolbar.search, depotId, status],
  )

  const { data, isLoading } = useQuery({
    queryKey: ['assets', listParams],
    queryFn: () => listAssetsPaginated(listParams),
  })

  const columns: Column<AssetRow>[] = [
    { key: 'asset_tag', header: t('Tag'), sortable: true },
    { key: 'name', header: t('Name'), sortable: true },
    {
      key: 'category',
      header: t('Category'),
      render: (_, row) => row.category?.name ?? '—',
    },
    {
      key: 'depot',
      header: t('Depot'),
      render: (_, row) => row.depot?.name ?? '—',
    },
    { key: 'status', header: t('Status') },
    {
      key: 'purchase_cost',
      header: t('Cost'),
      render: (_, row) =>
        row.purchase_cost != null ? formatCurrency(row.purchase_cost) : '—',
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <div className="flex gap-1">
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.assetManagement.assetShow(row.id)}>{t('View')}</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.assetManagement.assetEdit(row.id)}>{t('Edit')}</Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={async () => {
              if (!confirm(t('Delete this asset?'))) return
              await deleteAsset(row.id)
              toast.success(t('Asset deleted.'))
              void queryClient.invalidateQueries({ queryKey: ['assets'] })
            }}
          >
            {t('Delete')}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <ModuleListCard
      title={t('Assets')}
      canCreate
      onCreateClick={() => navigate(paths.assetManagement.assetCreate)}
      isLoading={isLoading}
      searchToolbar={{
        searchValue: toolbar.draftSearch,
        onSearchChange: toolbar.setDraftSearch,
        onSearch: () => {
          toolbar.applySearch()
          setPage(1)
        },
        searchPlaceholder: t('Search by tag, name, serial...'),
        controls: (
          <>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={depotId}
              onChange={(e) => {
                setDepotId(e.target.value)
                setPage(1)
              }}
            >
              <option value="">{t('All depots')}</option>
              {metaQuery.data?.depots?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="">{t('All statuses')}</option>
              {metaQuery.data?.asset_statuses?.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <PerPageSelector value={toolbar.perPage} onChange={toolbar.setPerPage} />
          </>
        ),
      }}
      pagination={
        data?.meta
          ? { ...data.meta, onPageChange: setPage }
          : undefined
      }
    >
      <DataTable embedded data={data?.rows ?? []} columns={columns} />
      {metaQuery.data?.asset_statuses?.length ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {t('Statuses')}: {metaQuery.data.asset_statuses.join(', ')}
        </p>
      ) : null}
    </ModuleListCard>
  )
}
