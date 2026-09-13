import { Outlet } from 'react-router-dom'
import { GuestAppContextProvider } from '@/contexts/guest-app-context'

export function GuestShell() {
  return (
    <GuestAppContextProvider>
      <Outlet />
    </GuestAppContextProvider>
  )
}
