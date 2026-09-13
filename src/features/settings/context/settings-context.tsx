import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useAppContext } from '@/contexts/app-context'
import type { ApiSuccess } from '@/lib/api'
import type { SettingsPayload } from '../types'

type SettingsContextValue = {
  payload: SettingsPayload | undefined
  userSettings: Record<string, string>
  isLoading: boolean
  isError: boolean
  isSaving: boolean
  saveTab: (tab: string, settings: Record<string, string>) => Promise<void>
  canEdit: (editPermission: string) => boolean
  imageUrlPrefix: string
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

function flattenGroups(groups: Record<string, Record<string, string>>): Record<string, string> {
  return Object.values(groups).reduce<Record<string, string>>(
    (acc, group) => ({ ...acc, ...group }),
    {},
  )
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { auth, imageUrlPrefix } = useAppContext()

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<SettingsPayload>>('/settings')
      return data.data
    },
  })

  const saveMutation = useMutation({
    mutationFn: async ({
      tab,
      settings,
    }: {
      tab: string
      settings: Record<string, string>
    }) => {
      await api.put('/settings', { tab, settings })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['settings'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() }),
      ])
      toast.success('Settings saved')
    },
    onError: () => {
      toast.error('Failed to save settings')
    },
  })

  const saveTab = useCallback(
    async (tab: string, settings: Record<string, string>) => {
      await saveMutation.mutateAsync({ tab, settings })
    },
    [saveMutation],
  )

  const canEdit = useCallback(
    (editPermission: string) => {
      if (
        auth.permissions.includes('manage-settings') ||
        auth.permissions.includes('edit-settings') ||
        auth.roles.includes('superadmin') ||
        auth.roles.includes('company') ||
        auth.user?.type === 'superadmin' ||
        auth.user?.type === 'company'
      ) {
        return true
      }
      return auth.permissions.includes(editPermission)
    },
    [auth.permissions, auth.roles, auth.user?.type],
  )

  const value: SettingsContextValue = {
    payload: settingsQuery.data,
    userSettings: settingsQuery.data
      ? flattenGroups(settingsQuery.data.groups)
      : {},
    isLoading: settingsQuery.isLoading,
    isError: settingsQuery.isError,
    isSaving: saveMutation.isPending,
    saveTab,
    canEdit,
    imageUrlPrefix,
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettingsContext(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error('useSettingsContext must be used within SettingsProvider')
  }
  return ctx
}
