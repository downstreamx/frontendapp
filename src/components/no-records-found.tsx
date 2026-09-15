import type { LucideIcon } from 'lucide-react'
import { Inbox, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/contexts/app-context'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/lib/permissions'
import { canCreatePos, canManagePosBarcodes } from '@/lib/pos-permissions'

type Props = {
  icon?: LucideIcon
  title?: string
  description?: string
  /** @deprecated Prefer `description` — kept for a few legacy call sites. */
  message?: string
  filteredDescription?: string
  hasFilters?: boolean
  onClearFilters?: () => void
  createPermission?: string
  onCreateClick?: () => void
  createButtonText?: string
  className?: string
}

export function NoRecordsFound({
  icon: Icon = Inbox,
  title,
  description,
  message,
  filteredDescription,
  hasFilters = false,
  onClearFilters,
  createPermission,
  onCreateClick,
  createButtonText,
  className = 'h-64',
}: Props) {
  const { t } = useTranslation()
  const { auth } = useAppContext()

  const authSlice = {
    permissions: auth.permissions,
    roles: auth.roles,
    userType: auth.user?.type,
  }
  const canCreate =
    createPermission === 'create-pos'
      ? canCreatePos(authSlice)
      : createPermission === 'manage-pos-barcodes'
        ? canManagePosBarcodes(authSlice)
        : hasPermission(
            auth.permissions,
            auth.roles,
            auth.user?.type,
            createPermission,
          )

  const displayTitle = title ?? t('No records found')
  const displayDescription = hasFilters
    ? filteredDescription ?? t('No records match your current filters or search criteria.')
    : description ?? message

  return (
    <div className={cn('flex flex-col items-center justify-center px-6 text-center', className)}>
      <span
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-green-soft)] text-primary dark:bg-accent"
        aria-hidden
      >
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </span>
      <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">{displayTitle}</h3>
      {displayDescription && (
        <p className="mb-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {displayDescription}
        </p>
      )}
      {hasFilters ? (
        onClearFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            {t('Clear filters')}
          </Button>
        )
      ) : (
        canCreate &&
        onCreateClick && (
          <Button onClick={onCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            {createButtonText ?? t('Create')}
          </Button>
        )
      )}
    </div>
  )
}
