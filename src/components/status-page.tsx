import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileQuestion, Lock, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { paths } from '@/lib/paths'
import { cn } from '@/lib/utils'

type StatusPageProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/** Shared empty / forbidden / not-found surface for authenticated main content. */
export function StatusPage({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  className,
}: StatusPageProps) {
  return (
    <div
      className={cn(
        'mx-auto flex min-h-[min(28rem,60vh)] w-full max-w-lg flex-col items-center justify-center px-6 text-center',
        className,
      )}
    >
      <span
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-green-soft)] text-primary dark:bg-accent"
        aria-hidden
      >
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </span>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description ? (
        <p className="mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  )
}

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <StatusPage
      icon={FileQuestion}
      title={t('Page not found')}
      description={t('This page does not exist or may have moved. Check the URL or return to the dashboard.')}
      action={
        <Button asChild>
          <Link to={paths.dashboard}>{t('Back to dashboard')}</Link>
        </Button>
      }
    />
  )
}

export function ForbiddenPage({
  description,
  homePath = paths.dashboard,
}: {
  description?: string
  homePath?: string
}) {
  const { t } = useTranslation()

  return (
    <StatusPage
      icon={Lock}
      title={t('Permission denied')}
      description={
        description ??
        t('You do not have access to this area. Ask an administrator if you need permission.')
      }
      action={
        <Button asChild variant="outline">
          <Link to={homePath}>{t('Back to dashboard')}</Link>
        </Button>
      }
    />
  )
}
