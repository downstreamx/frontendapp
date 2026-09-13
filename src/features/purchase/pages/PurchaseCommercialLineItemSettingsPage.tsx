import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Layers, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useAppContext } from '@/contexts/app-context'
import { getApiErrorMessage } from '@/lib/errors'
import { hasPermission } from '@/lib/permissions'
import { queryKeys } from '@/lib/query-keys'
import { usePurchasePageChrome } from '../hooks/use-purchase-page-chrome'
import {
  getPurchaseCommercialLineItemSettings,
  updatePurchaseCommercialLineItemSettings,
} from '../purchase-commercial-line-item-settings-api'

export function PurchaseCommercialLineItemSettingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()

  usePurchasePageChrome(t('Line items'), t('Procurement system setup'))

  const canEdit = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'manage-procurement-payment-terms',
  )

  const settingsQuery = useQuery({
    queryKey: queryKeys.purchase.commercialLineItemSettings(),
    queryFn: getPurchaseCommercialLineItemSettings,
  })

  const [singleLinePurchaseInvoice, setSingleLinePurchaseInvoice] = useState(true)

  useEffect(() => {
    if (!settingsQuery.data) return
    setSingleLinePurchaseInvoice(settingsQuery.data.single_line_purchase_invoice)
  }, [settingsQuery.data])

  const saveMutation = useMutation({
    mutationFn: updatePurchaseCommercialLineItemSettings,
    onSuccess: () => {
      toast.success(t('Line item settings saved.'))
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchase.commercialLineItemSettings() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchase.invoices.createMeta() })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.commercial.invoiceCreateMeta('purchase'),
      })
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, t('Failed to save line item settings'))),
  })

  const handleSave = () => {
    saveMutation.mutate({
      single_line_purchase_invoice: singleLinePurchaseInvoice,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          {t('Commercial line items')}
        </CardTitle>
        <CardDescription>
          {t('Control whether purchase invoices allow one product line or multiple lines per document.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">{t('Single line item per purchase invoice')}</p>
            <p className="text-sm text-muted-foreground">
              {t('When enabled, each purchase invoice can include only one product line.')}
            </p>
          </div>
          <Switch
            checked={singleLinePurchaseInvoice}
            onCheckedChange={setSingleLinePurchaseInvoice}
            disabled={!canEdit || settingsQuery.isLoading}
          />
        </div>

        {canEdit ? (
          <Button type="button" onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {t('Save')}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
