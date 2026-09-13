import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { MediaPicker } from '@/features/media/components/MediaPicker'
import { getApiErrorMessage } from '@/lib/errors'
import { downloadFile, getImagePath } from '@/utils/helpers'
import {
  attachDealFiles,
  attachLeadFiles,
  deleteDealFile,
  deleteLeadFile,
  type CrmFileRow,
} from '../lead-api'

type Props = {
  kind: 'lead' | 'deal'
  entityId: number
  files: CrmFileRow[]
}

export function CrmFilesSection({ kind, entityId, files }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const queryKey = ['lead', kind === 'lead' ? 'leads' : 'deals', String(entityId)]
  const [pendingPaths, setPendingPaths] = useState<string[]>([])
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const attachMutation = useMutation({
    mutationFn: (paths: string[]) =>
      kind === 'lead' ? attachLeadFiles(entityId, paths) : attachDealFiles(entityId, paths),
    onSuccess: () => {
      toast.success(t('Files attached'))
      setPendingPaths([])
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to attach files'))),
  })

  const deleteMutation = useMutation({
    mutationFn: (fileId: number) =>
      kind === 'lead' ? deleteLeadFile(entityId, fileId) : deleteDealFile(entityId, fileId),
    onSuccess: () => {
      toast.success(t('File deleted'))
      setDeleteId(null)
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to delete file'))),
  })

  return (
    <div className="space-y-4">
      <MediaPicker
        value={pendingPaths}
        onChange={(value) => setPendingPaths(Array.isArray(value) ? value : value ? [value] : [])}
        multiple
        placeholder={t('Select files from media library')}
        showPreview={false}
      />
      {pendingPaths.length > 0 ? (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => attachMutation.mutate(pendingPaths)} disabled={attachMutation.isPending}>
            {t('Save files')}
          </Button>
        </div>
      ) : null}

      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('No files attached.')}</p>
      ) : (
        <ul className="divide-y rounded-md border text-sm">
          {files.map((file) => {
            const path = file.file_path ?? file.file_name ?? ''
            const label = file.file_name ?? path.split('/').pop() ?? t('File')
            const url = getImagePath(path)
            return (
              <li key={file.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="truncate font-medium">{label}</span>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => url && downloadFile(url, label)}
                    title={t('Download')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDeleteId(file.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmationDialog
        open={deleteId != null}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title={t('Delete file')}
        description={t('Are you sure you want to delete this file?')}
        confirmLabel={t('Delete')}
        variant="destructive"
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
