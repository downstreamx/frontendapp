import { AppContextProvider } from '@/contexts/app-context'
import { PageChromeProvider } from '@/contexts/page-chrome-context'
import { useMeQuery } from '@/features/auth/hooks'
import { WelcomeOnboardingModal } from '@/features/auth/components/WelcomeOnboardingModal'
import { AuthenticatedLayout } from '@/layouts/authenticated-layout'
import { SuperAdminPlatformGuard } from '@/routes/SuperAdminPlatformGuard'
import { paths } from '@/lib/paths'
import { Navigate, useLocation } from 'react-router-dom'

export function AuthenticatedShell() {
  const { data: me } = useMeQuery()
  const location = useLocation()

  if (
    me?.user?.type === 'company' &&
    me.company?.needs_provisioning &&
    location.pathname !== paths.accountBeingPrepared
  ) {
    return <Navigate to={paths.accountBeingPrepared} replace />
  }

  const showWelcome =
    me?.user?.type === 'company' &&
    !me.company?.needs_provisioning &&
    me.user.welcome_completed !== true

  return (
    <AppContextProvider>
      <PageChromeProvider>
        <SuperAdminPlatformGuard>
          <AuthenticatedLayout />
          {showWelcome ? <WelcomeOnboardingModal open /> : null}
        </SuperAdminPlatformGuard>
      </PageChromeProvider>
    </AppContextProvider>
  )
}
