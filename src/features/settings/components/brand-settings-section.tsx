import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Check,
  FileText,
  Layout,
  Moon,
  Palette,
  Save,
  Settings as SettingsIcon,
  SidebarIcon,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ColorPicker } from '@/components/ui/color-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { MediaPicker } from '@/features/media/components/MediaPicker'
import { getImagePath } from '@/utils/helpers'
import { useSettingsContext } from '../context/settings-context'
import { ThemePreview } from './theme-preview'

type BrandSettings = {
  logo_dark: string
  logo_light: string
  favicon: string
  titleText: string
  footerText: string
  sidebarVariant: string
  sidebarStyle: string
  navigationLayout: string
  layoutDirection: string
  themeMode: string
  themeColor: string
  customColor: string
}

const TAB = 'Brand'

function buildInitial(userSettings: Record<string, string>): BrandSettings {
  return {
    logo_dark: userSettings.logo_dark || '',
    logo_light: userSettings.logo_light || '',
    favicon: userSettings.favicon || '',
    titleText: userSettings.titleText || 'DownstreamX',
    footerText:
      userSettings.footerText ||
      `© ${new Date().getFullYear()} DownstreamX. All rights reserved.`,
    sidebarVariant: userSettings.sidebarVariant || 'inset',
    sidebarStyle: userSettings.sidebarStyle || 'plain',
    navigationLayout: userSettings.navigationLayout || 'mega-menu',
    layoutDirection: userSettings.layoutDirection || 'ltr',
    themeMode: userSettings.themeMode || 'light',
    themeColor: userSettings.themeColor || 'green',
    customColor: userSettings.customColor || '#10b77f',
  }
}

function LogoField({
  label,
  name,
  value,
  previewClassName,
  placeholder,
  canEditSection,
  onChange,
}: {
  label: string
  name: keyof Pick<BrandSettings, 'logo_dark' | 'logo_light' | 'favicon'>
  value: string
  previewClassName: string
  placeholder: string
  canEditSection: boolean
  onChange: (name: string, value: string) => void
}) {
  const { t } = useTranslation()
  const isFavicon = name === 'favicon'

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="flex flex-col gap-3">
        <div
          className={`border rounded-md p-4 flex items-center justify-center ${previewClassName} ${
            isFavicon ? 'h-20' : 'h-32'
          }`}
        >
          {value ? (
            <img
              src={getImagePath(value)}
              alt={label}
              className={
                isFavicon
                  ? 'h-16 w-16 object-contain'
                  : 'max-h-full max-w-full object-contain'
              }
            />
          ) : (
            <div className="text-muted-foreground flex flex-col items-center gap-2">
              <div
                className={`bg-muted flex items-center justify-center rounded border border-dashed ${
                  isFavicon ? 'h-10 w-10' : 'h-12 w-24'
                }`}
              >
                <span
                  className={`font-semibold text-muted-foreground ${isFavicon ? 'text-xs' : ''}`}
                >
                  {isFavicon ? t('Icon') : t('Logo')}
                </span>
              </div>
              <span className="text-xs">
                {isFavicon ? t('No favicon selected') : t('No logo selected')}
              </span>
            </div>
          )}
        </div>
        <MediaPicker
          value={value}
          onChange={(url) => {
            const urlString = Array.isArray(url) ? url[0] || '' : url
            onChange(name, urlString)
          }}
          placeholder={placeholder}
          showPreview={false}
          disabled={!canEditSection}
        />
      </div>
    </div>
  )
}

