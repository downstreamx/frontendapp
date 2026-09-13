import { useState } from 'react'
import { FileText, Image as ImageIcon, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppContext } from '@/contexts/app-context'
import { getMediaFileType, normalizeSelectedMediaPath, resolveMediaUrl } from '../media-url'
import { MediaLibraryModal } from './MediaLibraryModal'

type MediaPickerProps = {
  label?: string
  value?: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  placeholder?: string
  showPreview?: boolean
  readOnly?: boolean
  disabled?: boolean
  id?: string
  required?: boolean
}

export function MediaPicker({
  label,
  value = '',
  onChange,
  multiple = false,
  placeholder = 'Select image...',
  showPreview = true,
  readOnly = false,
  disabled = false,
  id,
  required,
}: MediaPickerProps) {
  const { t } = useTranslation()
  const { imageUrlPrefix } = useAppContext()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSelect = (selectedUrls: string | string[]) => {
    if (multiple) {
      const urlArray = Array.isArray(selectedUrls) ? selectedUrls : [selectedUrls]
      onChange(urlArray.map(normalizeSelectedMediaPath).filter(Boolean))
    } else {
      const url = Array.isArray(selectedUrls) ? selectedUrls[0] : selectedUrls
      onChange(normalizeSelectedMediaPath(url || ''))
    }
  }

  const handleClear = () => {
    onChange(multiple ? [] : '')
  }

  const safeValue = multiple
    ? Array.isArray(value)
      ? value
      : value
        ? [value]
        : []
    : Array.isArray(value)
      ? value[0] || ''
      : value || ''

  const getDisplayUrl = (storedPath: string) => resolveMediaUrl(storedPath, imageUrlPrefix)

  const storedPaths = multiple
    ? Array.isArray(safeValue)
      ? safeValue.filter(Boolean)
      : []
    : safeValue
      ? [safeValue as string]
      : []

  const mediaUrls = storedPaths.map(getDisplayUrl)

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className={required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : undefined}>
          {label}
        </Label>
      )}

      <div className="flex gap-2">
        <Input
          id={id}
          value={multiple ? storedPaths.join(', ') : (safeValue as string)}
          onChange={(e) => !multiple && !readOnly && onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly || multiple}
          required={required}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          disabled={readOnly || disabled}
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          {t('Browse')}
        </Button>
        {((multiple && storedPaths.length > 0) || (!multiple && safeValue)) && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleClear}
            disabled={readOnly || disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showPreview && mediaUrls.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {mediaUrls.map((url, index) => {
            const fileType = getMediaFileType(storedPaths[index] ?? url)
            return (
              <div key={`${storedPaths[index]}-${index}`} className="relative">
                {fileType === 'image' && (
                  <img src={url} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover rounded border" />
                )}
                {fileType === 'video' && (
                  <video src={url} className="w-full h-20 object-cover rounded border" muted playsInline />
                )}
                {fileType === 'file' && (
                  <div className="w-full h-20 flex flex-col items-center justify-center bg-muted rounded border text-xs text-muted-foreground gap-1">
                    <FileText className="h-5 w-5" />
                    {(storedPaths[index] ?? '').split('.').pop()?.toUpperCase() ?? 'FILE'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <MediaLibraryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
        multiple={multiple}
      />
    </div>
  )
}
