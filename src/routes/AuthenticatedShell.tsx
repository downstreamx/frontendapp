import { AppContextProvider } from '@/contexts/app-context'
import { PageChromeProvider } from '@/contexts/page-chrome-context'
import { AuthenticatedLayout } from '@/layouts/authenticated-layout'
import { SuperAdminPlatformGuard } from '@/routes/SuperAdminPlatformGuard'

export function AuthenticatedShell() {
  return (
    <AppContextProvider>
      <PageChromeProvider>
        <SuperAdminPlatformGuard>
          <AuthenticatedLayout />
        </SuperAdminPlatformGuard>
      </PageChromeProvider>
    </AppContextProvider>
  )
}
