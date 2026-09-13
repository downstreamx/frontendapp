export type DashboardTeamMember = {
  name: string
  total_tasks: number
  completed_tasks: number
  completion_rate: number
}

export function DashboardTeamProgress({
  members,
  completedLabel,
}: {
  members: DashboardTeamMember[]
  completedLabel: string
}) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">No team activity yet.</p>
  }

  return (
    <ul className="space-y-4">
      {members.map((member) => (
        <li key={member.name} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{member.name}</span>
            <span className="text-muted-foreground tabular-nums">
              {member.completed_tasks}/{member.total_tasks}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, member.completion_rate)}%` }}
            />
          </div>
          <p className="text-right text-xs text-muted-foreground">
            {member.completion_rate}% {completedLabel}
          </p>
        </li>
      ))}
    </ul>
  )
}
