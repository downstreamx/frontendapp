import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  CheckCircle,
  Download,
  Eye,
  FileText,
  GitCompare,
  Plus,
  Printer,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { PerPageSelector } from '@/components/ui/per-page-selector'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/lib/paths'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { useDoubleEntryPageChrome } from '../hooks/use-double-entry-page-chrome'
import { BalanceSheetGenerateDialog } from '../components/BalanceSheetGenerateDialog'
import { BalanceSheetYearEndCloseDialog } from '../components/BalanceSheetYearEndCloseDialog'
import {
  deleteBalanceSheet,
  finalizeBalanceSheet,
  generateBalanceSheet,
  listBalanceSheetsPaginated,
  performYearEndClose,
  type BalanceSheet,
} from '../balance-sheets-api'
import { getBalanceSheetStatusBadgeClasses } from '../balance-sheet-utils'

export function BalanceSheetsIndexPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  useDoubleEntryPageChrome(t('Balance sheets'), t('Reports'))

  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)
  const [showYearEndClose, setShowYearEndClose] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BalanceSheet | null>(null)
  const [draftYear, setDraftYear] = useState(searchParams.get('financial_year') ?? '')
  const [draftStatus, setDraftStatus] = useState(searchParams.get('status') ?? '')

  const perPage = searchParams.get('per_page') ?? '10'
  const page = Number(searchParams.get('page') ?? '1')
  const sortField = searchParams.get('sort') ?? 'balance_sheet_date'
  const sortDirection = (searchParams.get('direction') ?? 'desc') as 'asc' | 'desc'
  const financialYear = searchParams.get('financial_year') ?? ''
  const status = searchParams.get('status') ?? ''

  const canCreate = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'create-balance-sheets',
  )
  const canView = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'view-balance-sheets')
  const canPrint = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'print-balance-sheets')
  const canFinalize = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'finalize-balance-sheets',
  )
  const canDelete = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'delete-balance-sheets',
  )
  const canCompare = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'view-balance-sheet-comparisons',
  )
  const canYearEndClose = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'year-end-close',
  )

  const listQuery = useQuery({
    queryKey: ['balance-sheets', financialYear, status, perPage, page, sortField, sortDirection],
    queryFn: () =>
      listBalanceSheetsPaginated({
        financial_year: financialYear || undefined,
        status: status || undefined,
        page,
        per_page: Number(perPage),
        sort: sortField,
        direction: sortDirection,
      }),
  })

  const generateMutation = useMutation({
    mutationFn: generateBalanceSheet,
    onSuccess: (sheet) => {
      toast.success(t('Balance sheet generated'))
      queryClient.invalidateQueries({ queryKey: ['balance-sheets'] })
      setShowGenerate(false)
      navigate(paths.doubleEntry.balanceSheetShow(sheet.id))
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to generate balance sheet'))),
  })

  const finalizeMutation = useMutation({
    mutationFn: finalizeBalanceSheet,
    onSuccess: () => {
      toast.success(t('Balance sheet finalized'))
      queryClient.invalidateQueries({ queryKey: ['balance-sheets'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to finalize balance sheet'))),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBalanceSheet,
    onSuccess: () => {
      toast.success(t('Balance sheet deleted'))
      queryClient.invalidateQueries({ queryKey: ['balance-sheets'] })
      setDeleteTarget(null)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to delete balance sheet'))),
  })

  const yearEndCloseMutation = useMutation({
    mutationFn: performYearEndClose,
    onSuccess: (result) => {
      toast.success(result.message || t('Year-end closing completed successfully.'))
      queryClient.invalidateQueries({ queryKey: ['balance-sheets'] })
      setShowYearEndClose(false)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to complete year-end close'))),
  })

  const { rows = [], meta } = listQuery.data ?? {
    rows: [],
    meta: { current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 },
  }

  const updateParams = (updates: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') next.delete(key)
        else next.set(key, value)
      }
      return next
    })
  }

  const applyFilters = () => {
    const statusValue = draftStatus === 'all' ? '' : draftStatus
    updateParams({
      financial_year: draftYear.trim() || null,
      status: statusValue || null,
      page: '1',
    })
  }

  const clearFilters = () => {
    setDraftYear('')
    setDraftStatus('')
    setSearchParams({ per_page: perPage, sort: sortField, direction: sortDirection })
  }

  const setSort = (field: string) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    updateParams({ sort: field, direction, page: '1' })
  }

  const openPrint = (id: number) => {
    window.open(`${paths.doubleEntry.balanceSheetPrint(id)}?print=1`, '_blank')
  }

  const openDownload = (id: number) => {
    window.open(paths.doubleEntry.balanceSheetPrint(id), '_blank')
  }

  const columns: Column<BalanceSheet>[] = useMemo(
    () => [
      {
        key: 'balance_sheet_date',
        header: t('Date'),
        sortable: true,
        render: (_, row) => formatDate(row.balance_sheet_date),
      },
      { key: 'financial_year', header: t('Financial year'), sortable: true },
      {
        key: 'total_assets',
        header: t('Total assets'),
        render: (_, row) => formatCurrency(Number(row.total_assets)),
      },
      {
        key: 'total_liabilities',
        header: t('Total liabilities'),
        render: (_, row) => formatCurrency(Number(row.total_liabilities)),
      },
      {
        key: 'total_equity',
        header: t('Total equity'),
        render: (_, row) => formatCurrency(Number(row.total_equity)),
      },
      {
        key: 'is_balanced',
        header: t('Balanced'),
        render: (_, row) => (
          <span
            className={`rounded-full px-2 py-1 text-xs ${
              row.is_balanced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {row.is_balanced ? t('Yes') : t('No')}
          </span>
        ),
      },
      {
        key: 'status',
        header: t('Status'),
        sortable: true,
        render: (_, row) => (
          <span className={`rounded-full px-2 py-1 text-xs ${getBalanceSheetStatusBadgeClasses(row.status)}`}>
            {row.status === 'finalized' ? t('Finalized') : t('Draft')}
          </span>
        ),
      },
      {
        key: 'actions',
        header: t('Actions'),
        render: (_, row) => (
          <TooltipProvider>
            <div className="flex gap-1">
              {canFinalize && row.status === 'draft' && row.is_balanced ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-blue-600"
                      onClick={() => finalizeMutation.mutate(row.id)}
                      disabled={finalizeMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('Finalize')}</TooltipContent>
                </Tooltip>
              ) : null}
              {canPrint ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600"
                        onClick={() => openDownload(row.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('Download PDF')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600"
                        onClick={() => openPrint(row.id)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('Print')}</TooltipContent>
                  </Tooltip>
                </>
              ) : null}
              {canView ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-green-600"
                      onClick={() => navigate(paths.doubleEntry.balanceSheetShow(row.id))}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('View')}</TooltipContent>
                </Tooltip>
              ) : null}
              {canDelete && row.status === 'draft' ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => setDeleteTarget(row)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('Delete')}</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </TooltipProvider>
        ),
      },
    ],
    [t, canFinalize, canPrint, canView, canDelete, finalizeMutation, navigate, openPrint, openDownload],
  )

  const activeFilterCount = [financialYear, status].filter(Boolean).length

  return (
    <>
      <ModuleListCard
        title={t('Balance sheets')}
        description={t('Generate and manage balance sheet snapshots.')}
        actions={
          <div className="flex gap-2">
            {canCompare ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <Link to={paths.doubleEntry.balanceSheetComparisons}>
                  <GitCompare className="mr-2 h-4 w-4" />
                  {t('Comparisons')}
                </Link>
              </Button>
            ) : null}
            {canYearEndClose ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowYearEndClose(true)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {t('Year-end close')}
              </Button>
            ) : null}
            {canCreate ? (
              <Button type="button" size="sm" onClick={() => setShowGenerate(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('Generate')}
              </Button>
            ) : null}
          </div>
        }
        isLoading={listQuery.isLoading}
        error={!!listQuery.error}
        searchToolbar={{
          searchValue: draftYear,
          onSearchChange: setDraftYear,
          onSearch: applyFilters,
          searchPlaceholder: t('Search by financial year…'),
          showFilters,
          onToggleFilters: () => setShowFilters((open) => !open),
          activeFilterCount,
          controls: (
            <PerPageSelector
              value={perPage}
              onChange={(value) => updateParams({ per_page: value, page: '1' })}
            />
          ),
          onApplyFilters: applyFilters,
          onClearFilters: clearFilters,
          filtersPanel: showFilters ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('Status')}</label>
                <Select value={draftStatus || 'all'} onValueChange={setDraftStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('All statuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All')}</SelectItem>
                    <SelectItem value="draft">{t('Draft')}</SelectItem>
                    <SelectItem value="finalized">{t('Finalized')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : undefined,
        }}
        pagination={{ ...meta, onPageChange: (p) => updateParams({ page: String(p) }) }}
      >
        {!listQuery.isLoading && rows.length === 0 ? (
          <NoRecordsFound
            icon={FileText}
            title={t('No balance sheets found')}
            description={t('Get started by generating your first balance sheet.')}
            hasFilters={activeFilterCount > 0}
            onClearFilters={clearFilters}
            className="h-auto py-12"
          />
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            onSort={setSort}
            sortKey={sortField}
            sortDirection={sortDirection}
            className="rounded-none border-0"
          />
        )}
      </ModuleListCard>

      <BalanceSheetGenerateDialog
        open={showGenerate}
        onOpenChange={setShowGenerate}
        onSubmit={(input) => generateMutation.mutate(input)}
        isPending={generateMutation.isPending}
      />

      <BalanceSheetYearEndCloseDialog
        open={showYearEndClose}
        onOpenChange={setShowYearEndClose}
        onSubmit={(input) => yearEndCloseMutation.mutate(input)}
        isPending={yearEndCloseMutation.isPending}
      />

      <ConfirmationDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('Delete balance sheet')}
        message={t('Are you sure you want to delete this balance sheet?')}
        confirmText={t('Delete')}
        variant="destructive"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </>
  )
}
