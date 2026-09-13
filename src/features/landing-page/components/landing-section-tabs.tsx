import { useTranslation } from 'react-i18next'
import { Image, Layout, Monitor, Settings as SettingsIcon, Sparkles, Star, Tag } from 'lucide-react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LandingListEditor } from './landing-list-editor'
import { LandingSectionCard } from './landing-section-card'
import type { ConfigSections } from '../lib/landing-config'
import {
  getSectionData,
  mergeSection,
  setSectionVisibility,
} from '../lib/landing-config'

type SectionEditorProps = {
  config: ConfigSections
  onConfigChange: (config: ConfigSections) => void
}

const FEATURE_ICON_OPTIONS = [
  { value: 'Building2', label: 'Building' },
  { value: 'Calculator', label: 'Calculator' },
  { value: 'Users', label: 'Users' },
  { value: 'CreditCard', label: 'Credit Card' },
  { value: 'UserCheck', label: 'User Check' },
  { value: 'FolderOpen', label: 'Folder' },
]

function useSectionEditor({ config, onConfigChange }: SectionEditorProps) {
  const patchSection = (key: string, updates: Record<string, unknown>) => {
    onConfigChange(mergeSection(config, key, updates))
  }
  const patchVisibility = (key: string, visible: boolean) => {
    onConfigChange(setSectionVisibility(config, key, visible))
  }
  return { patchSection, patchVisibility, get: (key: string) => getSectionData(config, key) }
}

