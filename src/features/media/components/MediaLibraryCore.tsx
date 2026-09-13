import { useCallback, useEffect, useId, useMemo, useState, type DragEvent } from 'react'
import {
  ArrowLeft,
  Calendar,
  Copy,
  Download,
  Edit,
  Folder,
  FolderInput,
  FolderOpen,
  HardDrive,
  Home,
  Image as ImageIcon,
  Info,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { formatMediaDate, formatMediaFileSize } from '../media-format'
import {
  createMediaDirectory,
  deleteMedia,
  deleteMediaDirectory,
  downloadMediaFile,
  fetchMediaLibrary,
  moveMediaToDirectory,
  updateMediaDirectory,
  uploadMediaFiles,
  type MediaItem,
} from '../media-api'
import { MediaFileIcon } from './MediaFileIcon'

const ITEMS_PER_PAGE = 12

type DirectoryRow = { id: number; name: string }

export function MediaLibraryCore() {
  const { t } = useTranslation()
  const uploadModalInputId = useId()
  const { auth } = useAppContext()

  const canManage =
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-media') ||
    auth.user?.type === 'superadmin'
  const canCreate =
    canManage ||
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-media')
  const canDelete =
    canManage ||
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'delete-media')
  const canDownload =
    canManage ||
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'download-media')
  const canManageDirs =
    canManage ||
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'manage-media-directories') ||
    hasPermission(auth.permissions, auth.roles, auth.user?.type, 'create-media-directories')

  const [media, setMedia] = useState<MediaItem[]>([])
  const [directories, setDirectories] = useState<DirectoryRow[]>([])
  const [currentDirectory, setCurrentDirectory] = useState<number | null>(null)
  const [showAllFiles, setShowAllFiles] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [showCreateDirectory, setShowCreateDirectory] = useState(false)
  const [newDirectoryName, setNewDirectoryName] = useState('')
  const [editingDirectory, setEditingDirectory] = useState<number | null>(null)
  const [moveTarget, setMoveTarget] = useState<MediaItem | null>(null)
  const [moveDirectoryId, setMoveDirectoryId] = useState<string>('root')
  const [moveSaving, setMoveSaving] = useState(false)
  const [editDirectoryName, setEditDirectoryName] = useState('')
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [selectedMediaInfo, setSelectedMediaInfo] = useState<MediaItem | null>(null)

  const showFiles = currentDirectory !== null || showAllFiles

  const loadMedia = useCallback(
    async (showLoader = true) => {
      if (!showFiles) {
        setMedia([])
        return
      }
      if (showLoader) setLoading(true)
      try {
        const data = await fetchMediaLibrary(showAllFiles ? null : currentDirectory)
        setMedia(data.media)
        if (!showFiles) return
        setDirectories(data.directories)
      } catch {
        toast.error(t('Failed to load media'))
      } finally {
        if (showLoader) setLoading(false)
      }
    },
    [currentDirectory, showAllFiles, showFiles, t],
  )

  const loadDirectories = useCallback(async () => {
    try {
      const data = await fetchMediaLibrary(null)
      setDirectories(data.directories)
    } catch {
      toast.error(t('Failed to load media'))
    }
  }, [t])

  useEffect(() => {
    if (showFiles) {
      void loadMedia(media.length === 0)
    } else {
      setLoading(true)
      void loadDirectories().finally(() => setLoading(false))
    }
  }, [loadMedia, loadDirectories, showFiles])

  const filteredMedia = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return media
    return media.filter(
      (item) =>
        item.name.toLowerCase().includes(term) || item.file_name.toLowerCase().includes(term),
    )
  }, [media, searchTerm])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, currentDirectory, showAllFiles])

  const totalPages = Math.max(1, Math.ceil(filteredMedia.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentMedia = filteredMedia.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  const totalSize = filteredMedia.reduce((acc, item) => acc + item.size, 0)
  const imageCount = filteredMedia.filter((item) => item.mime_type.startsWith('image/')).length

  const handleFileUpload = async (files: FileList) => {
    if (!canCreate) {
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
      const directoryId = showAllFiles ? null : currentDirectory
      const result = await uploadMediaFiles(validFiles, directoryId)
      await loadMedia(false)
      if (result.errors?.length) {
        toast.warning(result.message ?? t('Some uploads failed'))
        result.errors.forEach((error) => toast.error(error))
      } else {
        toast.success(result.message ?? t('Files uploaded successfully'))
      }
      setIsUploadModalOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Upload failed'))
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.length) void handleFileUpload(e.dataTransfer.files)
  }

  const handleDeleteMedia = async (id: number) => {
    if (!canDelete) return
    try {
      await deleteMedia(id)
      setMedia((prev) => prev.filter((item) => item.id !== id))
      toast.success(t('Media deleted successfully'))
    } catch {
      toast.error(t('Failed to delete media'))
    }
  }

  const handleCopyLink = (url: string) => {
    void navigator.clipboard.writeText(url)
    toast.success(t('File URL copied to clipboard'))
  }

  const handleDownload = async (id: number, filename: string) => {
    if (!canDownload) return
    try {
      await downloadMediaFile(id, filename)
      toast.success(t('Download started'))
    } catch {
      toast.error(t('Download failed'))
    }
  }

  const createDirectory = async () => {
    if (!newDirectoryName.trim() || !canManageDirs) return
    try {
      await createMediaDirectory(newDirectoryName.trim())
      toast.success(t('Directory created successfully'))
      setNewDirectoryName('')
      setShowCreateDirectory(false)
      await loadDirectories()
    } catch {
      toast.error(t('Failed to create directory'))
    }
  }

  const saveDirectoryEdit = async () => {
    if (!editDirectoryName.trim() || editingDirectory == null) return
    try {
      await updateMediaDirectory(editingDirectory, editDirectoryName.trim())
      toast.success(t('Directory updated successfully'))
      setEditingDirectory(null)
      setEditDirectoryName('')
      await loadDirectories()
    } catch {
      toast.error(t('Failed to update directory'))
    }
  }

  const removeDirectory = async (id: number) => {
    if (!canManageDirs) return
    if (!window.confirm(t('Are you sure you want to delete this directory?'))) return
    try {
      await deleteMediaDirectory(id)
      toast.success(t('Directory deleted successfully'))
      if (currentDirectory === id) {
        setCurrentDirectory(null)
        setShowAllFiles(false)
      }
      await loadDirectories()
    } catch {
      toast.error(t('Failed to delete directory'))
    }
  }

  const openFolder = (id: number) => {
    setMedia([])
    setCurrentDirectory(id)
    setShowAllFiles(false)
  }

  const openMoveDialog = (item: MediaItem) => {
    setMoveTarget(item)
    setMoveDirectoryId(item.directory_id != null ? String(item.directory_id) : 'root')
  }

  const handleMoveMedia = async () => {
    if (!moveTarget || !canManage) return
    const directoryId = moveDirectoryId === 'root' ? null : Number(moveDirectoryId)
    setMoveSaving(true)
    try {
      await moveMediaToDirectory(moveTarget.id, directoryId)
      toast.success(t('File moved successfully'))
      setMoveTarget(null)
      await loadMedia()
      await loadDirectories()
    } catch {
      toast.error(t('Failed to move file'))
    } finally {
      setMoveSaving(false)
    }
  }

  const pageActions = (
    <div className="flex gap-2">
      {canManageDirs && (
        <Button variant="outline" size="sm" onClick={() => setShowCreateDirectory(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('New Folder')}
        </Button>
      )}
      {canCreate && (
        <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('Upload Files')}
        </Button>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {pageActions}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 px-2"
                onClick={() => {
                  setCurrentDirectory(null)
                  setShowAllFiles(false)
                }}
              >
                <Home className="h-4 w-4" />
                {t('Media Library')}
              </Button>
              {currentDirectory != null && (
                <>
                  <span className="mx-2">/</span>
                  <div className="flex items-center gap-2 rounded-md bg-muted px-2 py-1">
                    <Folder className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">
                      {directories.find((d) => d.id === currentDirectory)?.name ?? t('Directory')}
                    </span>
                  </div>
                </>
              )}
              {showAllFiles && (
                <>
                  <span className="mx-2">/</span>
                  <div className="flex items-center gap-2 rounded-md bg-muted px-2 py-1">
                    <Folder className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{t('All Files')}</span>
                  </div>
                </>
              )}
            </nav>
            {(currentDirectory !== null || showAllFiles) && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2"
                onClick={() => {
                  setCurrentDirectory(null)
                  setShowAllFiles(false)
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                {t('Back')}
              </Button>
            )}
          </div>

          {showCreateDirectory && (
            <div className="mt-4 rounded-lg border bg-muted/30 p-3">
              <div className="flex gap-2">
                <Input
                  placeholder={t('Directory name...')}
                  value={newDirectoryName}
                  onChange={(e) => setNewDirectoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void createDirectory()}
                />
                <Button size="sm" onClick={() => void createDirectory()}>
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

          {editingDirectory != null && (
            <div className="mt-4 rounded-lg border bg-muted/30 p-3">
              <div className="flex gap-2">
                <Input
                  placeholder={t('Directory name...')}
                  value={editDirectoryName}
                  onChange={(e) => setEditDirectoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void saveDirectoryEdit()}
                />
                <Button size="sm" onClick={() => void saveDirectoryEdit()}>
                  {t('Update')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingDirectory(null)
                    setEditDirectoryName('')
                  }}
                >
                  {t('Cancel')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showFiles && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder={t('Search media files...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  {filteredMedia.length} {t('Files')}
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <HardDrive className="h-4 w-4 text-green-600" />
                  {formatMediaFileSize(totalSize)}
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  {imageCount} {t('Images')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
              <p className="text-muted-foreground">{t('Loading media...')}</p>
            </div>
          ) : !showFiles ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              <button
                type="button"
                className="group relative cursor-pointer overflow-hidden rounded-lg border bg-card text-left transition-all hover:shadow-md"
                onClick={() => {
                  setShowAllFiles(true)
                  setCurrentDirectory(null)
                }}
              >
                <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                  <Folder className="h-12 w-12 text-primary" />
                  <Badge className="absolute left-2 top-2 bg-primary/10 text-primary" variant="secondary">
                    FOLDER
                  </Badge>
                </div>
                <div className="space-y-1 p-3">
                  <h3 className="flex items-center gap-2 truncate text-sm font-medium">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    {t('All Files')}
                  </h3>
                  <p className="text-xs text-muted-foreground">{t('View all files')}</p>
                </div>
              </button>

              {directories.map((directory) => (
                <div
                  key={directory.id}
                  role="button"
                  tabIndex={0}
                  className="group relative cursor-pointer overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md"
                  onClick={() => openFolder(directory.id)}
                  onKeyDown={(e) => e.key === 'Enter' && openFolder(directory.id)}
                >
                  <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                    <Folder className="h-12 w-12 text-primary" />
                    {canManageDirs && (
                      <div className="absolute right-2 top-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 bg-background/95 p-0 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingDirectory(directory.id)
                                setEditDirectoryName(directory.name)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              {t('Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                void removeDirectory(directory.id)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('Delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                    <Badge className="absolute left-2 top-2 bg-primary/10 text-primary" variant="secondary">
                      FOLDER
                    </Badge>
                  </div>
                  <div className="space-y-1 p-3">
                    <h3 className="flex items-center gap-2 truncate text-sm font-medium" title={directory.name}>
                      <FolderOpen className="h-4 w-4 text-primary" />
                      {directory.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{t('Directory')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : currentMedia.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{t('No media files found')}</h3>
              <p className="mb-6 text-muted-foreground">
                {searchTerm
                  ? t('No results found for "{{term}}"', { term: searchTerm })
                  : t('Get started by uploading your first file')}
              </p>
              {!searchTerm && canCreate && (
                <Button size="lg" onClick={() => setIsUploadModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('Upload Files')}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {currentMedia.map((item) => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md"
                  >
                    <div className="relative flex aspect-square items-center justify-center bg-muted">
                      {item.mime_type.startsWith('image/') ? (
                        <img
                          src={item.thumb_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = item.url
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4">
                          <MediaFileIcon mimeType={item.mime_type} className="h-8 w-8" />
                          <div className="mt-2 truncate text-center text-xs font-medium text-muted-foreground">
                            {item.mime_type.split('/')[1]?.toUpperCase() ?? 'FILE'}
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-primary/0 transition-all group-hover:bg-primary/10" />
                      {!infoModalOpen && !isUploadModalOpen && (
                        <div className="absolute right-2 top-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 bg-background/95 p-0 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => {
                                setSelectedMediaInfo(item)
                                setInfoModalOpen(true)
                              }}>
                                <Info className="mr-2 h-4 w-4" />
                                {t('View Info')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyLink(item.url)}>
                                <Copy className="mr-2 h-4 w-4" />
                                {t('Copy Link')}
                              </DropdownMenuItem>
                              {canDownload && (
                                <DropdownMenuItem
                                  onClick={() => void handleDownload(item.id, item.file_name)}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  {t('Download')}
                                </DropdownMenuItem>
                              )}
                              {canManage && (
                                <DropdownMenuItem onClick={() => openMoveDialog(item)}>
                                  <FolderInput className="mr-2 h-4 w-4" />
                                  {t('Move to folder')}
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => void handleDeleteMedia(item.id)}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    {t('Delete')}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                      <Badge className="absolute left-2 top-2 bg-background/95 text-xs" variant="secondary">
                        {(item.mime_type.split('/')[1] ?? 'file').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-2 p-3">
                      <h3 className="truncate text-sm font-medium" title={item.name}>
                        {item.name}
                      </h3>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <HardDrive className="h-3 w-3" />
                        {formatMediaFileSize(item.size)}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
                  <p className="text-sm text-muted-foreground">
                    {t('Showing')} {startIndex + 1} {t('to')}{' '}
                    {Math.min(startIndex + ITEMS_PER_PAGE, filteredMedia.length)} {t('of')}{' '}
                    {filteredMedia.length} {t('files')}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      {t('Previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      {t('Next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('Upload Files')}
            </DialogTitle>
            <DialogDescription>{t('Upload new files to your media library')}</DialogDescription>
          </DialogHeader>
          <div
            className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-all ${
              dragActive ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-muted-foreground/30'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className={`mx-auto mb-4 h-8 w-8 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <h3 className="mb-2 text-lg font-medium">
              {dragActive ? t('Drop files here') : t('Upload your files')}
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              {t('Drag and drop your files here, or click to browse')}
            </p>
            <Input
              id={uploadModalInputId}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && void handleFileUpload(e.target.files)}
            />
            <Button
              type="button"
              size="lg"
              disabled={uploading}
              onClick={() => document.getElementById(uploadModalInputId)?.click()}
            >
              {uploading ? t('Uploading...') : t('Choose Files')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {t('File Information')}
            </DialogTitle>
            <DialogDescription>{t('View detailed information about this file')}</DialogDescription>
          </DialogHeader>
          {selectedMediaInfo && (
            <div className="space-y-4">
              <div className="flex justify-center rounded-lg bg-muted p-4">
                {selectedMediaInfo.mime_type.startsWith('image/') ? (
                  <img
                    src={selectedMediaInfo.thumb_url}
                    alt={selectedMediaInfo.name}
                    className="max-h-48 max-w-full rounded-md object-contain"
                    onError={(e) => {
                      e.currentTarget.src = selectedMediaInfo.url
                    }}
                  />
                ) : (
                  <MediaFileIcon mimeType={selectedMediaInfo.mime_type} className="h-16 w-16" />
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{t('File Name')}</span>
                  <span className="truncate text-right">{selectedMediaInfo.file_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('File Size')}</span>
                  <span>{formatMediaFileSize(selectedMediaInfo.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Uploaded')}</span>
                  <span>{formatMediaDate(selectedMediaInfo.created_at)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleCopyLink(selectedMediaInfo.url)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {t('Copy Link')}
                </Button>
                {canDownload && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      void handleDownload(selectedMediaInfo.id, selectedMediaInfo.file_name)
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t('Download')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={moveTarget != null}
        onOpenChange={(open) => {
          if (!open) setMoveTarget(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Move to folder')}</DialogTitle>
            <DialogDescription>
              {moveTarget
                ? t('Choose a destination folder for "{{name}}".', { name: moveTarget.name })
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>{t('Folder')}</Label>
              <Select value={moveDirectoryId} onValueChange={setMoveDirectoryId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Select folder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">{t('Root (no folder)')}</SelectItem>
                  {directories.map((directory) => (
                    <SelectItem key={directory.id} value={String(directory.id)}>
                      {directory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMoveTarget(null)} disabled={moveSaving}>
                {t('Cancel')}
              </Button>
              <Button onClick={() => void handleMoveMedia()} disabled={moveSaving}>
                {moveSaving ? t('Moving…') : t('Move')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
