import { Edit, Eye, Printer, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { tableRowActionButtonClass } from '../table-row-action-styles'

type Props = {
  onView?: () => void
  onEdit?: () => void
  onPrint?: () => void
  onDelete?: () => void
  viewPermission?: string
  editPermission?: string
  printPermission?: string
  deletePermission?: string
}

export function TableRowActions({
  onView,
  onEdit,
  onPrint,
  onDelete,
  viewPermission,
  editPermission,
  printPermission,
  deletePermission,
}: Props) {
  const { t } = useTranslation()
  const { auth } = useAppContext()

  const canView = onView && hasPermission(auth.permissions, auth.roles, auth.user?.type, viewPermission)
  const canEdit = onEdit && hasPermission(auth.permissions, auth.roles, auth.user?.type, editPermission)
  const canPrint = onPrint && hasPermission(auth.permissions, auth.roles, auth.user?.type, printPermission)
  const canDelete =
    onDelete && hasPermission(auth.permissions, auth.roles, auth.user?.type, deletePermission)

  if (!canView && !canEdit && !canPrint && !canDelete) return null

  return (
    <TooltipProvider>
      <div className="flex gap-1">
        {canView && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onView}
                className={tableRowActionButtonClass('view')}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('View')}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {canEdit && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEdit}
                className={tableRowActionButtonClass('edit')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('Edit')}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {canPrint && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onPrint}
                className={tableRowActionButtonClass('print')}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('Print')}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {canDelete && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDelete}
                className={tableRowActionButtonClass('delete')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('Delete')}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
