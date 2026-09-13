import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, CheckCircle2, Globe, Save, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MediaPicker } from '@/features/media/components/MediaPicker'
import { getImagePath } from '@/utils/helpers'
import { toast } from 'sonner'
import { useSettingsContext } from '../context/settings-context'
import type { SettingsSectionProps } from '../types'

const TAB = 'SEO'

type SeoForm = {
  metaTitle: string
  metaKeywords: string
  metaDescription: string
  metaImage: string
}

function fromApi(userSettings: Record<string, string>): SeoForm {
  return {
    metaTitle: userSettings.metaTitle || '',
    metaKeywords: userSettings.metaKeywords || '',
    metaDescription: userSettings.metaDescription || '',
    metaImage: userSettings.metaImage || '',
  }
}

export function SeoSettingsSection(_props: SettingsSectionProps) {
  const { t } = useTranslation()
  const { userSettings, saveTab, isSaving, canEdit } = useSettingsContext()
  const canEditSection = canEdit('edit-seo-settings')
  const [settings, setSettings] = useState<SeoForm>(() => fromApi(userSettings))

  useEffect(() => {
    setSettings(fromApi(userSettings))
  }, [userSettings])

  const handleInputChange = (name: keyof SeoForm, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const getDescriptionStatus = () => {
    const length = settings.metaDescription.length
    if (length === 0) {
      return { color: 'text-muted-foreground', icon: AlertCircle }
    }
    if (length < 120) {
      return { color: 'text-orange-500', icon: AlertCircle }
    }
    if (length <= 160) {
      return { color: 'text-green-500', icon: CheckCircle2 }
    }
    return { color: 'text-red-500', icon: AlertCircle }
  }

  const getKeywordsCount = () =>
    settings.metaKeywords.split(',').filter((k) => k.trim()).length

  const handleSave = async () => {
    if (!settings.metaTitle.trim()) {
      toast.error(t('Meta title is required.'))
      return
    }
    if (!settings.metaDescription.trim()) {
      toast.error(t('Meta description is required.'))
      return
    }
    await saveTab(TAB, settings as unknown as Record<string, string>)
  }

  const descStatus = getDescriptionStatus()
  const DescriptionStatusIcon = descStatus.icon

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="order-1 rtl:order-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            {t('SEO Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t("Configure SEO settings to improve your website's search engine visibility")}
          </p>
        </div>
        {canEditSection && (
          <Button className="order-2 rtl:order-1" onClick={handleSave} disabled={isSaving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t('Saving...') : t('Save Changes')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaTitle">{t('Meta Title')}</Label>
                <span
                  className={`text-sm ${
                    settings.metaTitle.length > 60
                      ? 'text-red-500'
                      : settings.metaTitle.length > 50
                        ? 'text-orange-500'
                        : 'text-green-500'
                  }`}
                >
                  {settings.metaTitle.length}/60
                </span>
              </div>
              <Input
                id="metaTitle"
                value={settings.metaTitle}
                onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                placeholder={t('Enter page title for search engines')}
                maxLength={60}
                disabled={!canEditSection}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaDescription">{t('Meta Description')}</Label>
                <div className="flex items-center gap-1">
                  <DescriptionStatusIcon className={`h-4 w-4 ${descStatus.color}`} />
                  <span className={`text-sm ${descStatus.color}`}>
                    {settings.metaDescription.length}/160
                  </span>
                </div>
              </div>
              <Textarea
                id="metaDescription"
                value={settings.metaDescription}
                onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                placeholder={t('Write a compelling description that summarizes your page content...')}
                maxLength={160}
                rows={3}
                disabled={!canEditSection}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaKeywords">{t('Meta Keywords')}</Label>
                <Badge variant="outline">
                  {getKeywordsCount()} {t('keywords')}
                </Badge>
              </div>
              <Input
                id="metaKeywords"
                value={settings.metaKeywords}
                onChange={(e) => handleInputChange('metaKeywords', e.target.value)}
                placeholder={t('seo, optimization, website, keywords')}
                disabled={!canEditSection}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('Meta Image')}</Label>
              <MediaPicker
                value={settings.metaImage}
                onChange={(url) => {
                  const urlString = Array.isArray(url) ? url[0] || '' : url
                  handleInputChange('metaImage', urlString)
                }}
                placeholder={t('Select image for social media sharing...')}
                showPreview={false}
                disabled={!canEditSection}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-medium">{t('SEO Preview')}</h3>
                </div>
                <div className="border rounded-md p-3 bg-background">
                  <div className="text-xs text-green-600 mb-1">example.com</div>
                  <div className="text-sm font-medium text-blue-600 line-clamp-1">
                    {settings.metaTitle || t('Your page title will appear here')}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {settings.metaDescription ||
                      t('Your meta description will appear here in search results...')}
                  </div>
                </div>
                {settings.metaImage ? (
                  <div className="border rounded-md p-3">
                    <img
                      src={getImagePath(settings.metaImage)}
                      alt={t('Social preview')}
                      className="w-full h-24 object-contain rounded mb-2 bg-muted"
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