export function BrandSettingsSection() {
  const { t } = useTranslation()
  const { userSettings, saveTab, isSaving, canEdit } = useSettingsContext()
  const canEditSection = canEdit('edit-brand-settings')
  const [activeSection, setActiveSection] = useState<'logos' | 'text' | 'theme'>('logos')
  const [settings, setSettings] = useState<BrandSettings>(() => buildInitial(userSettings))

  useEffect(() => {
    setSettings(buildInitial(userSettings))
  }, [userSettings])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleFieldChange = (name: string, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleCustomColorChange = (color: string) => {
    setSettings((prev) => ({
      ...prev,
      themeColor: 'custom',
      customColor: color,
    }))
  }

  const handleSave = async () => {
    await saveTab(TAB, settings as unknown as Record<string, string>)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="order-1 rtl:order-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5" />
            {t('Brand Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t("Customize your application's branding and appearance")}
          </p>
        </div>
        {canEditSection && (
          <Button
            className="order-2 rtl:order-1"
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t('Saving...') : t('Save Changes')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex space-x-2 mb-6">
              <Button
                variant={activeSection === 'logos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('logos')}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {t('Logos')}
              </Button>
              <Button
                variant={activeSection === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('text')}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                {t('Text')}
              </Button>
              <Button
                variant={activeSection === 'theme' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection('theme')}
                className="flex-1"
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                {t('Theme')}
              </Button>
            </div>

            {activeSection === 'logos' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <LogoField
                    label={t('Logo (Dark Mode)')}
                    name="logo_dark"
                    value={settings.logo_dark}
                    previewClassName="bg-muted/30"
                    placeholder={t('Enter dark mode logo path or URL...')}
                    canEditSection={canEditSection}
                    onChange={handleFieldChange}
                  />
                  <LogoField
                    label={t('Logo (Light Mode)')}
                    name="logo_light"
                    value={settings.logo_light}
                    previewClassName="bg-gray-800"
                    placeholder={t('Enter light mode logo path or URL...')}
                    canEditSection={canEditSection}
                    onChange={handleFieldChange}
                  />
                  <LogoField
                    label={t('Favicon')}
                    name="favicon"
                    value={settings.favicon}
                    previewClassName="bg-muted/30"
                    placeholder={t('Enter favicon path or URL...')}
                    canEditSection={canEditSection}
                    onChange={handleFieldChange}
                  />
                </div>
              </div>
            )}

            {activeSection === 'text' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="titleText">{t('Title Text')}</Label>
                    <Input
                      id="titleText"
                      name="titleText"
                      value={settings.titleText}
                      onChange={handleInputChange}
                      placeholder="DownstreamX"
                      disabled={!canEditSection}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('Application title displayed in the browser tab')}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="footerText">{t('Footer Text')}</Label>
                    <Input
                      id="footerText"
                      name="footerText"
                      value={settings.footerText}
                      onChange={handleInputChange}
                      placeholder={t(
                        `© ${new Date().getFullYear()} DownstreamX. All rights reserved.`,
                      )}
                      disabled={!canEditSection}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('Text displayed in the footer')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'theme' && (
              <div className="space-y-6">
                <div
                  className={`flex flex-col space-y-8 ${!canEditSection ? 'pointer-events-none opacity-60' : ''}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Palette className="h-5 w-5 mr-2 text-muted-foreground" />
                      <h3 className="text-base font-medium">{t('Theme Color')}</h3>
                    </div>
                    <Separator className="my-2" />
                    <div className="space-y-3">
                      <Label>{t('Preset colors')}</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {Object.entries({
                          blue: '#3b82f6',
                          green: '#10b77f',
                          purple: '#8b5cf6',
                          orange: '#f97316',
                          red: '#ef4444',
                        }).map(([color, hex]) => (
                          <Button
                            key={color}
                            type="button"
                            variant={settings.themeColor === color ? 'default' : 'outline'}
                            className="h-8 w-full p-0 relative"
                            title={color}
                            aria-label={color}
                            onClick={() => handleSelectChange('themeColor', color)}
                          >
                            <span
                              className="absolute inset-1 rounded-sm"
                              style={{ backgroundColor: hex }}
                            />
                            {settings.themeColor === color && (
                              <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customColor">{t('Custom color')}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t('Pick an exact brand color using the color picker or enter a hex value.')}
                      </p>
                      <div
                        className={
                          settings.themeColor === 'custom'
                            ? 'rounded-control ring-2 ring-primary ring-offset-2'
                            : undefined
                        }
                      >
                        <ColorPicker
                          id="customColor"
                          value={settings.customColor}
                          onChange={handleCustomColorChange}
                          disabled={!canEditSection}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Layout className="h-5 w-5 mr-2 text-muted-foreground" />
                      <h3 className="text-base font-medium">{t('Navigation Layout')}</h3>
                    </div>
                    <Separator className="my-2" />
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'sidebar', name: t('Sidebar'), desc: t('Current left sidebar navigation') },
                        { id: 'mega-menu', name: t('Mega Menu'), desc: t('Full-width horizontal mega menu') },
                      ].map((layout) => (
                        <Button
                          key={layout.id}
                          type="button"
                          variant={
                            settings.navigationLayout === layout.id ? 'default' : 'outline'
                          }
                          className="relative h-auto flex-col items-start gap-1 py-3 px-4"
                          onClick={() => handleSelectChange('navigationLayout', layout.id)}
                        >
                          <span className="font-medium">{layout.name}</span>
                          <span className="text-xs text-muted-foreground font-normal text-left">
                            {layout.desc}
                          </span>
                          {settings.navigationLayout === layout.id && (
                            <Check className="h-4 w-4 absolute top-2 right-2" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`space-y-4 ${settings.navigationLayout === 'mega-menu' ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    {settings.navigationLayout === 'mega-menu' ? (
                      <p className="text-xs text-muted-foreground">
                        {t('Sidebar variant and style apply only when Navigation Layout is set to Sidebar.')}
                      </p>
                    ) : null}
                    <div className="flex items-center">
                      <SidebarIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                      <h3 className="text-base font-medium">{t('Sidebar')}</h3>
                    </div>
                    <Separator className="my-2" />
                    <div className="space-y-6">
                      <div>
                        <Label className="mb-2 block">{t('Sidebar Variant')}</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {['inset', 'floating', 'minimal'].map((variant) => (
                            <Button
                              key={variant}
                              type="button"
                              variant={
                                settings.sidebarVariant === variant ? 'default' : 'outline'
                              }
                              className="h-10 justify-start"
                              onClick={() => handleSelectChange('sidebarVariant', variant)}
                            >
                              {variant.charAt(0).toUpperCase() + variant.slice(1)}
                              {settings.sidebarVariant === variant && (
                                <Check className="h-4 w-4 ml-2" />
                              )}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="mb-2 block">{t('Sidebar Style')}</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'plain', name: 'Plain' },
                            { id: 'colored', name: 'Colored' },
                            { id: 'gradient', name: 'Gradient' },
                          ].map((style) => (
                            <Button
                              key={style.id}
                              type="button"
                              variant={
                                settings.sidebarStyle === style.id ? 'default' : 'outline'
                              }
                              className="h-10 justify-start"
                              onClick={() => handleSelectChange('sidebarStyle', style.id)}
                            >
                              {style.name}
                              {settings.sidebarStyle === style.id && (
                                <Check className="h-4 w-4 ml-2" />
                              )}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Layout className="h-5 w-5 mr-2 text-muted-foreground" />
                      <h3 className="text-base font-medium">{t('Layout')}</h3>
                    </div>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <Label className="mb-2 block">{t('Layout Direction')}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={
                            settings.layoutDirection === 'ltr' ? 'default' : 'outline'
                          }
                          className="h-10 justify-start"
                          onClick={() => handleSelectChange('layoutDirection', 'ltr')}
                        >
                          {t('Left-to-Right')}
                          {settings.layoutDirection === 'ltr' && (
                            <Check className="h-4 w-4 ml-2" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant={
                            settings.layoutDirection === 'rtl' ? 'default' : 'outline'
                          }
                          className="h-10 justify-start"
                          onClick={() => handleSelectChange('layoutDirection', 'rtl')}
                        >
                          {t('Right-to-Left')}
                          {settings.layoutDirection === 'rtl' && (
                            <Check className="h-4 w-4 ml-2" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Moon className="h-5 w-5 mr-2 text-muted-foreground" />
                      <h3 className="text-base font-medium">{t('Theme Mode')}</h3>
                    </div>
                    <Separator className="my-2" />
                    <div className="grid grid-cols-3 gap-2">
                      {(['light', 'dark', 'system'] as const).map((mode) => (
                        <Button
                          key={mode}
                          type="button"
                          variant={settings.themeMode === mode ? 'default' : 'outline'}
                          className="h-10 justify-start"
                          onClick={() => handleSelectChange('themeMode', mode)}
                        >
                          {t(mode.charAt(0).toUpperCase() + mode.slice(1))}
                          {settings.themeMode === mode && (
                            <Check className="h-4 w-4 ml-2" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              <div className="border rounded-md p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="h-4 w-4" />
                  <h3 className="font-medium">{t('Live Preview')}</h3>
                </div>
                <ThemePreview
                  logoDark={settings.logo_dark}
                  logoLight={settings.logo_light}
                  themeColor={settings.themeColor}
                  customColor={settings.customColor}
                  sidebarVariant={settings.sidebarVariant}
                  sidebarStyle={settings.sidebarStyle}
                  navigationLayout={settings.navigationLayout}
                  layoutDirection={settings.layoutDirection}
                  themeMode={settings.themeMode}
                />
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs mb-2 text-muted-foreground">
                    {t('Title:')}{' '}
                    <span className="font-medium text-foreground">{settings.titleText}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('Footer:')}{' '}
                    <span className="font-medium text-foreground">{settings.footerText}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
