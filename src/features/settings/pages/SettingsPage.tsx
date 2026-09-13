import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useAppContext } from '@/contexts/app-context'
import { fetchAddOnModules } from '@/features/modules/modules-api'
import { SettingsProvider, useSettingsContext } from '../context/settings-context'
import {
  canAccessSettingsSection,
  getSettingsMenuItems,
} from '../lib/settings-menu'
import { getSettingsSectionComponent } from '../components/settings-section-registry'

function SettingsPageContent() {
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const { isLoading, isError } = useSettingsContext()
  const [activeSection, setActiveSection] = useState('brand-settings')

  const isSuperAdmin = auth.roles.includes('superadmin') || auth.user?.type === 'superadmin'

  usePageChrome({
    pageTitle: t('Settings'),
    breadcrumbs: [{ label: t('Dashboard') }, { label: t('Settings') }],
  })

  const addOnsQuery = useQuery({
    queryKey: ['add-ons'],
    queryFn: fetchAddOnModules,
    enabled: isSuperAdmin,
  })

  const enabledAddOnNames = useMemo(
    () =>
      (addOnsQuery.data ?? [])
        .filter((row) => row.is_enabled)
        .map((row) => row.name),
    [addOnsQuery.data],
  )

  const sidebarNavItems = useMemo(
    () =>
      getSettingsMenuItems(t, auth.roles, enabledAddOnNames).filter((item) =>
        canAccessSettingsSection(
          auth.permissions,
          item,
          auth.roles,
          auth.user?.type,
        ),
      ),
    [t, auth.roles, auth.permissions, auth.user?.type, enabledAddOnNames],
  )

  useEffect(() => {
    if (sidebarNavItems.length > 0) {
      const first = sidebarNavItems[0].href.replace('#', '')
      setActiveSection((current) =>
        sidebarNavItems.some((i) => i.href.replace('#', '') === current)
          ? current
          : first,
      )
    }
  }, [sidebarNavItems])

  useEffect(() => {
    const handleScroll = () => {
      for (const item of sidebarNavItems) {
        const sectionId = item.href.replace('#', '')
        const element = document.getElementById(sectionId)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(sectionId)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sidebarNavItems])

  const handleNavClick = (href: string) => {
    const id = href.replace('#', '')
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setActiveSection(id)
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading settings…')}</p>
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {t('Could not load settings. Check that the API is running and you are signed in.')}
      </p>
    )
  }

  if (sidebarNavItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('You do not have permission to view any settings sections.')}
      </p>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-64 shrink-0">
          <div className="sticky top-4">
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="pr-4 space-y-1">
                {sidebarNavItems.map((item) => {
                  const sectionId = item.href.replace('#', '')
                  return (
                    <Button
                      key={item.href}
                      variant="ghost"
                      className={cn('w-full justify-start', {
                        'bg-muted font-medium': activeSection === sectionId,
                      })}
                      onClick={() => handleNavClick(item.href)}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.title}
                    </Button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="pr-4 space-y-8 pb-8">
              {sidebarNavItems.map((item) => {
                const sectionId = item.href.replace('#', '')
                const Section = getSettingsSectionComponent(item.component)
                if (!Section) {
                  return null
                }

                return (
                  <section key={sectionId} id={sectionId}>
                    <Section tab={item.tab} />
                  </section>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
  )
}

export function SettingsPage() {
  return (
    <SettingsProvider>
      <SettingsPageContent />
    </SettingsProvider>
  )
}
