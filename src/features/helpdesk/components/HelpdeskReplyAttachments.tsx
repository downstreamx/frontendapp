import { Download, Paperclip } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/contexts/app-context'
import { getImagePath } from '@/utils/helpers'
import { resolveMediaUrl } from '@/features/media/media-url'

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'])

function isImageAttachment(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return IMAGE_EXTENSIONS.has(ext)
}

function normalizeAttachmentList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string' && item !== '')
  }
  if (typeof raw === 'string' && raw !== '') {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item !== '')
      }
    } catch {
      return [raw]
    }
    return [raw]
  }
  return []
}

type HelpdeskReplyAttachmentsProps = {
  attachments?: unknown
}

export function HelpdeskReplyAttachments({ attachments }: HelpdeskReplyAttachmentsProps) {
  const { t } = useTranslation()
  const { imageUrlPrefix } = useAppContext()
  const items = normalizeAttachmentList(attachments)

  if (items.length === 0) {
    return null
  }

  const downloadUrl = (filename: string, isImage: boolean) =>
    isImage ? getImagePath(filename) : resolveMediaUrl(filename, imageUrlPrefix)

  return (
    <div className="mt-2 space-y-1">
      {items.map((attachment, index) => {
        const isImage = isImageAttachment(attachment)
        const href = downloadUrl(attachment, isImage)
        return (
          <div
            key={`${attachment}-${index}`}
            className="flex items-center gap-2 rounded border bg-muted/40 p-2"
          >
            {isImage ? (
              <img src={href} alt="" className="h-16 w-16 rounded object-cover" />
            ) : (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm">{attachment}</span>
              </div>
            )}
            <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0" asChild>
              <a href={href} download={attachment.split('/').pop() || 'file'} target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" />
                <span className="sr-only">{t('Download')}</span>
              </a>
            </Button>
          </div>
        )
      })}
    </div>
  )
}
