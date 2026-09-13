import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchNotificationFeed,
  markNotificationsRead,
  type NotificationFeedPayload,
} from '../notification-feed-api'

export const notificationFeedQueryKey = ['notifications', 'feed'] as const

function applyMarkRead(
  feed: NotificationFeedPayload | undefined,
  options?: { ids?: number[]; all?: boolean },
): NotificationFeedPayload | undefined {
  if (!feed) return feed

  if (options?.all) {
    const removedUnread = feed.notifications.filter((n) => !n.is_read).length
    return {
      ...feed,
      notifications: [],
      unread_count: Math.max(0, feed.unread_count - removedUnread),
    }
  }

  const ids = new Set(options?.ids ?? [])
  if (ids.size === 0) return feed

  const removedUnread = feed.notifications.filter((n) => ids.has(n.id) && !n.is_read).length

  return {
    ...feed,
    notifications: feed.notifications.filter((n) => !ids.has(n.id)),
    unread_count: Math.max(0, feed.unread_count - removedUnread),
  }
}

export function useNotificationFeed() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: notificationFeedQueryKey,
    queryFn: () => fetchNotificationFeed(25),
    refetchInterval: 45_000,
  })

  const markReadMutation = useMutation({
    mutationFn: markNotificationsRead,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: notificationFeedQueryKey })
      const previous = queryClient.getQueryData<NotificationFeedPayload>(notificationFeedQueryKey)
      queryClient.setQueryData<NotificationFeedPayload>(notificationFeedQueryKey, (current) =>
        applyMarkRead(current, variables),
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationFeedQueryKey, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationFeedQueryKey })
    },
  })

  return { query, markReadMutation }
}

export type { NotificationFeedPayload }
