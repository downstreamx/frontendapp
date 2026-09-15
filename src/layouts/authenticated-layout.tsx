import { Fragment } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserX } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { toast } from 'sonner'
import { AppSidebar } from '@/components/app-sidebar'
import { MegaMenuHeader } from '@/components/mega-menu/mega-menu-header'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { NavUser } from '@/components/nav-user'
import { ActionableNotificationsBell, PortalNotificationsBell } from '@/components/actionable-notifications-bell'
import { BrandProvider, useBrand, useNavigationLayout } from '@/contexts/brand-context'
import { useAppContext } from '@/contexts/app-context'
import CookieConsent from '@/components/cookie-consent'
import { useFavicon } from '@/hooks/use-favicon'
import { useTranslation } from 'react-i18next'
import { useFlashMessages } from '@/hooks/useFlashMessages'
import { paths } from '@/lib/paths'
import { setAuthToken } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/errors'
import { usePageChromeState, useContentTitleMatchesPageTitle } from '@/contexts/page-chrome-context'
import { cn } from '@/lib/utils'
import { leaveImpersonation } from '@/features/admin/admin-api'
import { queryKeys } from '@/lib/query-keys'

function LayoutChrome() {
  const pageChrome = usePageChromeState()
  const breadcrumbs = pageChrome.breadcrumbs
  const pageTitle = pageChrome.pageTitle
  const pageActions = pageChrome.pageActions
  const centerPageTitle = pageChrome.centerPageTitle
  const duplicateContentTitle = useContentTitleMatchesPageTitle(pageTitle)
  const showPageTitleHeading = Boolean(pageTitle) && !duplicateContentTitle
  const showTitleRow = showPageTitleHeading || Boolean(pageActions)
  const { t } = useTranslation()
  const { auth } = useAppContext()
  const { settings } = useBrand()
  const navigationLayout = useNavigationLayout()
  const queryClient = useQueryClient()
  const isClientUser = auth.user?.type === 'customer'
  const homePath = isClientUser ? paths.portal.dashboard : paths.dashboard
  const isMegaMenu = navigationLayout === 'mega-menu'

  const leaveImpersonationMutation = useMutation({
    mutationFn: leaveImpersonation,
    onSuccess: (result) => {
      setAuthToken(result.token)
      queryClient.setQueryData(queryKeys.auth.me(), {
        ...result.me,
        impersonating: false,
      })
      toast.success(t('Returned to your account'))
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('Failed to leave impersonation'))),
  })

  return (
    <>
      <header
        className={cn(
          'mb-2 flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/90 py-2 backdrop-blur-sm',
          isMegaMenu ? 'px-0' : 'px-4',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {!isMegaMenu ? <SidebarTrigger className="-ms-1 shrink-0" /> : null}
          {!isMegaMenu ? <Separator orientation="vertical" className="h-4 shrink-0" /> : null}
          <Breadcrumb className="min-w-0 overflow-hidden">
            <BreadcrumbList className="flex-wrap sm:flex-nowrap">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={homePath}>{t('Dashboard')}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs?.map((crumb, index) => {
                const crumbHref = crumb.url ?? crumb.href
                return (
                  <Fragment key={index}>
                    <BreadcrumbSeparator
                      className={settings.layoutDirection === 'rtl' ? 'rotate-180' : ''}
                    />
                    <BreadcrumbItem>
                      {crumbHref ? (
                        <BreadcrumbLink asChild>
                          <Link to={crumbHref}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div
          className={`flex shrink-0 items-center gap-2 ${settings.layoutDirection === 'rtl' ? 'flex-row-reverse' : ''}`}
        >
          {auth.impersonating ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-orange-600 text-orange-600 hover:bg-orange-50"
              disabled={leaveImpersonationMutation.isPending}
              onClick={() => leaveImpersonationMutation.mutate()}
            >
              <UserX className="me-2 h-4 w-4" />
              {t('Leave Login As User')}
            </Button>
          ) : null}
          {!isMegaMenu ? (
            <>
              {isClientUser ? <PortalNotificationsBell /> : <ActionableNotificationsBell />}
              {auth.user ? <NavUser user={auth.user} inHeader /> : null}
            </>
          ) : null}
        </div>
      </header>
      {showTitleRow ? (
        <div
          className={cn(
            'mb-4 mt-6 items-center',
            centerPageTitle && showPageTitleHeading
              ? 'grid grid-cols-[1fr_auto_1fr] gap-3'
              : 'flex',
          )}
          dir={settings.layoutDirection}
        >
          {centerPageTitle && showPageTitleHeading ? <div aria-hidden className="min-w-0" /> : null}
          {showPageTitleHeading ? (
            <h1
              className={cn(
                'text-2xl font-semibold',
                centerPageTitle ? 'text-center' : 'flex-1',
              )}
            >
              {pageTitle}
            </h1>
          ) : (
            <div className="min-w-0 flex-1" />
          )}
          <div className={cn('shrink-0', centerPageTitle && showPageTitleHeading && 'justify-self-end')}>
            {pageActions}
          </div>
        </div>
      ) : null}
    </>
  )
}

function AuthenticatedLayoutContent() {
  const { adminAllSetting } = useAppContext()
  const { settings } = useBrand()
  const navigationLayout = useNavigationLayout()
  useFavicon()
  useFlashMessages()

  const shellDirProps = {
    dir: settings.layoutDirection === 'rtl' ? ('rtl' as const) : ('ltr' as const),
    style: { direction: settings.layoutDirection === 'rtl' ? ('rtl' as const) : ('ltr' as const) },
  }

  if (navigationLayout === 'mega-menu') {
    return (
      <div
        className={cn(
          settings.layoutDirection === 'rtl' ? 'rtl' : 'ltr',
          'min-h-screen bg-background',
        )}
        data-theme={settings.themeMode}
        {...shellDirProps}
      >
        <MegaMenuHeader />
        <div className="flex min-h-screen flex-col bg-background">
          <div className="flex w-full flex-1 flex-col bg-background px-6 md:px-8 lg:px-10">
            <LayoutChrome />
            <main className="h-full flex-1 bg-content pb-10 text-[17px] leading-relaxed md:pb-12 md:pt-0">
              <Outlet />
            </main>
          </div>
        </div>
        <CookieConsent settings={adminAllSetting || {}} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        settings.layoutDirection === 'rtl' ? 'rtl' : 'ltr',
        'min-h-screen bg-background',
      )}
      data-theme={settings.themeMode}
      {...shellDirProps}
    >
      <SidebarProvider defaultOpen>
        <AppSidebar />
        <SidebarInset className="overflow-visible" {...shellDirProps}>
          <LayoutChrome />
          <main className="h-full bg-content p-4 pb-10 md:pb-12 md:pt-0">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
      <CookieConsent settings={adminAllSetting || {}} />
    </div>
  )
}

export function AuthenticatedLayout() {
  return (
    <BrandProvider>
      <AuthenticatedLayoutContent />
    </BrandProvider>
  )
}
