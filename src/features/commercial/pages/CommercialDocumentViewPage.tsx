import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ResourceViewPage } from '@/components/resource/resource-view-page'
import { api } from '@/lib/api'
import { paths } from '@/lib/paths'
import {
  acceptSalesOrder,
  approveSalesReturn,
  completeSalesReturn,
  convertSalesOrderToInvoice,
  approvePurchaseReturn,
  completePurchaseReturn,
} from '../documents-api'
import type { CommercialDocumentType } from './CommercialDocumentEditorPage'

type Props = {
  title: string
  apiEndpoint: string
  indexPath: string
  documentType: CommercialDocumentType
}

export function CommercialDocumentViewPage({ title, apiEndpoint, indexPath, documentType }: Props) {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: doc } = useQuery({
    queryKey: ['commercial-document-view', documentType, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data: res } = await api.get(`${apiEndpoint}/${id}`)
      return (res.data as { data?: Record<string, unknown> }).data ?? res.data
    },
  })

  const status = String((doc as Record<string, unknown>)?.status ?? 'draft')
  const converted = Boolean((doc as Record<string, unknown>)?.converted_to_invoice)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['resource', apiEndpoint, id] })
    queryClient.invalidateQueries({ queryKey: ['commercial-document-view', documentType, id] })
  }

  const acceptMutation = useMutation({
    mutationFn: () => acceptSalesOrder(id!),
    onSuccess: () => {
      toast.success(t('Proposal accepted'))
      invalidate()
    },
    onError: () => toast.error(t('Failed to accept sales order')),
  })

  const convertMutation = useMutation({
    mutationFn: () => convertSalesOrderToInvoice(id!),
    onSuccess: (invoice) => {
      toast.success(t('Converted to invoice'))
      const invId = (invoice as { id: number }).id
      navigate(paths.sales.invoices + `/${invId}`)
    },
    onError: () => toast.error(t('Failed to convert sales order')),
  })

  const approveReturnMutation = useMutation({
    mutationFn: () =>
      documentType === 'sales-return' ? approveSalesReturn(id!) : approvePurchaseReturn(id!),
    onSuccess: () => {
      toast.success(t('Return approved'))
      invalidate()
    },
    onError: () => toast.error(t('Failed to approve return')),
  })

  const completeReturnMutation = useMutation({
    mutationFn: () =>
      documentType === 'sales-return' ? completeSalesReturn(id!) : completePurchaseReturn(id!),
    onSuccess: () => {
      toast.success(t('Return completed'))
      invalidate()
    },
    onError: () => toast.error(t('Failed to complete return')),
  })

  if (!id) return null

  const editPath =
    documentType === 'sales-order'
      ? paths.sales.orderEdit(id)
      : documentType === 'sales-return'
        ? paths.sales.returnEdit(id)
        : paths.purchase.returnEdit(id)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-end">
        {status === 'draft' && (
          <Button asChild size="sm" variant="outline">
            <Link to={editPath}>{t('Edit')}</Link>
          </Button>
        )}
        {documentType === 'sales-order' && status === 'draft' && !converted && (
          <Button size="sm" variant="outline" disabled={acceptMutation.isPending} onClick={() => acceptMutation.mutate()}>
            {t('Accept')}
          </Button>
        )}
        {documentType === 'sales-order' && status === 'accepted' && !converted && (
          <Button size="sm" disabled={convertMutation.isPending} onClick={() => convertMutation.mutate()}>
            {t('Convert to invoice')}
          </Button>
        )}
        {(documentType === 'sales-return' || documentType === 'purchase-return') && status === 'draft' && (
          <Button size="sm" disabled={approveReturnMutation.isPending} onClick={() => approveReturnMutation.mutate()}>
            {t('Approve')}
          </Button>
        )}
        {(documentType === 'sales-return' || documentType === 'purchase-return') && status === 'approved' && (
          <Button size="sm" disabled={completeReturnMutation.isPending} onClick={() => completeReturnMutation.mutate()}>
            {t('Complete')}
          </Button>
        )}
      </div>

      <ResourceViewPage
        title={title}
        apiEndpoint={apiEndpoint}
        id={id}
        indexPath={indexPath}
      />

      {documentType === 'sales-order' && converted && (doc as Record<string, unknown>)?.invoice_id != null && (
        <p className="text-sm text-muted-foreground">
          {t('Linked invoice')}:{' '}
          <Link
            to={`${paths.sales.invoices}/${(doc as Record<string, unknown>).invoice_id}`}
            className="text-primary hover:underline"
          >
            #{String((doc as Record<string, unknown>).invoice_id)}
          </Link>
        </p>
      )}
    </div>
  )
}
