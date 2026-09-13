import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Edit, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getApiErrorMessage } from '@/lib/errors'
import { getPackageAlias } from '@/utils/helpers'
import { fetchAddOnPrices, updateAddOnPrice, type AddOnPriceRow } from '@/features/saas/saas-api'

export function PlanAddOnPricingPanel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<AddOnPriceRow | null>(null)
  const [monthly, setMonthly] = useState('')
  const [yearly, setYearly] = useState('')
  const [displayName, setDisplayName] = useState('')

  const { data: addons = [], isLoading } = useQuery({
    queryKey: ['saas', 'add-on-prices'],
    queryFn: fetchAddOnPrices,
  })

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return addons
    return addons.filter(
      (row) =>
        row.module.toLowerCase().includes(term) ||
        row.name.toLowerCase().includes(term) ||
        (getPackageAlias(row.module) ?? '').toLowerCase().includes(term),
    )
  }, [addons, search])

  const openEdit = (row: AddOnPriceRow) => {
    setEditing(row)
    setMonthly(String(row.monthly_price ?? '0'))
    setYearly(String(row.yearly_price ?? '0'))
    setDisplayName(row.name)
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      updateAddOnPrice({
        module: editing!.module,
        monthly_price: Number(monthly),
        yearly_price: Number(yearly),
        name: displayName.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(t('Add-on pricing updated'))
      setEditing(null)
      void queryClient.invalidateQueries({ queryKey: ['saas', 'add-on-prices'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to update pricing'))),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Add-on module pricing')}</CardTitle>
        <CardDescription>
          {t('Monthly and yearly prices charged when companies add modules beyond their plan.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder={t('Search modules…')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('No billable add-ons found.')}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((row) => (
              <div
                key={row.module}
                className="flex flex-col gap-2 rounded-lg border p-4 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-medium">{getPackageAlias(row.module) ?? row.name}</p>
                      <p className="text-xs text-muted-foreground">{row.module}</p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(row)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-muted-foreground">
                  <span>
                    {t('Monthly')}: {row.monthly_price ?? 0}
                  </span>
                  <span className="mx-2">·</span>
                  <span>
                    {t('Yearly')}: {row.yearly_price ?? 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('Edit pricing')} — {editing ? (getPackageAlias(editing.module) ?? editing.name) : ''}
            </DialogTitle>
            <DialogDescription>{t('Set how much this module costs per month or year.')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{t('Display name')}</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t('Monthly price')}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={monthly}
                  onChange={(e) => setMonthly(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Yearly price')}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={yearly}
                  onChange={(e) => setYearly(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              {t('Cancel')}
            </Button>
            <Button type="button" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
