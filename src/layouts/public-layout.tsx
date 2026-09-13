import { Outlet, Link } from 'react-router-dom'
import { paths } from '@/lib/paths'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <Link to="/careers" className="font-semibold">
          Careers
        </Link>
        <Link to={paths.login} className="text-sm text-primary hover:underline">
          Sign in
        </Link>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
