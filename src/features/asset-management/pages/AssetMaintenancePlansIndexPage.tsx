import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import {
  createMaintenancePlan,
  listAssetsPaginated,
  listMaintenancePlans,
  type AssetMaintenancePlan,
} from '../asset-management-api'
import { usePageChrome } from '@/contexts/page-chrome-context'

export function AssetMaintenancePlansIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [assetId, setAssetId] = useState('')
  const [name, setName] = useState('')
  const [intervalDays, setIntervalDays] = useState('90')

  usePageChrome(t('Maintenance plans'), t('Assets'))

  const assetsQuery = useQuery({
    queryKey: ['assets-picker'],
    queryFn: () => listAssetsPaginated({ per_page: '200' }),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance-plans'],
    queryFn: listMaintenancePlans,
  })

  const columns: Column<AssetMaintenancePlan>[] = [
    { key: 'name', header: t('Plan') },
    {
      key: 'asset',
      header: t('Asset'),
      render: (_, row) =>
        row.asset ? `${row.asset.asset_tag} — ${row.asset.name}` : '—',
    },
    { key: 'interval_days', header: t('Interval (days)') },
    { key: 'next_due_date', header: t('Next due') },
    {
      key: 'is_active',
      header: t('Active'),
      render: (_, row) => (row.is_active ? t('Yes') : t('No')),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Maintenance plans')}
        canCreate
        onCreateClick={() => setOpen(true)}
        isLoading={isLoading}
      >
        <DataTable embedded data={data ?? []} columns={columns} />
      </ModuleListCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('New maintenance plan')}</DialogTitle>
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
              <Label>{t('Name')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>{t('Interval (days)')}</Label>
              <Input
                type="number"
                min={1}
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={async () => {
                if (!assetId || !name.trim()) {
                  toast.error(t('Asset and name are required.'))
                  return
                }
                await createMaintenancePlan({
                  asset_id: Number(assetId),
                  name: name.trim(),
                  interval_days: intervalDays ? Number(intervalDays) : undefined,
                })
                toast.success(t('Created.'))
                setOpen(false)
                void queryClient.invalidateQueries({ queryKey: ['maintenance-plans'] })
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
