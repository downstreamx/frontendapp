import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CircleAlert,
  Info,
  Package,
  Receipt,
  Settings,
  Truck,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/format-relative-time'
import { paths } from '@/lib/paths'
import { useNotificationFeed } from '@/features/notifications/hooks/use-notification-feed'
import type {
  ActionableNotificationItem,
  InboxNotification,
  NotificationSeverity,
} from '@/features/notifications/notification-feed-api'

type Props = {
  variant?: 'operations' | 'portal'
}

function severityDotClass(severity: NotificationSeverity): string {
  switch (severity) {
    case 'critical':
      return 'bg-destructive'
    case 'warning':
      return 'bg-amber-500'
    default:
      return 'bg-primary'
  }
}

function categoryIcon(category: string) {
  switch (category) {
    case 'bridging':
      return Truck
    case 'sales':
      return Receipt
    case 'purchase':
      return Package
    case 'payment':
      return Wallet
    default:
      return Info
  }
}

function ActionItemRow({ item }: { item: ActionableNotificationItem }) {
  const Icon = categoryIcon('bridging')

  return (
    <Link
      to={item.href}
      className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/80"
    >
      <span
        className={cn(
          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
          severityDotClass(item.severity),
        )}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium leading-snug text-foreground">{item.label}</span>
        <span className="text-xs text-muted-foreground">Tap to review queue</span>
      </span>
      <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
        {item.count > 99 ? '99+' : item.count}
      </span>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-60" aria-hidden />
    </Link>
  )
}

function InboxRow({
  item,
  onMarkRead,
}: {
  item: InboxNotification
  onMarkRead: (id: number) => void
}) {
  const Icon = categoryIcon(item.category)

  return (
    <Link
      to={item.href}
      onClick={() => {
        if (!item.is_read) {
          onMarkRead(item.id)
        }
      }}
      className={cn(
        'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/80',
        !item.is_read && 'bg-section/60',
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          item.severity === 'critical'
            ? 'bg-destructive/10 text-destructive'
            : item.severity === 'warning'
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
              : 'bg-primary/10 text-primary',
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-start justify-between gap-2">
          <span
            className={cn(
              'text-sm leading-snug',
              item.is_read ? 'font-normal text-foreground/90' : 'font-medium text-foreground',
            )}
          >
            {item.title}
          </span>
          {!item.is_read ? (
            <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', severityDotClass(item.severity))} />
          ) : null}
        </span>
        {item.body ? (
          <span className="line-clamp-2 text-xs text-muted-foreground">{item.body}</span>
        ) : null}
        <span className="text-[11px] text-muted-foreground/80">
          {formatRelativeTime(item.created_at)}
        </span>
      </span>
    </Link>
  )
}

export function NotificationsBell({ variant = 'operations' }: Props) {
  const { t } = useTranslation()
  const isPortal = variant === 'portal'
  const { query, markReadMutation } = useNotificationFeed()

  const feed = query.data
  const unread = feed?.unread_count ?? 0
  const actionItems = feed?.action_items ?? []
  const notifications = (feed?.notifications ?? []).filter((n) => !n.is_read)
  const unreadInbox = notifications.length

  const handleMarkAllRead = () => {
    markReadMutation.mutate({ all: true })
  }

  const handleMarkOneRead = (id: number) => {
    markReadMutation.mutate({ ids: [id] })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t('Notifications')}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground ring-2 ring-background">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="flex w-[min(100vw-2rem,24rem)] max-h-[min(90vh,32rem)] flex-col overflow-hidden p-0 shadow-lg"
        sideOffset={8}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-section/40 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isPortal ? t('Delivery updates') : t('Notifications')}
            </p>
            <p className="text-xs text-muted-foreground">
              {unread > 0
                ? t('{{count}} items need attention', { count: unread })
                : t('You are all caught up')}
            </p>
          </div>
          {unreadInbox > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 gap-1 text-xs"
              disabled={markReadMutation.isPending}
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t('Mark read')}
            </Button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {query.isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t('Loading...')}</p>
          ) : (
            <div className="space-y-1 p-2">
              {actionItems.length > 0 ? (
                <section>
                  <p className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <AlertTriangle className="h-3 w-3" />
                    {t('Needs attention')}
                  </p>
                  {actionItems.map((item) => (
                    <ActionItemRow key={item.key} item={item} />
                  ))}
                </section>
              ) : null}

              {actionItems.length > 0 && notifications.length > 0 ? (
                <Separator className="my-2" />
              ) : null}

              {notifications.length > 0 ? (
                <section>
                  <p className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <CircleAlert className="h-3 w-3" />
                    {t('Recent alerts')}
                  </p>
                  {notifications.map((item) => (
                    <InboxRow key={item.id} item={item} onMarkRead={handleMarkOneRead} />
                  ))}
                </section>
              ) : null}

              {actionItems.length === 0 && notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Bell className="h-6 w-6 text-muted-foreground" />
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {isPortal ? t('No active deliveries') : t('No notifications yet')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPortal
                      ? t('Updates on your orders will appear here.')
                      : t('Critical downstream events will appear here and by email.')}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {!isPortal ? (
          <div className="shrink-0 border-t bg-muted/30 px-3 py-2">
            <Button variant="ghost" size="sm" className="h-8 w-full justify-start gap-2 text-xs" asChild>
              <Link to={`${paths.settings}#email-notification-settings`}>
                <Settings className="h-3.5 w-3.5" />
                {t('Notification settings')}
              </Link>
            </Button>
          </div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function PortalNotificationsBell() {
  return <NotificationsBell variant="portal" />
}

/** @deprecated Use NotificationsBell */
export const ActionableNotificationsBell = NotificationsBell
