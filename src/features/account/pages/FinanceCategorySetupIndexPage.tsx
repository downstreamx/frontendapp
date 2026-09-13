import { useMemo, useState } from 'react'
import { Edit, Settings, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { getApiErrorMessage } from '@/lib/errors'
import { FinanceCategoryFormDialog } from '../components/FinanceCategoryFormDialog'
import {
  deleteFinanceCategory,
  listFinanceCategoriesPaginated,
  type FinanceCategory,
  type FinanceCategoryKind,
} from '../finance-categories-api'

type Props = {
  kind: FinanceCategoryKind
}

export function FinanceCategorySetupIndexPage({ kind }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const isRevenue = kind === 'revenue'
  const listKey = `${kind}-categories`

  const canCreate = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    isRevenue ? 'create-revenue-categories' : 'create-expense-categories',
  )
  const canEdit = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    isRevenue ? 'edit-revenue-categories' : 'edit-expense-categories',
  )
  const canDelete = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    isRevenue ? 'delete-revenue-categories' : 'delete-expense-categories',
  )

  const [modalMode, setModalMode] = useState<'create' | 'edit' | ''>('')
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FinanceCategory | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: [listKey],
    queryFn: () => listFinanceCategoriesPaginated(kind, { per_page: '200' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFinanceCategory(kind, id),
    onSuccess: () => {
      toast.success(
        isRevenue
          ? t('The revenue category has been deleted.')
          : t('The expense category has been deleted.'),
      )
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: [listKey] })
      void queryClient.invalidateQueries({ queryKey: ['revenues'] })
      void queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete category'))),
  })

  const rows = data?.rows ?? []
  const title = isRevenue ? t('Revenue Categories') : t('Expense Categories')

  const columns: Column<FinanceCategory>[] = useMemo(
    () => [
      { key: 'category_name', header: t('Category Name') },
      { key: 'category_code', header: t('Category Code') },
      {
        key: 'gl_account',
        header: t('GL Account'),
        render: (_, row) =>
          row.gl_account
            ? `${row.gl_account.account_code} — ${row.gl_account.account_name}`
            : '—',
      },
      {
        key: 'description',
        header: t('Description'),
        render: (value) => String(value ?? '—'),
      },
      {
        key: 'is_active',
        header: t('Is Active'),
        render: (_, row) => (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              row.is_active
                ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
            }`}
          >
            {row.is_active ? t('Active') : t('Inactive')}
          </span>
        ),
      },
      {
        key: 'actions',
        header: t('Actions'),
        render: (_, row) => (
          <div className="flex gap-1">
            {canEdit ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                    onClick={() => {
                      setEditingCategory(row)
                      setModalMode('edit')
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('Edit')}</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
            {canDelete ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(row)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('Delete')}</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        ),
      },
    ],
    [canDelete, canEdit, t],
  )

  const visibleColumns =
    canEdit || canDelete ? columns : columns.filter((c) => c.key !== 'actions')

  return (
    <TooltipProvider>
      <ModuleListCard
        title={title}
        canCreate={canCreate}
        onCreateClick={() => {
          setEditingCategory(null)
          setModalMode('create')
        }}
        isLoading={isLoading}
        error={!!error}
        pagination={
          data?.meta && data.meta.from != null && data.meta.from > 1 ? data.meta : undefined
        }
      >
        {rows.length === 0 ? (
          <NoRecordsFound
            icon={Settings}
            title={
              isRevenue ? t('No revenue categories found') : t('No expense categories found')
            }
            description={
              isRevenue
                ? t('Get started by creating your first revenue category.')
                : t('Get started by creating your first expense category.')
            }
            createPermission={
              isRevenue ? 'create-revenue-categories' : 'create-expense-categories'
            }
            onCreateClick={() => {
              setEditingCategory(null)
              setModalMode('create')
            }}
            createButtonText={isRevenue ? t('Create Revenue Categories') : t('Create Expense Categories')}
            className="h-auto py-8"
          />
        ) : (
          <DataTable embedded data={rows} columns={visibleColumns} />
        )}
      </ModuleListCard>

      <FinanceCategoryFormDialog
        kind={kind}
        open={modalMode === 'create' || modalMode === 'edit'}
        onOpenChange={(open) => {
          if (!open) {
            setModalMode('')
            setEditingCategory(null)
          }
        }}
        mode={modalMode === 'edit' ? 'edit' : 'create'}
        category={editingCategory}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: [listKey] })
          void queryClient.invalidateQueries({ queryKey: ['revenues'] })
          void queryClient.invalidateQueries({ queryKey: ['expenses'] })
        }}
      />

      <ConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={isRevenue ? t('Delete Revenue Category') : t('Delete Expense Category')}
        message={
          isRevenue
            ? t('Are you sure you want to delete this revenue categories?')
            : t('Are you sure you want to delete this expense categories?')
        }
        confirmText={t('Delete')}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </TooltipProvider>
  )
}
