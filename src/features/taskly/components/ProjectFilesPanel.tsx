import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MediaPicker } from '@/features/media/components/MediaPicker'
import { useAppContext } from '@/contexts/app-context'
import { resolveMediaUrl } from '@/features/media/media-url'
import { deleteProjectFile, uploadProjectFile } from '../api'

type ProjectFile = {
  id: number
  file_name?: string
  file_path?: string
}

type Props = {
  projectId: number
  files: ProjectFile[]
}

function fileNameFromPath(path: string) {
  const segment = path.split('/').filter(Boolean).pop()
  return segment ?? path
}

export function ProjectFilesPanel({ projectId, files }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { imageUrlPrefix } = useAppContext()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['project', String(projectId)] })

  const uploadMutation = useMutation({
    mutationFn: async (paths: string[]) => {
      for (const filePath of paths) {
        await uploadProjectFile(projectId, {
          file_name: fileNameFromPath(filePath),
          file_path: filePath,
        })
      }
    },
    onSuccess: () => {
      toast.success(t('Files uploaded'))
      invalidate()
    },
    onError: () => toast.error(t('Failed to upload files')),
  })

  const deleteMutation = useMutation({
    mutationFn: (fileId: number) => deleteProjectFile(projectId, fileId),
    onSuccess: () => {
      toast.success(t('File deleted'))
      invalidate()
    },
    onError: () => toast.error(t('Failed to delete file')),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('Files')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <MediaPicker
          multiple
          showPreview={false}
          placeholder={t('Select files')}
          value={[]}
          onChange={(value) => {
            const paths = Array.isArray(value) ? value : value ? [value] : []
            if (paths.length > 0) {
              uploadMutation.mutate(paths.filter(Boolean))
            }
          }}
        />

        <ul className="divide-y text-sm">
          {files.map((file) => {
            const path = file.file_path ?? ''
            const url = path ? resolveMediaUrl(path, imageUrlPrefix) : ''
            const label = file.file_name ?? fileNameFromPath(path) ?? `#${file.id}`

            return (
              <li key={file.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-primary hover:underline"
                    >
                      {label}
                    </a>
                  ) : (
                    <span className="truncate">{label}</span>
                  )}
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm(t('Delete this file?'))) {
                      deleteMutation.mutate(file.id)
                    }
                  }}
                  aria-label={t('Delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            )
          })}
          {files.length === 0 && (
            <li className="py-2 text-muted-foreground">{t('No files.')}</li>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
