import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  CheckCircle,
  FileText,
  GitCompare,
  Plus,
  Printer,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/lib/paths'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { useDoubleEntryPageChrome } from '../hooks/use-double-entry-page-chrome'
import { BalanceSheetSectionTable } from '../components/BalanceSheetSectionTable'
import { BalanceSheetCompareDialog } from '../components/BalanceSheetCompareDialog'
import { BalanceSheetYearEndCloseDialog } from '../components/BalanceSheetYearEndCloseDialog'
import {
  createBalanceSheetComparison,
  createBalanceSheetNote,
  deleteBalanceSheetNote,
  fetchBalanceSheetsIndexMeta,
  finalizeBalanceSheet,
  getBalanceSheet,
  performYearEndClose,
} from '../balance-sheets-api'
import { PageContentLoader } from '@/components/ui/page-content-loader'
import {
  SECTION_LABELS,
  getBalanceSheetStatusBadgeClasses,
  groupBalanceSheetItems,
  orderedSectionKeys,
} from '../balance-sheet-utils'

export function BalanceSheetShowPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const sheetId = Number(id)

  const [showCompare, setShowCompare] = useState(false)
  const [showYearEndClose, setShowYearEndClose] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null)

  const sheetQuery = useQuery({
    queryKey: ['balance-sheet', sheetId],
    queryFn: () => getBalanceSheet(sheetId),
    enabled: Number.isFinite(sheetId),
  })

  const metaQuery = useQuery({
    queryKey: ['balance-sheets-index-meta'],
    queryFn: fetchBalanceSheetsIndexMeta,
  })

  const sheet = sheetQuery.data
  useDoubleEntryPageChrome(
    sheet ? `${t('Balance sheet')} — ${formatDate(sheet.balance_sheet_date)}` : t('Balance sheet'),
    t('Reports'),
  )

  const canFinalize = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'finalize-balance-sheets',
  )
  const canPrint = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'print-balance-sheets')
  const canCompare = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'create-balance-sheet-comparisons',
  )
  const canNote = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'create-balance-sheet-notes',
  )
  const canDeleteNote = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'delete-balance-sheet-notes',
  )
  const canYearEndClose = hasPermission(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'year-end-close',
  )

  const grouped = useMemo(
    () => groupBalanceSheetItems(sheet?.items ?? []),
    [sheet?.items],
  )

  const finalizeMutation = useMutation({
    mutationFn: () => finalizeBalanceSheet(sheetId),
    onSuccess: () => {
      toast.success(t('Balance sheet finalized'))
      queryClient.invalidateQueries({ queryKey: ['balance-sheet', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['balance-sheets'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to finalize'))),
  })

  const noteMutation = useMutation({
    mutationFn: () =>
      createBalanceSheetNote(sheetId, {
        note_title: noteTitle.trim(),
        note_content: noteContent.trim(),
      }),
    onSuccess: () => {
      toast.success(t('Note added'))
      setNoteTitle('')
      setNoteContent('')
      queryClient.invalidateQueries({ queryKey: ['balance-sheet', sheetId] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to add note'))),
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: number) => deleteBalanceSheetNote(sheetId, noteId),
    onSuccess: () => {
      toast.success(t('Note deleted'))
      setDeleteNoteId(null)
      queryClient.invalidateQueries({ queryKey: ['balance-sheet', sheetId] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to delete note'))),
  })

  const compareMutation = useMutation({
    mutationFn: createBalanceSheetComparison,
    onSuccess: (comparison) => {
      toast.success(t('Comparison created'))
      setShowCompare(false)
      navigate(paths.doubleEntry.balanceSheetComparisonShow(comparison.id))
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to create comparison'))),
  })

  const yearEndCloseMutation = useMutation({
    mutationFn: performYearEndClose,
    onSuccess: (result) => {
      toast.success(result.message || t('Year-end closing completed successfully.'))
      queryClient.invalidateQueries({ queryKey: ['balance-sheet', sheetId] })
      queryClient.invalidateQueries({ queryKey: ['balance-sheets'] })
      setShowYearEndClose(false)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to complete year-end close'))),
  })

  const switchSheet = (nextId: string) => {
    navigate(paths.doubleEntry.balanceSheetShow(Number(nextId)))
  }

  const openPrint = () => {
    window.open(`${paths.doubleEntry.balanceSheetPrint(sheetId)}?print=1`, '_blank')
  }

  if (sheetQuery.isLoading) {
    return <PageContentLoader className="min-h-[16rem]" />
  }

  if (!sheet) {
    return <p className="text-sm text-destructive">{t('Balance sheet not found.')}</p>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to={paths.doubleEntry.balanceSheets}>
              <FileText className="mr-2 h-4 w-4" />
              {t('All balance sheets')}
            </Link>
          </Button>
          {metaQuery.data?.sheets && metaQuery.data.sheets.length > 1 ? (
            <Select value={String(sheet.id)} onValueChange={switchSheet}>
              <SelectTrigger className="w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metaQuery.data.sheets.map((row) => (
                  <SelectItem key={row.id} value={String(row.id)}>
                    {formatDate(row.balance_sheet_date)} — {t('FY')} {row.financial_year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {canYearEndClose ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setShowYearEndClose(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              {t('Year-end close')}
            </Button>
          ) : null}
          {canCompare ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCompare(true)}>
              <GitCompare className="mr-2 h-4 w-4" />
              {t('Compare')}
            </Button>
          ) : null}
          {canPrint ? (
            <Button type="button" variant="outline" size="sm" onClick={openPrint}>
              <Printer className="mr-2 h-4 w-4" />
              {t('Print')}
            </Button>
          ) : null}
          {canFinalize && sheet.status === 'draft' && sheet.is_balanced ? (
            <Button
              type="button"
              size="sm"
              onClick={() => finalizeMutation.mutate()}
              disabled={finalizeMutation.isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {t('Finalize')}
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>
              {formatDate(sheet.balance_sheet_date)} — {t('FY')} {sheet.financial_year}
            </CardTitle>
            <div className="flex gap-2">
              <Badge className={getBalanceSheetStatusBadgeClasses(sheet.status)}>
                {sheet.status === 'finalized' ? t('Finalized') : t('Draft')}
              </Badge>
              <Badge variant={sheet.is_balanced ? 'default' : 'destructive'}>
                {sheet.is_balanced ? t('Balanced') : t('Out of balance')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">{t('Total assets')}</p>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(Number(sheet.total_assets))}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Total liabilities')}</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(Number(sheet.total_liabilities))}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Total equity')}</p>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(Number(sheet.total_equity))}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 md:p-8">
          {orderedSectionKeys(grouped).map((sectionType) => (
            <BalanceSheetSectionTable
              key={sectionType}
              sectionType={sectionType}
              sectionTitle={t(SECTION_LABELS[sectionType] ?? sectionType)}
              sectionItems={grouped[sectionType]}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Notes')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(sheet.notes ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('No notes yet.')}</p>
          ) : (
            <ul className="space-y-3">
              {sheet.notes?.map((note) => (
                <li key={note.id} className="rounded-md border p-3">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="font-medium">
                      {note.note_number}. {note.note_title}
                    </p>
                    {canDeleteNote ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => setDeleteNoteId(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{note.note_content}</p>
                </li>
              ))}
            </ul>
          )}

          {canNote ? (
            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium">{t('Add note')}</p>
              <div className="space-y-2">
                <Label htmlFor="note-title">{t('Title')}</Label>
                <Input
                  id="note-title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-content">{t('Content')}</Label>
                <Textarea
                  id="note-content"
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => noteMutation.mutate()}
                disabled={
                  noteMutation.isPending || !noteTitle.trim() || !noteContent.trim()
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('Add note')}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <BalanceSheetCompareDialog
        open={showCompare}
        onOpenChange={setShowCompare}
        sheets={metaQuery.data?.sheets ?? []}
        defaultCurrentId={sheet.id}
        onSubmit={(input) => compareMutation.mutate(input)}
        isPending={compareMutation.isPending}
      />

      <BalanceSheetYearEndCloseDialog
        open={showYearEndClose}
        onOpenChange={setShowYearEndClose}
        onSubmit={(input) => yearEndCloseMutation.mutate(input)}
        isPending={yearEndCloseMutation.isPending}
      />

      <ConfirmationDialog
        open={deleteNoteId != null}
        onOpenChange={(open) => !open && setDeleteNoteId(null)}
        title={t('Delete note')}
        message={t('Are you sure you want to delete this note?')}
        confirmText={t('Delete')}
        variant="destructive"
        onConfirm={() => deleteNoteId && deleteNoteMutation.mutate(deleteNoteId)}
      />
    </div>
  )
}
