import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Check,
  CheckCheck,
  Download,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Pin,
  PinOff,
  Search,
  Send,
  Smile,
  Star,
  StarOff,
  Trash2,
  Pencil,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { UserAvatar } from '@/features/shared/components/table-avatar-cells'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { getApiErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import {
  checkMessengerNewMessages,
  deleteMessengerMessage,
  editMessengerMessage,
  listMessengerContacts,
  listMessengerMessages,
  sendMessengerMessage,
  setMessengerOffline,
  toggleMessengerFavorite,
  toggleMessengerPin,
  updateMessengerPresence,
  type MessengerContact,
  type MessengerMessage,
} from '../messenger-api'

function contactLabel(c: MessengerContact) {
  return c.name || c.email
}

function canMessenger(
  permissions: string[],
  roles: string[],
  userType: string | undefined,
  permission: string,
) {
  return (
    hasPermission(permissions, roles, userType, 'manage-messenger') ||
    permissions.includes(permission)
  )
}

function sortContacts(rows: MessengerContact[]) {
  return [...rows].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
    const aTime = a.last_message?.created_at ?? ''
    const bTime = b.last_message?.created_at ?? ''
    return bTime.localeCompare(aTime)
  })
}

function MessageBubble({
  message,
  currentUserId,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  message: MessengerMessage
  currentUserId: number
  canEdit: boolean
  canDelete: boolean
  onEdit: (message: MessengerMessage) => void
  onDelete: (message: MessengerMessage) => void
}) {
  const { t } = useTranslation()
  const isMine = message.is_mine ?? message.from_id === currentUserId

  return (
    <div
      className={cn(
        'group flex max-w-[85%] flex-col gap-0.5',
        isMine ? 'ml-auto items-end' : 'items-start',
      )}
    >
      <div className="flex items-start gap-1">
        {isMine && (canEdit || canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(message)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  {t('Edit')}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(message)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('Delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <div
          className={cn(
            'rounded-md px-3 py-2 text-sm space-y-2',
            isMine ? 'bg-primary text-primary-foreground' : 'bg-muted',
          )}
        >
          {message.body ? <p className="whitespace-pre-wrap break-words">{message.body}</p> : null}
          {message.attachment_url ? (
            <a
              href={message.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-1 text-xs underline',
                isMine ? 'text-primary-foreground/90' : 'text-primary',
              )}
            >
              <Download className="h-3.5 w-3.5" />
              {t('Attachment')}
            </a>
          ) : null}
        </div>
      </div>
      {isMine && (
        <span className="text-muted-foreground">
          {message.seen ? (
            <CheckCheck className="h-3.5 w-3.5" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </span>
      )}
    </div>
  )
}

export function MessengerPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth, imageUrlPrefix } = useAppContext()
  const currentUserId = auth.user?.id ?? 0

  const [activeId, setActiveId] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [contactTab, setContactTab] = useState<'users' | 'favorites'>('users')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [editingMessage, setEditingMessage] = useState<MessengerMessage | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<MessengerMessage | null>(null)
  const [messagesPage, setMessagesPage] = useState(1)
  const [allMessages, setAllMessages] = useState<MessengerMessage[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<string>(new Date().toISOString())

  const canSend = canMessenger(auth.permissions, auth.roles, auth.user?.type, 'send-messages')
  const canEdit = canMessenger(auth.permissions, auth.roles, auth.user?.type, 'edit-messages')
  const canDelete = canMessenger(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'delete-messages',
  )
  const canFavorite = canMessenger(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'toggle-favorite-messages',
  )
  const canPin = canMessenger(
    auth.permissions,
    auth.roles,
    auth.user?.type,
    'toggle-pinned-messages',
  )

  usePageChrome({
    pageTitle: t('Messenger'),
    breadcrumbs: [{ label: t('Messenger') }],
  })

  useEffect(() => {
    void updateMessengerPresence().catch(() => {})
    const interval = window.setInterval(() => {
      void updateMessengerPresence().catch(() => {})
    }, 120_000)
    return () => {
      window.clearInterval(interval)
      void setMessengerOffline().catch(() => {})
    }
  }, [])

  const contactsQuery = useQuery({
    queryKey: ['messenger', 'contacts'],
    queryFn: listMessengerContacts,
    refetchInterval: 8_000,
  })

  const messagesQuery = useQuery({
    queryKey: ['messenger', 'messages', activeId, messagesPage],
    queryFn: () => listMessengerMessages(activeId!, messagesPage),
    enabled: activeId != null,
  })

  useEffect(() => {
    if (!messagesQuery.data) return
    if (messagesPage === 1) {
      setAllMessages(messagesQuery.data.data)
    } else {
      setAllMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id))
        const older = messagesQuery.data!.data.filter((m) => !ids.has(m.id))
        return [...older, ...prev]
      })
    }
  }, [messagesQuery.data, messagesPage])

  useEffect(() => {
    setMessagesPage(1)
    setAllMessages([])
    setEditingMessage(null)
    setAttachmentFile(null)
  }, [activeId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages, activeId])

  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const check = await checkMessengerNewMessages(pollRef.current)
        pollRef.current = check.timestamp
        if (check.has_new_messages) {
          void queryClient.invalidateQueries({ queryKey: ['messenger', 'contacts'] })
          if (activeId != null) {
            void queryClient.invalidateQueries({
              queryKey: ['messenger', 'messages', activeId],
            })
          }
        }
      } catch {
        /* ignore polling errors */
      }
    }, 5_000)
    return () => window.clearInterval(interval)
  }, [activeId, queryClient])

  useEffect(() => {
    const rows = contactsQuery.data ?? []
    if (activeId == null && rows.length > 0) {
      setActiveId(sortContacts(rows)[0]?.id ?? rows[0].id)
    }
  }, [contactsQuery.data, activeId])

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let rows = contactsQuery.data ?? []
    if (contactTab === 'favorites') {
      rows = rows.filter((c) => c.is_favorite)
    }
    if (q) {
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q),
      )
    }
    return sortContacts(rows)
  }, [contactsQuery.data, searchQuery, contactTab])

  const sendMutation = useMutation({
    mutationFn: () =>
      sendMessengerMessage({
        to_id: activeId!,
        body: draft,
        attachment: attachmentFile,
      }),
    onSuccess: () => {
      setDraft('')
      setAttachmentFile(null)
      setMessagesPage(1)
      void queryClient.invalidateQueries({ queryKey: ['messenger'] })
    },
    onError: () => toast.error(t('Failed to send message')),
  })

  const editMutation = useMutation({
    mutationFn: () => editMessengerMessage(editingMessage!.id, editDraft.trim()),
    onSuccess: () => {
      setEditingMessage(null)
      setEditDraft('')
      void queryClient.invalidateQueries({ queryKey: ['messenger', 'messages', activeId] })
    },
    onError: () => toast.error(t('Failed to update message')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMessengerMessage(id),
    onSuccess: () => {
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['messenger', 'messages', activeId] })
      void queryClient.invalidateQueries({ queryKey: ['messenger', 'contacts'] })
    },
    onError: () => toast.error(t('Failed to delete message')),
  })

  const favoriteMutation = useMutation({
    mutationFn: (userId: number) => toggleMessengerFavorite(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['messenger', 'contacts'] })
    },
  })

  const pinMutation = useMutation({
    mutationFn: (userId: number) => toggleMessengerPin(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['messenger', 'contacts'] })
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null
      toast.error(message ?? t('Failed to update pin'))
    },
  })

  const activeContact = (contactsQuery.data ?? []).find((c) => c.id === activeId)
  const hasMoreMessages = messagesQuery.data?.has_more ?? false

  return (
    <>
      <Card className="h-[min(72vh,680px)] overflow-hidden">
        <CardContent className="flex h-[min(72vh,680px)] gap-0 p-0">
          <aside className="flex w-72 shrink-0 flex-col border-r">
            <div className="space-y-2 border-b p-3">
              <Tabs
                value={contactTab}
                onValueChange={(v) => setContactTab(v as 'users' | 'favorites')}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="users">{t('Users')}</TabsTrigger>
                  <TabsTrigger value="favorites">{t('Favorites')}</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('Search contacts...')}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto divide-y text-sm">
              {filteredContacts.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-muted',
                      activeId === c.id && 'bg-muted font-medium',
                    )}
                    onClick={() => setActiveId(c.id)}
                  >
                    <div className="relative">
                      <UserAvatar
                        avatar={c.avatar_url ?? c.avatar}
                        name={contactLabel(c)}
                        size="md"
                        className="h-9 w-9"
                        imageUrlPrefix={imageUrlPrefix}
                      />
                      {c.is_online && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="truncate font-medium">{contactLabel(c)}</span>
                        {c.is_pinned && <Pin className="h-3 w-3 shrink-0 text-muted-foreground" />}
                      </div>
                      {c.last_message?.body ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {c.last_message.body}
                        </p>
                      ) : null}
                    </div>
                    {c.unread_count > 0 && (
                      <Badge variant="default" className="h-5 min-w-5 px-1 text-[10px]">
                        {c.unread_count}
                      </Badge>
                    )}
                  </button>
                </li>
              ))}
              {contactsQuery.isError && !contactsQuery.isLoading ? (
                <li className="px-3 py-8 text-center text-destructive text-sm">
                  {getApiErrorMessage(contactsQuery.error, t('Failed to load contacts'))}
                </li>
              ) : null}
              {filteredContacts.length === 0 && !contactsQuery.isLoading && !contactsQuery.isError ? (
                <li className="px-3 py-8 text-center text-muted-foreground">
                  {t('No contacts yet')}
                </li>
              ) : null}
            </ul>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium truncate">
                  {activeContact ? contactLabel(activeContact) : t('Select a conversation')}
                </span>
              </div>
              {activeContact && (
                <div className="flex shrink-0 gap-1">
                  {canFavorite && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => favoriteMutation.mutate(activeContact.id)}
                      title={t('Toggle favorite')}
                    >
                      {activeContact.is_favorite ? (
                        <StarOff className="h-4 w-4" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {canPin && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => pinMutation.mutate(activeContact.id)}
                      title={t('Toggle pin')}
                    >
                      {activeContact.is_pinned ? (
                        <PinOff className="h-4 w-4" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {hasMoreMessages && (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={messagesQuery.isFetching}
                    onClick={() => setMessagesPage((p) => p + 1)}
                  >
                    {t('Load older messages')}
                  </Button>
                </div>
              )}
              {allMessages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  currentUserId={currentUserId}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={(msg) => {
                    setEditingMessage(msg)
                    setEditDraft(msg.body)
                  }}
                  onDelete={setDeleteTarget}
                />
              ))}
              <div ref={messagesEndRef} />
              {activeId != null && messagesQuery.isLoading && messagesPage === 1 && (
                <p className="text-sm text-muted-foreground text-center">{t('Loading…')}</p>
              )}
              {activeId != null &&
                !messagesQuery.isLoading &&
                allMessages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-12">
                    {t('No messages yet. Say hello!')}
                  </p>
                )}
            </div>

            {editingMessage && (
              <div className="flex items-center gap-2 border-t bg-muted/40 px-3 py-2">
                <Input
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => editMutation.mutate()}
                  disabled={!editDraft.trim() || editMutation.isPending}
                >
                  {t('Save')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingMessage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <form
              className="flex flex-col gap-2 border-t p-3"
              onSubmit={(e) => {
                e.preventDefault()
                if (!activeId || (!draft.trim() && !attachmentFile)) return
                if (!canSend) return
                sendMutation.mutate()
              }}
            >
              {attachmentFile && (
                <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-1.5 text-sm">
                  <span className="truncate">{attachmentFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setAttachmentFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
                />
                {canSend && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={activeId == null}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          disabled={activeId == null}
                        >
                          <Smile className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <EmojiPicker
                          onEmojiSelect={(emoji) => setDraft((prev) => prev + emoji)}
                        />
                      </PopoverContent>
                    </Popover>
                  </>
                )}
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t('Type a message…')}
                  disabled={activeId == null || !canSend || sendMutation.isPending}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    activeId == null ||
                    !canSend ||
                    sendMutation.isPending ||
                    (!draft.trim() && !attachmentFile)
                  }
                >
                  <Send className="h-4 w-4 mr-1" />
                  {t('Send')}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('Delete message')}
        message={t('Are you sure you want to delete this message?')}
        confirmText={t('Delete')}
        variant="destructive"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </>
  )
}
