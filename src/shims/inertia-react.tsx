import type { ReactNode } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useAppContext } from '@/contexts/app-context'
import { route as appRoute } from '@/lib/route'
import { paths } from '@/lib/paths'

type RouterOpts = {
  preserveState?: boolean
  preserveScroll?: boolean
  replace?: boolean
  onSuccess?: () => void
  onError?: () => void
}

/** Shim for legacy @inertiajs/react imports during UI port. */
export function usePage<T = Record<string, unknown>>() {
  const ctx = useAppContext()
  const location = useLocation()
  return {
    url: location.pathname + location.search,
    component: '',
    props: ctx as T,
  }
}

/** Ziggy-compatible route() for ported components (e.g. cookie-consent). */
export function route(name?: string, params?: Record<string, string | number>) {
  if (!name) {
    return {
      current: (n: string) => {
        const path = window.location.pathname
        if (n === 'dashboard') return path === paths.dashboard
        if (n === 'account.index') return path.startsWith('/account')
        return false
      },
    }
  }
  return appRoute(name, params)
}

export const router = {
  get: (url: string, query?: Record<string, unknown>, _opts?: RouterOpts) => {
    const qs =
      query && Object.keys(query).length
        ? `?${new URLSearchParams(query as Record<string, string>).toString()}`
        : ''
    window.location.href = `${url}${qs}`
  },
  post: (_url: string, _data?: unknown, opts?: RouterOpts) => {
    queueMicrotask(() => opts?.onSuccess?.())
  },
  visit: (url: string) => {
    window.location.href = url
  },
}

export function Link({
  href,
  children,
  className,
  to,
  ...rest
}: {
  href?: string
  to?: string
  children?: ReactNode
  className?: string
  method?: string
  as?: string
}) {
  const target = to ?? href ?? '/'
  return (
    <RouterLink to={target} className={className} {...rest}>
      {children}
    </RouterLink>
  )
}
