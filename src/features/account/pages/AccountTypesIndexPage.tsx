import { useMemo, useState } from 'react'
import { Edit, FileText, Trash2 } from 'lucide-react'
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
import { AccountTypeFormDialog } from '../components/AccountTypeFormDialog'
import {
  deleteAccountType,
  listAccountTypesPaginated,
  type AccountTypeRow,
} from '../account-types-api'

export function AccountTypesIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()

  const canCreate = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'create-account-types',
  )
  const canEdit = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'edit-account-types',
  )
  const canDelete = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'delete-account-types',
  )

  const [modalMode, setModalMode] = useState<'create' | 'edit' | ''>('')
  const [editingType, setEditingType] = useState<AccountTypeRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AccountTypeRow | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['account-types'],
    queryFn: () => listAccountTypesPaginated({ per_page: '200' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAccountType(id),
    onSuccess: () => {
      toast.success(t('The account type has been deleted.'))
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['account-types'] })
      void queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete account type'))),
  })

  const rows = data?.rows ?? []

  const columns: Column<AccountTypeRow>[] = useMemo(
    () => [
      { key: 'name', header: t('Name') },
      { key: 'code', header: t('Code') },
      {
        key: 'normal_balance',
        header: t('Normal Balance'),
        render: (value) => (value === 'debit' ? t('Debit') : t('Credit')),
      },
      {
        key: 'category',
        header: t('Category Name'),
        render: (_, row) => row.category?.name ?? '—',
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
                      setEditingType(row)
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
            {canDelete && !row.is_system_type ? (
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
        title={t('Account Types')}
        canCreate={canCreate}
        onCreateClick={() => {
          setEditingType(null)
          setModalMode('create')
        }}
        isLoading={isLoading}
        error={!!error}
      >
        {rows.length === 0 ? (
          <NoRecordsFound
            icon={FileText}
            title={t('No account types found')}
            description={t('Get started by creating your first account type.')}
            createPermission="create-account-types"
            onCreateClick={() => {
              setEditingType(null)
              setModalMode('create')
            }}
            createButtonText={t('Create Account Type')}
            className="h-auto py-8"
          />
        ) : (
          <DataTable embedded data={rows} columns={visibleColumns} />
        )}
      </ModuleListCard>

      <AccountTypeFormDialog
        open={modalMode === 'create' || modalMode === 'edit'}
        onOpenChange={(open) => {
          if (!open) {
            setModalMode('')
            setEditingType(null)
          }
        }}
        mode={modalMode === 'edit' ? 'edit' : 'create'}
        accountType={editingType}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: ['account-types'] })
          void queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] })
        }}
      />

      <ConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('Delete Account Type')}
        message={t('Are you sure you want to delete this account type?')}
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
