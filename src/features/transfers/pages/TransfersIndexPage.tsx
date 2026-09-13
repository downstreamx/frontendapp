import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeftRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { formatQuantity } from '@/lib/format-quantity'
import { listTransfers, postTransfer, type Transfer } from '../api'
import { paths } from '@/lib/paths'
import { TransferFormDialog } from '../components/TransferFormDialog'

export function TransfersIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: () => listTransfers(),
  })

  const postMutation = useMutation({
    mutationFn: postTransfer,
    onSuccess: () => {
      toast.success(t('Transfer posted'))
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
    },
    onError: () => toast.error(t('Failed to post transfer')),
  })

  const columns: Column<Transfer>[] = [
    {
      key: 'id',
      header: t('Transfer'),
      render: (_, row) => (
        <Link to={paths.transfers.show(row.id)} className="font-medium text-primary hover:underline">
          {t('Transfer #{{id}}', { id: row.id })}
        </Link>
      ),
    },
    {
      key: 'quantity',
      header: t('Qty'),
      render: (_, row) => formatQuantity(row.quantity),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (value) => String(value ?? '—'),
    },
    {
      key: 'actions',
      header: t('Action'),
      render: (_, row) =>
        row.status !== 'posted' ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={postMutation.isPending}
            onClick={() => postMutation.mutate(row.id)}
          >
            {t('Post')}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ]

  return (
    <>
      <ModuleListCard
        title={t('Transfers')}
        canCreate
        onCreateClick={() => setDialogOpen(true)}
        isLoading={isLoading}
      >
        {rows.length === 0 && !isLoading ? (
          <NoRecordsFound
            icon={ArrowLeftRight}
            title={t('No transfers yet.')}
            description={t('Create a transfer between depots.')}
            onCreateClick={() => setDialogOpen(true)}
            className="h-auto py-8"
          />
        ) : (
          <DataTable embedded data={rows} columns={columns} />
        )}
      </ModuleListCard>

      <TransferFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={(saved) => {
          void queryClient.invalidateQueries({ queryKey: ['transfers'] })
          navigate(paths.transfers.show(saved.id))
        }}
      />
    </>
  )
}
