import { useCallback, useEffect, useId, useState, type DragEvent } from 'react'
import { Check, Image as ImageIcon, Plus, Search, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import {
  createMediaDirectory,
  fetchMediaLibrary,
  uploadMediaFiles,
  type MediaItem,
} from '../media-api'
import { MediaFileIcon } from './MediaFileIcon'

type MediaLibraryModalProps = {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string | string[]) => void
  multiple?: boolean
}

export function MediaLibraryModal({ isOpen, onClose, onSelect, multiple = false }: MediaLibraryModalProps) {
  const { t } = useTranslation()
  const uploadInputId = useId()
  const { auth } = useAppContext()
  const canCreateMedia =
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-media') ||
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-media')

  const [media, setMedia] = useState<MediaItem[]>([])
  const [directories, setDirectories] = useState<Array<{ id: number; name: string }>>([])
  const [currentDirectory, setCurrentDirectory] = useState<number | null>(null)
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateDirectory, setShowCreateDirectory] = useState(false)
  const [newDirectoryName, setNewDirectoryName] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const itemsPerPage = 18

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchMediaLibrary(currentDirectory)
      setMedia(data.media)
      setDirectories(data.directories)
      setFilteredMedia(data.media)
    } catch {
      toast.error(t('Failed to load media'))
    } finally {
      setLoading(false)
    }
  }, [currentDirectory, t])

  useEffect(() => {
    if (isOpen) {
      void fetchMedia()
      setSearchTerm('')
      setSelectedItems([])
    }
  }, [isOpen, fetchMedia])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMedia(media)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredMedia(
        media.filter(
          (item) => item.name.toLowerCase().includes(term) || item.file_name.toLowerCase().includes(term),
        ),
      )
    }
    setCurrentPage(1)
  }, [searchTerm, media])

  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentMedia = filteredMedia.slice(startIndex, startIndex + itemsPerPage)

  const handleFileUpload = async (files: FileList) => {
    if (!canCreateMedia) {
      toast.error(t('Permission denied'))
      return
    }

    setUploading(true)
    const validFiles = Array.from(files)
    if (validFiles.length === 0) {
      setUploading(false)
      return
    }

    try {
      const result = await uploadMediaFiles(validFiles, currentDirectory)
      await fetchMedia()

      if (result.errors?.length) {
        toast.warning(result.message ?? t('Some uploads failed'))
        result.errors.forEach((error) => toast.error(error))
      } else {
        toast.success(result.message ?? t('Files uploaded successfully'))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('Upload failed')
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  const handleSelect = (url: string) => {
    if (multiple) {
      setSelectedItems((prev) => (prev.includes(url) ? prev.filter((item) => item !== url) : [...prev, url]))
    } else {
      onSelect(url)
      onClose()
    }
  }

  const handleConfirmSelection = () => {
    if (multiple && selectedItems.length > 0) {
      onSelect(selectedItems)
      onClose()
    }
  }

  const handleDrag = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (canCreateMedia && e.dataTransfer.files?.length) {
      void handleFileUpload(e.dataTransfer.files)
    }
  }

  const createDirectory = async () => {
    if (!newDirectoryName.trim()) return
    try {
      await createMediaDirectory(newDirectoryName.trim())
      toast.success(t('Directory created successfully'))
      setNewDirectoryName('')
      setShowCreateDirectory(false)
      await fetchMedia()
    } catch {
      toast.error(t('Failed to create directory'))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {t('Media Library')}
            {filteredMedia.length > 0 && <Badge variant="secondary">{filteredMedia.length}</Badge>}
          </DialogTitle>
          <DialogDescription>{t('Upload new files to your media library')}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={currentDirectory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentDirectory(null)}
            >
              {t('Files')}
            </Button>
            {directories.map((dir) => (
              <Button
                key={dir.id}
                variant={currentDirectory === dir.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentDirectory(dir.id)}
              >
                {dir.name}
              </Button>
            ))}
            {canCreateMedia && (
              <Button variant="ghost" size="sm" onClick={() => setShowCreateDirectory(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {showCreateDirectory && (
            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="flex gap-2">
                <Input
                  placeholder={t('Enter directory name...')}
                  value={newDirectoryName}
                  onChange={(e) => setNewDirectoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void createDirectory()}
                />
                <Button onClick={() => void createDirectory()} size="sm">
                  {t('Create')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreateDirectory(false)
                    setNewDirectoryName('')
                  }}
                >
                  {t('Cancel')}
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('Search media files...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {canCreateMedia && (
              <>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => e.target.files && void handleFileUpload(e.target.files)}
                  className="hidden"
                  id={uploadInputId}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById(uploadInputId)?.click()}
                  disabled={uploading}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {uploading ? t('Uploading...') : t('Upload Files')}
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
            <span>
              {filteredMedia.length} {t('files')} · {t('Page')} {currentPage} {t('of')} {totalPages || 1}
            </span>
            {multiple && selectedItems.length > 0 && (
              <Badge variant="default" className="text-xs">
                {selectedItems.length} {t('selected')}
              </Badge>
            )}
          </div>

          <div
            className="border rounded-lg bg-muted/10 flex flex-col flex-1 min-h-0 overflow-hidden"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {loading ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <p className="text-muted-foreground">{t('Loading media...')}</p>
              </div>
            ) : filteredMedia.length === 0 ? (
              <div
                className={`flex-1 flex flex-col items-center justify-center py-16 ${dragActive ? 'bg-primary/5' : ''}`}
              >
                <div
                  className={`mx-auto w-24 h-24 border-2 border-dashed rounded-xl flex items-center justify-center mb-4 ${
                    dragActive ? 'border-primary' : 'border-muted-foreground/25'
                  }`}
                >
                  <Upload className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">{t('No media files found')}</p>
                {canCreateMedia && (
                  <p className="text-xs text-muted-foreground mt-1">{t('Drag and drop files here')}</p>
                )}
                {canCreateMedia && (
                  <Button
                    type="button"
                    className="mt-4"
                    onClick={() => document.getElementById(uploadInputId)?.click()}
                    disabled={uploading}
                  >
                    {t('Upload Files')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-5 gap-3">
                  {currentMedia.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`relative rounded-lg overflow-hidden transition-all ${
                        selectedItems.includes(item.url) ? 'ring-2 ring-primary' : 'border border-border'
                      }`}
                      onClick={() => handleSelect(item.url)}
                    >
                      <div className="aspect-square bg-muted">
                        {item.mime_type.startsWith('image/') ? (
                          <img src={item.thumb_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MediaFileIcon mimeType={item.mime_type} />
                          </div>
                        )}
                        {selectedItems.includes(item.url) && (
                          <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                            <div className="bg-primary text-primary-foreground rounded-full p-1.5">
                              <Check className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs truncate p-1">{item.name}</p>
                    </button>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 py-3 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      {t('Previous')}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      {t('Next')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {multiple && selectedItems.length > 0 && (
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedItems.length} {t('files selected')}
              </span>
              <Button onClick={handleConfirmSelection}>{t('Select Files')}</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
