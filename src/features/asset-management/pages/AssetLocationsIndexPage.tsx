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
  createAssetLocation,
  deleteAssetLocation,
  fetchAssetMeta,
  listAssetLocations,
  updateAssetLocation,
  type AssetLocation,
} from '../asset-management-api'
import { usePageChrome } from '@/contexts/page-chrome-context'

export function AssetLocationsIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AssetLocation | null>(null)
  const [name, setName] = useState('')
  const [depotId, setDepotId] = useState('')

  usePageChrome(t('Locations'), t('Assets'))

  const metaQuery = useQuery({ queryKey: ['asset-meta'], queryFn: fetchAssetMeta })
  const { data, isLoading } = useQuery({
    queryKey: ['asset-locations'],
    queryFn: listAssetLocations,
  })

  const columns: Column<AssetLocation>[] = [
    { key: 'name', header: t('Name') },
    { key: 'code', header: t('Code') },
    {
      key: 'depot',
      header: t('Depot'),
      render: (_, row) => row.depot?.name ?? '—',
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (_, row) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(row)
              setName(row.name)
              setDepotId(row.depot_id ? String(row.depot_id) : '')
              setOpen(true)
            }}
          >
            {t('Edit')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={async () => {
              await deleteAssetLocation(row.id)
              toast.success(t('Deleted.'))
              void queryClient.invalidateQueries({ queryKey: ['asset-locations'] })
            }}
          >
            {t('Delete')}
          </Button>
        </div>
      ),
    },
  ]

  const save = async () => {
    const payload = { name, depot_id: depotId ? Number(depotId) : undefined }
    if (editing) await updateAssetLocation(editing.id, payload)
    else await createAssetLocation(payload)
    toast.success(t('Saved.'))
    setOpen(false)
    setEditing(null)
    void queryClient.invalidateQueries({ queryKey: ['asset-locations'] })
  }

  return (
    <>
      <ModuleListCard
        title={t('Locations')}
        canCreate
        onCreateClick={() => {
          setEditing(null)
          setName('')
          setDepotId('')
          setOpen(true)
        }}
        isLoading={isLoading}
      >
        <DataTable embedded data={data ?? []} columns={columns} />
      </ModuleListCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('Edit location') : t('New location')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t('Name')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>{t('Depot')}</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={depotId}
                onChange={(e) => setDepotId(e.target.value)}
              >
                <option value="">{t('None')}</option>
                {metaQuery.data?.depots?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void save()}>{t('Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
