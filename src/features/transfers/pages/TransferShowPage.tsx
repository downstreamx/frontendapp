import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTransfer, postTransfer } from '../api'
import { paths } from '@/lib/paths'

export function TransferShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: transfer, isLoading } = useQuery({
    queryKey: ['transfers', id],
    queryFn: () => getTransfer(id!),
    enabled: Boolean(id),
  })

  const postMutation = useMutation({
    mutationFn: () => postTransfer(id!),
    onSuccess: () => {
      toast.success(t('Transfer posted'))
      queryClient.invalidateQueries({ queryKey: ['transfers', id] })
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
    },
    onError: () => toast.error(t('Failed to post transfer')),
  })

  if (isLoading) {
    return <p className="text-muted-foreground">{t('Loading…')}</p>
  }

  if (!transfer) {
    return <p className="text-destructive">{t('Transfer not found')}</p>
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('Transfer #{{id}}', { id: transfer.id })}</h1>
        <Link to={paths.transfers.index} className="text-sm text-primary hover:underline">
          {t('Back to list')}
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t('Details')}</CardTitle>
          {transfer.status !== 'posted' && (
            <Button
              size="sm"
              disabled={postMutation.isPending}
              onClick={() => postMutation.mutate()}
            >
              {t('Post')}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">{t('Status')}:</span> {transfer.status ?? 'draft'}
          </p>
          <p>
            <span className="text-muted-foreground">{t('From depot')}:</span> {transfer.from_depot}
          </p>
          <p>
            <span className="text-muted-foreground">{t('To depot')}:</span> {transfer.to_depot}
          </p>
          <p>
            <span className="text-muted-foreground">{t('Product')}:</span> {transfer.product_id}
          </p>
          <p>
            <span className="text-muted-foreground">{t('Quantity')}:</span> {transfer.quantity}
          </p>
          {transfer.notes && (
            <p>
              <span className="text-muted-foreground">{t('Notes')}:</span> {transfer.notes}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
