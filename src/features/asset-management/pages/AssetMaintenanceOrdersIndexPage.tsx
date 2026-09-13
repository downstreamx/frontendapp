import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { paths } from '@/lib/paths'
import {
  createMaintenanceOrder,
  listAssetsPaginated,
  listMaintenanceOrdersPaginated,
  type AssetMaintenanceOrder,
} from '../asset-management-api'
import { usePageChrome } from '@/contexts/page-chrome-context'

export function AssetMaintenanceOrdersIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [assetId, setAssetId] = useState('')
  const [title, setTitle] = useState('')

  usePageChrome(t('Maintenance orders'), t('Assets'))

  const assetsQuery = useQuery({
    queryKey: ['assets-picker'],
    queryFn: () => listAssetsPaginated({ per_page: '200' }),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance-orders'],
    queryFn: () => listMaintenanceOrdersPaginated({ per_page: '50' }),
  })

  const columns: Column<AssetMaintenanceOrder>[] = [
    { key: 'order_number', header: t('Order #') },
    { key: 'title', header: t('Title') },
    { key: 'status', header: t('Status') },
    {
      key: 'asset',
      header: t('Asset'),
      render: (_, row) =>
        row.asset ? (
          <Link
            className="text-primary hover:underline"
            to={paths.assetManagement.assetShow(row.asset_id)}
          >
            {row.asset.asset_tag} — {row.asset.name}
          </Link>
        ) : (
          '—'
        ),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Maintenance orders')}
        canCreate
        onCreateClick={() => setOpen(true)}
        isLoading={isLoading}
      >
        <DataTable embedded data={data?.rows ?? []} columns={columns} />
      </ModuleListCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('New maintenance order')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t('Asset')}</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
              >
                <option value="">{t('Select asset')}</option>
                {assetsQuery.data?.rows?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.asset_tag} — {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t('Title')}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={async () => {
                if (!assetId || !title.trim()) {
                  toast.error(t('Asset and title are required.'))
                  return
                }
                await createMaintenanceOrder({
                  asset_id: Number(assetId),
                  title: title.trim(),
                })
                toast.success(t('Created.'))
                setOpen(false)
                setTitle('')
                setAssetId('')
                void queryClient.invalidateQueries({ queryKey: ['maintenance-orders'] })
              }}
            >
              {t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
