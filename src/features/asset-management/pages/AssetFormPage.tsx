import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { paths } from '@/lib/paths'
import {
  createAsset,
  fetchAssetEditMeta,
  fetchAssetMeta,
  updateAsset,
} from '../asset-management-api'
import { usePageChrome } from '@/contexts/page-chrome-context'

export function AssetFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    asset_tag: '',
    name: '',
    category_id: '',
    location_id: '',
    depot_id: '',
    status: 'active',
    serial_number: '',
    purchase_date: '',
    purchase_cost: '',
    warranty_expiry: '',
    custodian_user_id: '',
    notes: '',
    useful_life_months: '',
    salvage_value: '',
    is_capitalized: false,
  })

  usePageChrome(isEdit ? t('Edit Asset') : t('Create Asset'), t('Assets'))

  const metaQuery = useQuery({
    queryKey: ['asset-meta', id],
    queryFn: () => (isEdit ? fetchAssetEditMeta(id!) : fetchAssetMeta()),
  })

  useEffect(() => {
    if (!isEdit || !metaQuery.data?.asset) return
    const a = metaQuery.data.asset
    setForm({
      asset_tag: a.asset_tag,
      name: a.name,
      category_id: a.category_id ? String(a.category_id) : '',
      location_id: a.location_id ? String(a.location_id) : '',
      depot_id: a.depot_id ? String(a.depot_id) : '',
      status: a.status,
      serial_number: a.serial_number ?? '',
      purchase_date: a.purchase_date ?? '',
      purchase_cost: a.purchase_cost != null ? String(a.purchase_cost) : '',
      warranty_expiry: a.warranty_expiry ?? '',
      custodian_user_id: a.custodian_user_id ? String(a.custodian_user_id) : '',
      notes: a.notes ?? '',
      useful_life_months: a.useful_life_months ? String(a.useful_life_months) : '',
      salvage_value: a.salvage_value != null ? String(a.salvage_value) : '',
      is_capitalized: Boolean(a.is_capitalized),
    })
  }, [isEdit, metaQuery.data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        asset_tag: form.asset_tag,
        name: form.name,
        status: form.status,
        serial_number: form.serial_number || undefined,
        purchase_date: form.purchase_date || undefined,
        purchase_cost: form.purchase_cost ? Number(form.purchase_cost) : undefined,
        warranty_expiry: form.warranty_expiry || undefined,
        notes: form.notes || undefined,
        category_id: form.category_id ? Number(form.category_id) : undefined,
        location_id: form.location_id ? Number(form.location_id) : undefined,
        depot_id: form.depot_id ? Number(form.depot_id) : undefined,
        custodian_user_id: form.custodian_user_id ? Number(form.custodian_user_id) : undefined,
        useful_life_months: form.useful_life_months ? Number(form.useful_life_months) : undefined,
        salvage_value: form.salvage_value ? Number(form.salvage_value) : undefined,
        is_capitalized: form.is_capitalized,
      }
      if (isEdit) return updateAsset(Number(id), payload)
      return createAsset(payload)
    },
    onSuccess: (row) => {
      toast.success(t('Asset saved.'))
      void queryClient.invalidateQueries({ queryKey: ['assets'] })
      navigate(paths.assetManagement.assetShow(row.id))
    },
    onError: () => toast.error(t('Failed to save asset.')),
  })

  if (metaQuery.isLoading) {
    return <Skeleton className="m-6 h-64 w-full" />
  }

  const meta = metaQuery.data

  return (
    <form
      className="mx-auto max-w-3xl space-y-6 p-6"
      onSubmit={(e) => {
        e.preventDefault()
        saveMutation.mutate()
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{t('Asset details')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('Asset tag')} *</Label>
            <Input
              value={form.asset_tag}
              onChange={(e) => setForm((f) => ({ ...f, asset_tag: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t('Name')} *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t('Category')}</Label>
            <Select
              value={form.category_id || undefined}
              onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select category')} />
              </SelectTrigger>
              <SelectContent>
                {meta?.categories?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('Location')}</Label>
            <Select
              value={form.location_id || undefined}
              onValueChange={(v) => setForm((f) => ({ ...f, location_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select location')} />
              </SelectTrigger>
              <SelectContent>
                {meta?.locations?.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('Depot')}</Label>
            <Select
              value={form.depot_id || undefined}
              onValueChange={(v) => setForm((f) => ({ ...f, depot_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select depot')} />
              </SelectTrigger>
              <SelectContent>
                {meta?.depots?.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('Status')}</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meta?.asset_statuses?.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t('Notes')}</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => navigate(paths.assetManagement.assets)}>
          {t('Cancel')}
        </Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? t('Saving...') : t('Save')}
        </Button>
      </div>
    </form>
  )
}
