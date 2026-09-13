import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EntitySelect } from '@/components/forms/entity-select'
import { MediaPicker } from '@/features/media/components/MediaPicker'
import { paths } from '@/lib/paths'
import {
  getMarketplaceSettings,
  listMarketplaceModules,
  saveMarketplaceSettings,
  type MarketplaceSetting,
} from '../marketplace-api'

export function MarketplaceSettingsPage() {
  const queryClient = useQueryClient()
  const [selectedModule, setSelectedModule] = useState('')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [heroImage, setHeroImage] = useState('')
  const [screenshotImages, setScreenshotImages] = useState<string[]>([])

  const modulesQuery = useQuery({
    queryKey: ['marketplace', 'modules'],
    queryFn: listMarketplaceModules,
  })

  useEffect(() => {
    if (!selectedModule && modulesQuery.data?.length) {
      setSelectedModule(modulesQuery.data[0].module)
    }
  }, [modulesQuery.data, selectedModule])

  const settingsQuery = useQuery({
    queryKey: ['marketplace', 'settings', selectedModule],
    queryFn: () => getMarketplaceSettings(selectedModule),
    enabled: Boolean(selectedModule),
  })

  useEffect(() => {
    const s = settingsQuery.data
    if (!s) return
    setTitle(s.title ?? '')
    setSubtitle(s.subtitle ?? '')
    const hero = s.config_sections?.sections?.hero as Record<string, string> | undefined
    setHeroTitle(hero?.title ?? '')
    setHeroSubtitle(hero?.subtitle ?? '')
    setHeroImage(typeof hero?.image === 'string' ? hero.image : '')
    const shots = s.config_sections?.sections?.screenshots as { images?: string[] } | undefined
    setScreenshotImages(Array.isArray(shots?.images) ? shots.images : [])
  }, [settingsQuery.data])

  const saveMutation = useMutation({
    mutationFn: () => {
      const existing = settingsQuery.data
      const payload: MarketplaceSetting = {
        module: selectedModule,
        title,
        subtitle,
        config_sections: {
          ...existing?.config_sections,
          sections: {
            ...existing?.config_sections?.sections,
            hero: {
              ...(existing?.config_sections?.sections?.hero as object),
              variant: 'hero1',
              title: heroTitle,
              subtitle: heroSubtitle,
              image: heroImage,
            },
            screenshots: {
              ...(existing?.config_sections?.sections?.screenshots as object),
              variant: 'screenshots1',
              title: (existing?.config_sections?.sections?.screenshots as { title?: string })?.title ?? 'Screenshots',
              images: screenshotImages,
            },
          },
          section_visibility: existing?.config_sections?.section_visibility ?? {
            hero: true,
            screenshots: true,
          },
          section_order: existing?.config_sections?.section_order ?? ['hero', 'screenshots'],
        },
      }
      return saveMarketplaceSettings(payload)
    },
    onSuccess: () => {
      toast.success('Marketplace settings saved')
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'settings', selectedModule] })
    },
    onError: () => toast.error('Failed to save marketplace settings'),
  })

  const moduleOptions = (modulesQuery.data ?? []).map((m) => ({
    value: m.module,
    label: m.name || m.module,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Module marketplace settings</CardTitle>
          <CardDescription>
            Configure public marketplace pages shown for each add-on module.{' '}
            <Link to={paths.landingPage} className="text-primary hover:underline">
              Landing page editor
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md space-y-2">
            <Label>Module</Label>
            <EntitySelect
              value={selectedModule}
              onValueChange={setSelectedModule}
              options={moduleOptions}
              placeholder="Select module"
            />
          </div>

          {selectedModule && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Page title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                </div>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Hero section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Hero title</Label>
                    <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero subtitle</Label>
                    <Textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={2} />
                  </div>
                  <MediaPicker
                    label="Hero image"
                    value={heroImage}
                    onChange={(v) => setHeroImage(typeof v === 'string' ? v : '')}
                    placeholder="Select hero image"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Screenshots</CardTitle>
                </CardHeader>
                <CardContent>
                  <MediaPicker
                    label="Screenshot gallery"
                    multiple
                    value={screenshotImages}
                    onChange={(v) => setScreenshotImages(Array.isArray(v) ? v : [])}
                    placeholder="Select screenshots"
                  />
                </CardContent>
              </Card>

              <Button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || settingsQuery.isLoading}
              >
                {saveMutation.isPending ? 'Saving…' : 'Save settings'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