export function LandingStatsTab(props: SectionEditorProps) {
  const { t } = useTranslation()
  const { config } = props
  const { patchSection, patchVisibility, get } = useSectionEditor(props)
  const stats = (get('stats').stats as { label?: string; value?: string }[]) ?? []

  return (
    <LandingSectionCard
      sectionKey="stats"
      config={config}
      title={t('Statistics Section')}
      description={t('Key business metrics and numbers')}
      icon={SettingsIcon}
      iconClassName="bg-blue-100 dark:bg-blue-950"
      onVisibilityChange={(visible) => patchVisibility('stats', visible)}
    >
      <div className="space-y-2">
        <Label>{t('Stats Variant')}</Label>
        <Select
          value={(get('stats').variant as string) || 'stats1'}
          onValueChange={(value) => patchSection('stats', { variant: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('Select Stats Style')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stats1">{t('Colored Background')}</SelectItem>
            <SelectItem value="stats2">{t('Cards')}</SelectItem>
            <SelectItem value="stats3">{t('Minimal')}</SelectItem>
            <SelectItem value="stats4">{t('Circular')}</SelectItem>
            <SelectItem value="stats5">{t('Gradient')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-4">
        <Label>{t('Statistics')}</Label>
        <LandingListEditor
          fields={[
            { name: 'label', label: t('Label'), type: 'text', placeholder: t('Stat label') },
            { name: 'value', label: t('Value'), type: 'text', placeholder: t('Stat value') },
          ]}
          value={stats.map((stat, index) => ({
            id: `stat-${index}`,
            label: stat.label ?? '',
            value: stat.value ?? '',
          }))}
          onChange={(items) => {
            patchSection(
              'stats',
              { stats: items.map(({ id: _id, ...item }) => item) },
            )
          }}
          addButtonText={t('Add Statistic')}
          minItems={1}
        />
      </div>
    </LandingSectionCard>
  )
}

export function LandingModulesTab(props: SectionEditorProps) {
  const { t } = useTranslation()
  const { config } = props
  const { patchSection, patchVisibility, get } = useSectionEditor(props)
  const modules = (get('modules').modules as Record<string, string>[]) ?? []

  return (
    <LandingSectionCard
      sectionKey="modules"
      config={config}
      title={t('Business Modules')}
      description={t('Tabbed modules showcase section')}
      icon={Monitor}
      iconClassName="bg-purple-100 dark:bg-purple-950"
      onVisibilityChange={(visible) => patchVisibility('modules', visible)}
    >
      <div className="space-y-2">
        <Label>{t('Modules Variant')}</Label>
        <Select
          value={(get('modules').variant as string) || 'modules1'}
          onValueChange={(value) => patchSection('modules', { variant: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('Select Modules Style')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="modules1">{t('Tabs')}</SelectItem>
            <SelectItem value="modules2">{t('Cards')}</SelectItem>
            <SelectItem value="modules3">{t('Accordion')}</SelectItem>
            <SelectItem value="modules4">{t('Slider')}</SelectItem>
            <SelectItem value="modules5">{t('Grid')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t('Section Title')}</Label>
        <Input
          value={(get('modules').title as string) || ''}
          onChange={(e) => patchSection('modules', { title: e.target.value })}
          placeholder={t('Complete Business Solutions')}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('Section Subtitle')}</Label>
        <Textarea
          value={(get('modules').subtitle as string) || ''}
          onChange={(e) => patchSection('modules', { subtitle: e.target.value })}
          placeholder={t(
            'Discover our comprehensive modules designed to streamline every aspect of your business operations',
          )}
          rows={3}
        />
      </div>
      <div className="space-y-4">
        <Label>{t('Modules List')}</Label>
        <LandingListEditor
          fields={[
            { name: 'key', label: t('Module Key'), type: 'text', placeholder: t('sales') },
            { name: 'label', label: t('Module Label'), type: 'text', placeholder: t('Sales & Accounting') },
            {
              name: 'title',
              label: t('Module Title'),
              type: 'text',
              placeholder: t('Account Helps You Simplify Your Accounting and Billing'),
            },
            { name: 'description', label: t('Module Description'), type: 'textarea', placeholder: t('Module description') },
            { name: 'image', label: t('Module Image'), type: 'image', placeholder: t('Select module image...') },
          ]}
          value={modules.map((mod, index) => ({
            id: `module-${index}`,
            key: mod.key ?? '',
            label: mod.label ?? '',
            title: mod.title ?? '',
            description: mod.description ?? '',
            image: mod.image ?? '',
          }))}
          onChange={(items) => {
            patchSection(
              'modules',
              { modules: items.map(({ id: _id, ...item }) => item) },
            )
          }}
          addButtonText={t('Add Module')}
          minItems={1}
        />
      </div>
    </LandingSectionCard>
  )
}

export function LandingGalleryTab(props: SectionEditorProps) {
  const { t } = useTranslation()
  const { config } = props
  const { patchSection, patchVisibility, get } = useSectionEditor(props)
  const images = (get('gallery').images as string[]) ?? []

  return (
    <LandingSectionCard
      sectionKey="gallery"
      config={config}
      title={t('Image Gallery')}
      description={t('Product showcase slider')}
      icon={Image}
      iconClassName="bg-indigo-100 dark:bg-indigo-950"
      onVisibilityChange={(visible) => patchVisibility('gallery', visible)}
    >
      <div className="space-y-2">
        <Label>{t('Gallery Variant')}</Label>
        <Select
          value={(get('gallery').variant as string) || 'gallery1'}
          onValueChange={(value) => patchSection('gallery', { variant: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('Select Gallery Style')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gallery1">{t('Slider')}</SelectItem>
            <SelectItem value="gallery2">{t('Grid')}</SelectItem>
            <SelectItem value="gallery3">{t('Stacked')}</SelectItem>
            <SelectItem value="gallery4">{t('Carousel')}</SelectItem>
            <SelectItem value="gallery5">{t('Lightbox')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t('Section Title')}</Label>
        <Input
          value={(get('gallery').title as string) || ''}
          onChange={(e) => patchSection('gallery', { title: e.target.value })}
          placeholder={t('Gallery')}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('Section Subtitle')}</Label>
        <Input
          value={(get('gallery').subtitle as string) || ''}
          onChange={(e) => patchSection('gallery', { subtitle: e.target.value })}
          placeholder={t('Explore our product in action')}
        />
      </div>
      <div className="space-y-4">
        <Label>{t('Gallery Images')}</Label>
        <LandingListEditor
          fields={[
            { name: 'image', label: t('Image'), type: 'image', placeholder: t('Select image...') },
          ]}
          value={images.map((image, index) => ({
            id: `image-${index}`,
            image: image ?? '',
          }))}
          onChange={(items) => {
            patchSection('gallery', { images: items.map((item) => item.image) })
          }}
          addButtonText={t('Add Image')}
          minItems={1}
        />
      </div>
    </LandingSectionCard>
  )
}

export function LandingFeaturesTab(props: SectionEditorProps) {
  const { t } = useTranslation()
  const { config } = props
  const { patchSection, patchVisibility, get } = useSectionEditor(props)
  const features = (get('features').features as Record<string, string>[]) ?? []

  return (
    <LandingSectionCard
      sectionKey="features"
      config={config}
      title={t('Features Content')}
      description={t('Manage your product features')}
      icon={Star}
      iconClassName="bg-blue-100 dark:bg-blue-950"
      onVisibilityChange={(visible) => patchVisibility('features', visible)}
    >
      <div className="space-y-2">
        <Label>{t('Features Variant')}</Label>
        <Select
          value={(get('features').variant as string) || 'features1'}
          onValueChange={(value) => patchSection('features', { variant: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('Select Features Style')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="features1">{t('Grid')}</SelectItem>
            <SelectItem value="features2">{t('List')}</SelectItem>
            <SelectItem value="features3">{t('Cards')}</SelectItem>
            <SelectItem value="features4">{t('Split')}</SelectItem>
            <SelectItem value="features5">{t('Carousel')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t('Section Title')}</Label>
        <Input
          value={(get('features').title as string) || ''}
          onChange={(e) => patchSection('features', { title: e.target.value })}
          placeholder={t('Powerful Features')}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('Section Subtitle')}</Label>
        <Textarea
          value={(get('features').subtitle as string) || ''}
          onChange={(e) => patchSection('features', { subtitle: e.target.value })}
          placeholder={t('Everything your business needs in one integrated platform')}
          rows={3}
        />
      </div>
      <div className="space-y-4">
        <Label>{t('Features List')}</Label>
        <LandingListEditor
          fields={[
            { name: 'title', label: t('Feature Title'), type: 'text', placeholder: t('Feature title') },
            { name: 'description', label: t('Feature Description'), type: 'textarea', placeholder: t('Feature description') },
            { name: 'icon', label: t('Icon'), type: 'select', options: FEATURE_ICON_OPTIONS },
          ]}
          value={features.map((feature, index) => ({
            id: `feature-${index}`,
            title: feature.title ?? '',
            description: feature.description ?? '',
            icon: feature.icon ?? 'Building2',
          }))}
          onChange={(items) => {
            patchSection(
              'features',
              { features: items.map(({ id: _id, ...item }) => item) },
            )
          }}
          addButtonText={t('Add Feature')}
          minItems={1}
        />
      </div>
    </LandingSectionCard>
  )
}

export function LandingBenefitsTab(props: SectionEditorProps) {
  const { t } = useTranslation()
  const { config } = props
  const { patchSection, patchVisibility, get } = useSectionEditor(props)
  const benefits = (get('benefits').benefits as { title?: string; description?: string }[]) ?? []

  return (
    <LandingSectionCard
      sectionKey="benefits"
      config={config}
      title={t('Benefits Section')}
      description={t('Expandable benefits accordion')}
      icon={Sparkles}
      iconClassName="bg-emerald-100 dark:bg-emerald-950"
      onVisibilityChange={(visible) => patchVisibility('benefits', visible)}
    >
      <div className="space-y-2">
        <Label>{t('Benefits Variant')}</Label>
        <Select
          value={(get('benefits').variant as string) || 'benefits1'}
          onValueChange={(value) => patchSection('benefits', { variant: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('Select Benefits Style')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="benefits1">{t('Accordion')}</SelectItem>
            <SelectItem value="benefits2">{t('Cards')}</SelectItem>
            <SelectItem value="benefits3">{t('List')}</SelectItem>
            <SelectItem value="benefits4">{t('Timeline')}</SelectItem>
            <SelectItem value="benefits5">{t('Tabs')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t('Section Title')}</Label>
        <Input
          value={(get('benefits').title as string) || ''}
          onChange={(e) => patchSection('benefits', { title: e.target.value })}
          placeholder={t('Why Choose Us?')}
        />
      </div>
      <div className="space-y-4">
        <Label>{t('Benefits List')}</Label>
        <LandingListEditor
          fields={[
            { name: 'title', label: t('Benefit Title'), type: 'text', placeholder: t('Benefit title') },
            { name: 'description', label: t('Benefit Description'), type: 'textarea', placeholder: t('Benefit description') },
          ]}
          value={benefits.map((benefit, index) => ({
            id: `benefit-${index}`,
            title: benefit.title ?? '',
            description: benefit.description ?? '',
          }))}
          onChange={(items) => {
            patchSection(
              'benefits',
              { benefits: items.map(({ id: _id, ...item }) => item) },
            )
          }}
          addButtonText={t('Add Benefit')}
          minItems={1}
        />
      </div>
    </LandingSectionCard>
  )
}

export function LandingPricingTab(props: SectionEditorProps) {
  const { t } = useTranslation()
  const { config } = props
  const { patchSection, patchVisibility, get } = useSectionEditor(props)
  const pricing = get('pricing')

  return (
    <LandingSectionCard
      sectionKey="pricing"
      config={config}
      title={t('Pricing Page Settings')}
      description={t('Public pricing page copy and display options')}
      icon={Tag}
      iconClassName="bg-amber-100 dark:bg-amber-950"
      onVisibilityChange={(visible) => patchVisibility('pricing', visible)}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t('Page Title')}</Label>
          <Input
            value={(pricing.title as string) || ''}
            onChange={(e) => patchSection('pricing', { title: e.target.value })}
            placeholder={t('Flexible Pricing Plans')}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>{t('Page Subtitle')}</Label>
          <Textarea
            value={(pricing.subtitle as string) || ''}
            onChange={(e) => patchSection('pricing', { subtitle: e.target.value })}
            placeholder={t('Choose the perfect subscription plan for your business needs')}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('Default Subscription Type')}</Label>
          <Select
            value={(pricing.default_subscription_type as string) || 'pre-package'}
            onValueChange={(value) => patchSection('pricing', { default_subscription_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pre-package">{t('Pre Package Subscription')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('Default Price Type')}</Label>
          <Select
            value={(pricing.default_price_type as string) || 'monthly'}
            onValueChange={(value) => patchSection('pricing', { default_price_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">{t('Monthly')}</SelectItem>
              <SelectItem value="yearly">{t('Yearly')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>{t('Empty State Message')}</Label>
          <Textarea
            value={(pricing.empty_message as string) || ''}
            onChange={(e) => patchSection('pricing', { empty_message: e.target.value })}
            placeholder={t('No plans available. Check back later for new pricing plans.')}
            rows={3}
          />
        </div>
      </div>
      <div className="space-y-3">
        <Label>{t('Display Options')}</Label>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="show-pre-package"
              checked={pricing.show_pre_package !== false}
              onCheckedChange={(checked) => patchSection('pricing', { show_pre_package: checked })}
            />
            <Label htmlFor="show-pre-package">{t('Show Pre Package Subscription')}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-monthly-yearly"
              checked={pricing.show_monthly_yearly_toggle !== false}
              onCheckedChange={(checked) =>
                patchSection('pricing', { show_monthly_yearly_toggle: checked })
              }
            />
            <Label htmlFor="show-monthly-yearly">{t('Show Monthly/Yearly Toggle')}</Label>
          </div>
        </div>
      </div>
    </LandingSectionCard>
  )
}

type FooterNavSection = {
  title?: string
  links?: { text?: string; href?: string }[]
}

export function LandingFooterTab(props: SectionEditorProps) {
  const { t } = useTranslation()
  const { config } = props
  const { patchSection, patchVisibility, get } = useSectionEditor(props)
  const footer = get('footer')
  const navigationSections = (footer.navigation_sections as FooterNavSection[]) ?? []

  const updateNavSections = (sections: FooterNavSection[]) => {
    patchSection('footer', { navigation_sections: sections })
  }

  return (
    <LandingSectionCard
      sectionKey="footer"
      config={config}
      title={t('Footer Content')}
      description={t('Footer information and links')}
      icon={Layout}
      iconClassName="bg-gray-100 dark:bg-gray-900"
      onVisibilityChange={(visible) => patchVisibility('footer', visible)}
    >
      <div className="space-y-2">
        <Label>{t('Footer Variant')}</Label>
        <Select
          value={(footer.variant as string) || 'footer1'}
          onValueChange={(value) => patchSection('footer', { variant: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('Select Footer Style')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="footer1">{t('Standard')}</SelectItem>
            <SelectItem value="footer2">{t('Minimal')}</SelectItem>
            <SelectItem value="footer3">{t('Centered')}</SelectItem>
            <SelectItem value="footer4">{t('Split')}</SelectItem>
            <SelectItem value="footer5">{t('Modern')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t('Description')}</Label>
        <Textarea
          value={(footer.description as string) || ''}
          onChange={(e) => patchSection('footer', { description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t('Email')}</Label>
          <Input
            value={(footer.email as string) || ''}
            onChange={(e) => patchSection('footer', { email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('Phone')}</Label>
          <Input
            value={(footer.phone as string) || ''}
            onChange={(e) => patchSection('footer', { phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('Newsletter Title')}</Label>
          <Input
            value={(footer.newsletter_title as string) || ''}
            onChange={(e) => patchSection('footer', { newsletter_title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('Newsletter Button')}</Label>
          <Input
            value={(footer.newsletter_button_text as string) || ''}
            onChange={(e) => patchSection('footer', { newsletter_button_text: e.target.value })}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>{t('Newsletter Description')}</Label>
          <Textarea
            value={(footer.newsletter_description as string) || ''}
            onChange={(e) => patchSection('footer', { newsletter_description: e.target.value })}
            rows={2}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>{t('Copyright Text')}</Label>
          <Input
            value={(footer.copyright_text as string) || ''}
            onChange={(e) => patchSection('footer', { copyright_text: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-4">
        <Label>{t('Navigation Sections')}</Label>
        {navigationSections.map((section, sectionIndex) => (
          <div key={`nav-section-${sectionIndex}`} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {t('Section')} #{sectionIndex + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  updateNavSections(navigationSections.filter((_, i) => i !== sectionIndex))
                }
                aria-label={t('Remove')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Label>{t('Section Title')}</Label>
              <Input
                value={section.title ?? ''}
                onChange={(e) => {
                  const next = [...navigationSections]
                  next[sectionIndex] = { ...next[sectionIndex], title: e.target.value }
                  updateNavSections(next)
                }}
              />
            </div>
            <LandingListEditor
              fields={[
                { name: 'text', label: t('Link Text'), type: 'text', placeholder: t('Features') },
                { name: 'href', label: t('Link URL'), type: 'text', placeholder: '#features' },
              ]}
              value={(section.links ?? []).map((link, linkIndex) => ({
                id: `footer-link-${sectionIndex}-${linkIndex}`,
                text: link.text ?? '',
                href: link.href ?? '',
              }))}
              onChange={(items) => {
                const next = [...navigationSections]
                next[sectionIndex] = {
                  ...next[sectionIndex],
                  links: items.map(({ id: _id, ...item }) => item),
                }
                updateNavSections(next)
              }}
              addButtonText={t('Add Link')}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => updateNavSections([...navigationSections, { title: '', links: [] }])}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('Add Navigation Section')}
        </Button>
      </div>
    </LandingSectionCard>
  )
}
