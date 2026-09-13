import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatQuantity } from '@/lib/format-quantity'
import { getDepot, type DepotDetail, type DepotProductStock } from '../api'

type Props = {
  depotId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DepotDetailDialog({ depotId, open, onOpenChange }: Props) {
  const { t } = useTranslation()

  const { data: depot, isLoading } = useQuery({
    queryKey: ['depots', depotId, 'detail'],
    queryFn: () => getDepot(depotId!),
    enabled: open && depotId != null,
  })

  const detail = depot as DepotDetail | undefined
  const products = detail?.products ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{detail?.name ?? t('Depot details')}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : detail ? (
          <div className="space-y-6">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">{t('Status')}</p>
                <Badge variant={detail.is_active !== false ? 'default' : 'secondary'}>
                  {detail.is_active !== false ? t('Active') : t('Inactive')}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">{t('Contact')}</p>
                <p>{detail.contact_person || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('Phone')}</p>
                <p>{detail.phone || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('Email')}</p>
                <p>{detail.email || '—'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">{t('Address')}</p>
                <p>
                  {[detail.address, detail.city, detail.state, detail.zip_code, detail.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold">{t('Products in depot')}</h3>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('No stock records for this depot.')}</p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-3 py-2 text-left font-medium">{t('Product')}</th>
                        <th className="px-3 py-2 text-left font-medium">{t('SKU')}</th>
                        <th className="px-3 py-2 text-right font-medium">{t('Quantity')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((row: DepotProductStock) => (
                        <tr key={row.product_id} className="border-b last:border-0">
                          <td className="px-3 py-2">{row.name ?? '—'}</td>
                          <td className="px-3 py-2 text-muted-foreground">{row.sku ?? '—'}</td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatQuantity(row.quantity, row.unit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
