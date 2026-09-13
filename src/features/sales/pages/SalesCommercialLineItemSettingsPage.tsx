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
import { useSalesPageChrome } from '../hooks/use-sales-page-chrome'
import {
  getSalesCommercialLineItemSettings,
  updateSalesCommercialLineItemSettings,
} from '../sales-commercial-line-item-settings-api'

export function SalesCommercialLineItemSettingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()

  useSalesPageChrome(t('Line items'), t('Sales system setup'))

  const canEdit = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'manage-sales-payment-terms',
  )

  const settingsQuery = useQuery({
    queryKey: queryKeys.sales.commercialLineItemSettings(),
    queryFn: getSalesCommercialLineItemSettings,
  })

  const [singleLineSalesOrder, setSingleLineSalesOrder] = useState(true)
  const [singleLineSalesInvoice, setSingleLineSalesInvoice] = useState(true)

  useEffect(() => {
    if (!settingsQuery.data) return
    setSingleLineSalesOrder(settingsQuery.data.single_line_sales_order)
    setSingleLineSalesInvoice(settingsQuery.data.single_line_sales_invoice)
  }, [settingsQuery.data])

  const saveMutation = useMutation({
    mutationFn: updateSalesCommercialLineItemSettings,
    onSuccess: () => {
      toast.success(t('Line item settings saved.'))
      void queryClient.invalidateQueries({ queryKey: queryKeys.sales.commercialLineItemSettings() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.sales.orders.createMeta() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.sales.invoices.createMeta() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.commercial.invoiceCreateMeta('sales') })
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, t('Failed to save line item settings'))),
  })

  const handleSave = () => {
    saveMutation.mutate({
      single_line_sales_order: singleLineSalesOrder,
      single_line_sales_invoice: singleLineSalesInvoice,
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
          {t(
            'Control whether sales orders and sales invoices allow one product line or multiple lines per document.',
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">{t('Single line item per sales order')}</p>
            <p className="text-sm text-muted-foreground">
              {t('When enabled, each sales order can include only one product line.')}
            </p>
          </div>
          <Switch
            checked={singleLineSalesOrder}
            onCheckedChange={setSingleLineSalesOrder}
            disabled={!canEdit || settingsQuery.isLoading}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">{t('Single line item per sales invoice')}</p>
            <p className="text-sm text-muted-foreground">
              {t('When enabled, each sales invoice can include only one product line.')}
            </p>
          </div>
          <Switch
            checked={singleLineSalesInvoice}
            onCheckedChange={setSingleLineSalesInvoice}
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
