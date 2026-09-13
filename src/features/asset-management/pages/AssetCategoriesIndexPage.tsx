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
  createAssetCategory,
  deleteAssetCategory,
  listAssetCategories,
  updateAssetCategory,
  type AssetCategory,
} from '../asset-management-api'
import { usePageChrome } from '@/contexts/page-chrome-context'

export function AssetCategoriesIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AssetCategory | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  usePageChrome(t('Categories'), t('Assets'))

  const { data, isLoading } = useQuery({
    queryKey: ['asset-categories'],
    queryFn: listAssetCategories,
  })

  const columns: Column<AssetCategory>[] = [
    { key: 'name', header: t('Name') },
    { key: 'code', header: t('Code') },
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
              setCode(row.code ?? '')
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
              await deleteAssetCategory(row.id)
              toast.success(t('Deleted.'))
              void queryClient.invalidateQueries({ queryKey: ['asset-categories'] })
            }}
          >
            {t('Delete')}
          </Button>
        </div>
      ),
    },
  ]

  const save = async () => {
    const payload = { name, code: code || undefined }
    if (editing) await updateAssetCategory(editing.id, payload)
    else await createAssetCategory(payload)
    toast.success(t('Saved.'))
    setOpen(false)
    void queryClient.invalidateQueries({ queryKey: ['asset-categories'] })
  }

  return (
    <>
      <ModuleListCard
        title={t('Categories')}
        canCreate
        onCreateClick={() => {
          setEditing(null)
          setName('')
          setCode('')
          setOpen(true)
        }}
        isLoading={isLoading}
      >
        <DataTable embedded data={data ?? []} columns={columns} />
      </ModuleListCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('Edit category') : t('New category')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t('Name')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>{t('Code')}</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} />
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
