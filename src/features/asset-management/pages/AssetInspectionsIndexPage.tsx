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
  createInspection,
  listAssetsPaginated,
  listInspections,
  type AssetInspection,
} from '../asset-management-api'
import { usePageChrome } from '@/contexts/page-chrome-context'

export function AssetInspectionsIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [assetId, setAssetId] = useState('')
  const [inspectionDate, setInspectionDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  )

  usePageChrome(t('Inspections'), t('Assets'))

  const assetsQuery = useQuery({
    queryKey: ['assets-picker'],
    queryFn: () => listAssetsPaginated({ per_page: '200' }),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['asset-inspections'],
    queryFn: listInspections,
  })

  const columns: Column<AssetInspection>[] = [
    {
      key: 'asset',
      header: t('Asset'),
      render: (_, row) =>
        row.asset ? `${row.asset.asset_tag} — ${row.asset.name}` : '—',
    },
    { key: 'inspection_date', header: t('Date') },
    { key: 'result', header: t('Result') },
    { key: 'next_due_date', header: t('Next due') },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Inspections')}
        canCreate
        onCreateClick={() => setOpen(true)}
        isLoading={isLoading}
      >
        <DataTable embedded data={data ?? []} columns={columns} />
      </ModuleListCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('New inspection')}</DialogTitle>
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
              <Label>{t('Inspection date')}</Label>
              <Input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={async () => {
                if (!assetId || !inspectionDate) {
                  toast.error(t('Asset and date are required.'))
                  return
                }
                await createInspection({
                  asset_id: Number(assetId),
                  inspection_date: inspectionDate,
                })
                toast.success(t('Created.'))
                setOpen(false)
                void queryClient.invalidateQueries({ queryKey: ['asset-inspections'] })
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
