'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { NavMain } from '@/components/nav-main'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarInput,
} from '@/components/ui/sidebar'
import { useMenuItems } from '@/utils/menu'
import { useBrand } from '@/contexts/brand-context'
import { route } from '@/lib/route'
import { DEFAULT_BRAND_FAVICON_URL, DEFAULT_BRAND_LOGO_URL } from '@/lib/brand-assets'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation()
  const { settings, getCompleteSidebarProps, getPreviewUrl } = useBrand()
  const menuItems = useMenuItems()
  const [searchQuery, setSearchQuery] = React.useState('')
  const sidebarProps = getCompleteSidebarProps()
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const currentLogo = isDark ? settings.logo_light : settings.logo_dark
  const displayUrl = currentLogo ? getPreviewUrl(currentLogo) : DEFAULT_BRAND_LOGO_URL
  const displayFavicon = settings.favicon
    ? getPreviewUrl(settings.favicon)
    : DEFAULT_BRAND_FAVICON_URL

  return (
    <Sidebar
      variant={settings.sidebarVariant as 'sidebar' | 'floating' | 'inset'}
      side={settings.layoutDirection === 'rtl' ? 'right' : 'left'}
      collapsible="icon"
      className={sidebarProps.className}
      style={sidebarProps.style}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to={route('dashboard')} className="flex items-center !py-4 h-auto justify-center">
                <div className="group-data-[collapsible=icon]:hidden flex items-center">
                  <img
                    src={displayUrl}
                    alt={settings.titleText || 'DownstreamX'}
                    className="w-auto max-h-12 max-w-[180px] object-contain transition-all duration-200"
                  />
                </div>
                <div className="h-8 w-8 hidden group-data-[collapsible=icon]:block">
                  <img
                    src={displayFavicon}
                    alt=""
                    className="h-8 w-8 object-contain transition-all duration-200"
                  />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 group-data-[collapsible=icon]:px-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            <SidebarInput
              placeholder={t('Search menu...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 group-data-[collapsible=icon]:hidden border-sidebar-border focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
            />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menuItems} searchQuery={searchQuery} />
      </SidebarContent>
    </Sidebar>
  )
}
