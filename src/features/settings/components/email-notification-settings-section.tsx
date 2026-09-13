import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Mail, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppContext } from '@/contexts/app-context'
import { getApiErrorMessage } from '@/lib/errors'
import { queryKeys } from '@/lib/query-keys'
import {
  getEmailNotificationSettings,
  updateEmailNotificationSettings,
  type EmailNotificationRow,
} from '../email-notification-api'
import { useSettingsContext } from '../context/settings-context'

function moduleLabel(module: string, t: (key: string) => string): string {
  if (module === 'general') {
    return t('General')
  }
  return module.replace(/([a-z])([A-Z])/g, '$1 $2')
}

export function EmailNotificationSettingsSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const { canEdit } = useSettingsContext()
  const canEditNotifications =
    canEdit('manage-email-notification-settings') ||
    auth.permissions.includes('manage-email-notification-settings')

  const settingsQuery = useQuery({
    queryKey: ['email-notification-settings'],
    queryFn: getEmailNotificationSettings,
  })

  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!settingsQuery.data) {
      return
    }
    const initial: Record<string, string> = {}
    for (const rows of Object.values(settingsQuery.data.modules)) {
      for (const row of rows) {
        initial[row.action] = row.value === 'on' ? 'on' : 'off'
      }
    }
    setValues(initial)
  }, [settingsQuery.data])

  const filteredModules = useMemo(() => {
    if (!settingsQuery.data) {
      return []
    }
    const keys = Object.keys(settingsQuery.data.modules)
    if (settingsQuery.data.is_superadmin) {
      return keys
    }
    return keys.filter(
      (module) =>
        module.toLowerCase() === 'general' || auth.activatedPackages.includes(module),
    )
  }, [settingsQuery.data, auth.activatedPackages])

  const visibleNotifications = (module: string): EmailNotificationRow[] => {
    const rows = settingsQuery.data?.modules[module] ?? []
    if (
      auth.permissions.includes('manage-settings') ||
      auth.permissions.includes('manage-email-notification-settings')
    ) {
      return rows
    }
    return rows.filter((row) => auth.permissions.includes(row.permissions))
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, 'on' | 'off'> = {}
      for (const module of filteredModules) {
        for (const row of visibleNotifications(module)) {
          payload[row.action] = values[row.action] === 'on' ? 'on' : 'off'
        }
      }
      return updateEmailNotificationSettings(payload)
    },
    onSuccess: async () => {
      toast.success(t('Mail notification settings saved successfully.'))
      await queryClient.invalidateQueries({ queryKey: ['email-notification-settings'] })
      await queryClient.invalidateQueries({ queryKey: ['settings'] })
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, t('Failed to save notification settings'))),
  })

  if (settingsQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  if (settingsQuery.isError) {
    return (
      <p className="text-sm text-destructive">
        {t('Could not load email notification settings.')}
      </p>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="h-5 w-5" />
          {t('Email Notification Settings')}
        </CardTitle>
        {canEditNotifications && (
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? t('Saving…') : t('Save Changes')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {filteredModules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('No email notifications configured.')}
          </p>
        ) : (
          <Tabs defaultValue={filteredModules[0]}>
            <TabsList className="mb-4 flex flex-wrap h-auto">
              {filteredModules.map((module) => (
                <TabsTrigger key={module} value={module} className="capitalize">
                  {moduleLabel(module, t)}
                </TabsTrigger>
              ))}
            </TabsList>
            {filteredModules.map((module) => {
              const rows = visibleNotifications(module)
              return (
                <TabsContent key={module} value={module}>
                  {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('No notifications available for your role in this module.')}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {rows.map((row) => (
                        <div
                          key={row.id}
                          className="flex items-center justify-between rounded-lg border bg-muted/40 p-4"
                        >
                          <span className="font-medium text-sm">{row.action}</span>
                          <Switch
                            checked={values[row.action] === 'on'}
                            onCheckedChange={(checked) =>
                              setValues((prev) => ({
                                ...prev,
                                [row.action]: checked ? 'on' : 'off',
                              }))
                            }
                            disabled={!canEditNotifications}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
