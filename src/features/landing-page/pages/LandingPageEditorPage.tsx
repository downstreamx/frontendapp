import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { getLandingSettings, updateLandingSettings } from '../landing-page-api'
import {
  LandingBenefitsTab,
  LandingFeaturesTab,
  LandingFooterTab,
  LandingGalleryTab,
  LandingModulesTab,
  LandingPricingTab,
  LandingStatsTab,
} from '../components/landing-section-tabs'
import {
  buildSavePayload,
  draftFromApi,
  getSectionData,
  mergeSection,
  type LandingDraft,
  sectionField,
} from '../lib/landing-config'

export function LandingPageEditorPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<LandingDraft | null>(null)

  usePageChrome({
    pageTitle: t('Landing page settings'),
    breadcrumbs: [{ label: t('Landing page') }],
  })

  const settingsQuery = useQuery({ queryKey: ['landing-page', 'settings'], queryFn: getLandingSettings })

  useEffect(() => {
    if (settingsQuery.data) {
      setDraft(draftFromApi(settingsQuery.data))
    }
  }, [settingsQuery.data])

  const saveSettingsMutation = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error('No draft')
      return updateLandingSettings(buildSavePayload(draft))
    },
    onSuccess: () => {
      toast.success(t('Landing settings saved'))
      void queryClient.invalidateQueries({ queryKey: ['landing-page', 'settings'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save settings'))),
  })

  if (!draft) {
    return settingsQuery.isLoading ? (
      <p className="text-sm text-muted-foreground">{t('Loading...')}</p>
    ) : null
  }

  const config = draft.config
  const patchConfig = (next: typeof config) => setDraft((prev) => (prev ? { ...prev, config: next } : prev))

  const cta = getSectionData(config, 'cta')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('Landing page settings')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            <Link to={paths.landingPagePages} className="text-primary hover:underline">
              {t('Custom pages')}
            </Link>
            {' · '}
            <Link to={paths.marketplaceSettings} className="text-primary hover:underline">
              {t('Module marketplace settings')}
            </Link>
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList className="mb-4 flex flex-wrap h-auto">
              <TabsTrigger value="general">{t('General')}</TabsTrigger>
              <TabsTrigger value="hero">{t('Hero')}</TabsTrigger>
              <TabsTrigger value="stats">{t('Statistics')}</TabsTrigger>
              <TabsTrigger value="features">{t('Features')}</TabsTrigger>
              <TabsTrigger value="modules">{t('Modules')}</TabsTrigger>
              <TabsTrigger value="benefits">{t('Benefits')}</TabsTrigger>
              <TabsTrigger value="gallery">{t('Gallery')}</TabsTrigger>
              <TabsTrigger value="cta">{t('Call to action')}</TabsTrigger>
              <TabsTrigger value="pricing">{t('Pricing')}</TabsTrigger>
              <TabsTrigger value="footer">{t('Footer')}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>{t('Company name')}</Label>
                  <Input
                    value={draft.company_name}
                    onChange={(e) => setDraft({ ...draft, company_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t('Contact email')}</Label>
                  <Input
                    type="email"
                    value={draft.contact_email}
                    onChange={(e) => setDraft({ ...draft, contact_email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t('Contact phone')}</Label>
                  <Input
                    value={draft.contact_phone}
                    onChange={(e) => setDraft({ ...draft, contact_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>{t('Contact address')}</Label>
                  <Input
                    value={draft.contact_address}
                    onChange={(e) => setDraft({ ...draft, contact_address: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hero" className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>{t('Hero title')}</Label>
                  <Input
                    value={sectionField(config, 'hero', 'title')}
                    onChange={(e) =>
                      patchConfig(mergeSection(config, 'hero', { title: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t('Hero subtitle')}</Label>
                  <Input
                    value={sectionField(config, 'hero', 'subtitle')}
                    onChange={(e) =>
                      patchConfig(mergeSection(config, 'hero', { subtitle: e.target.value }))
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats">
              <LandingStatsTab config={config} onConfigChange={patchConfig} />
            </TabsContent>

            <TabsContent value="features">
              <LandingFeaturesTab config={config} onConfigChange={patchConfig} />
            </TabsContent>

            <TabsContent value="modules">
              <LandingModulesTab config={config} onConfigChange={patchConfig} />
            </TabsContent>

            <TabsContent value="benefits">
              <LandingBenefitsTab config={config} onConfigChange={patchConfig} />
            </TabsContent>

            <TabsContent value="gallery">
              <LandingGalleryTab config={config} onConfigChange={patchConfig} />
            </TabsContent>

            <TabsContent value="cta" className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>{t('CTA title')}</Label>
                  <Input
                    value={(cta.title as string) || ''}
                    onChange={(e) =>
                      patchConfig(mergeSection(config, 'cta', { title: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>{t('CTA subtitle')}</Label>
                  <Textarea
                    value={(cta.subtitle as string) || ''}
                    onChange={(e) =>
                      patchConfig(mergeSection(config, 'cta', { subtitle: e.target.value }))
                    }
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t('Primary button')}</Label>
                  <Input
                    value={(cta.primary_button as string) || ''}
                    onChange={(e) =>
                      patchConfig(mergeSection(config, 'cta', { primary_button: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t('Secondary button')}</Label>
                  <Input
                    value={(cta.secondary_button as string) || ''}
                    onChange={(e) =>
                      patchConfig(
                        mergeSection(config, 'cta', { secondary_button: e.target.value }),
                      )
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing">
              <LandingPricingTab config={config} onConfigChange={patchConfig} />
            </TabsContent>

            <TabsContent value="footer">
              <LandingFooterTab config={config} onConfigChange={patchConfig} />
            </TabsContent>
          </Tabs>

          <Button
            size="sm"
            className="mt-4"
            onClick={() => saveSettingsMutation.mutate()}
            disabled={saveSettingsMutation.isPending}
          >
            {t('Save settings')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
