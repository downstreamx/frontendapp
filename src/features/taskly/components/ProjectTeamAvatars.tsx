import { useTranslation } from 'react-i18next'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { UserAvatar } from '@/features/shared/components/table-avatar-cells'
import type { ProjectTeamMember } from '../taskly-api'

type Props = {
  members: ProjectTeamMember[]
  maxVisible?: number
}

export function ProjectTeamAvatars({ members, maxVisible = 4 }: Props) {
  const { t } = useTranslation()

  if (!members.length) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-1">
        {members.slice(0, maxVisible).map((user) => (
          <Tooltip key={user.id} delayDuration={0}>
            <TooltipTrigger asChild>
              <UserAvatar
                avatar={user.avatar}
                name={user.name}
                size="sm"
                className="border-2 border-background"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>{user.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      {members.length > maxVisible ? (
        <span className="text-xs text-muted-foreground">+{members.length - maxVisible}</span>
      ) : null}
    </div>
  )
}
