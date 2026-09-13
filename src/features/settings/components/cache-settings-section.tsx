import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HardDrive, Trash2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSettingsContext } from '../context/settings-context'
import { clearSettingsCache, optimizeSettingsSite } from '../settings-actions-api'

export function CacheSettingsSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { canEdit, payload } = useSettingsContext()
  const canClearCache = canEdit('clear-cache') || canEdit('edit-cache-settings')
  const [cacheSizeMb, setCacheSizeMb] = useState(payload?.cache_size_mb ?? '0.00')

  useEffect(() => {
    if (payload?.cache_size_mb) {
      setCacheSizeMb(payload.cache_size_mb)
    }
  }, [payload?.cache_size_mb])

  const refreshCacheSize = async () => {
    await queryClient.invalidateQueries({ queryKey: ['settings'] })
    const refreshed = queryClient.getQueryData<{ cache_size_mb?: string }>(['settings'])
    if (refreshed?.cache_size_mb) {
      setCacheSizeMb(refreshed.cache_size_mb)
    }
  }

  const clearMutation = useMutation({
    mutationFn: clearSettingsCache,
    onSuccess: (data) => {
      setCacheSizeMb(data.cache_size_mb)
      toast.success(data.message)
      void refreshCacheSize()
    },
    onError: () => toast.error(t('Failed to clear cache')),
  })

  const optimizeMutation = useMutation({
    mutationFn: optimizeSettingsSite,
    onSuccess: (data) => {
      setCacheSizeMb(data.cache_size_mb)
      toast.success(data.message)
      void refreshCacheSize()
    },
    onError: () => toast.error(t('Failed to optimize site')),
  })

  const displaySize = payload?.cache_size_mb ?? cacheSizeMb
  const busy = clearMutation.isPending || optimizeMutation.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HardDrive className="h-5 w-5" />
          {t('Cache Settings')}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {t('Manage application cache to improve performance')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {t("This is a page meant for more advanced users, simply ignore it if you don't understand what cache is.")}
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3 order-1 rtl:order-2">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              <div>
                <h4 className="font-medium">{t('Current Cache Size')}</h4>
                <p className="text-sm text-muted-foreground">
                  {displaySize} MB {t('of cached data')}
                </p>
              </div>
            </div>
            {canClearCache && (
              <div className="flex gap-2 order-2 rtl:order-1">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={busy}
                  onClick={() => clearMutation.mutate()}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {clearMutation.isPending ? t('Clearing...') : t('Clear Cache')}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  disabled={busy}
                  onClick={() => optimizeMutation.mutate()}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {optimizeMutation.isPending ? t('Optimizing...') : t('Optimize Site')}
                </Button>
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p>{t('Clearing cache will remove')}:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>{t('Application cache')}</li>
              <li>{t('Route cache')}</li>
              <li>{t('View cache')}</li>
              <li>{t('Configuration cache')}</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
