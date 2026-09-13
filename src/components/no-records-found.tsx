import type { LucideIcon } from 'lucide-react'
import { Inbox, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { canCreatePos, canManagePosBarcodes } from '@/lib/pos-permissions'

type Props = {
  icon?: LucideIcon
  title?: string
  description?: string
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
    : description

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <Icon className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{displayTitle}</h3>
      {displayDescription && <p className="text-muted-foreground mb-4">{displayDescription}</p>}
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
            <Plus className="h-4 w-4 mr-2" />
            {createButtonText ?? t('Create')}
          </Button>
        )
      )}
    </div>
  )
}
