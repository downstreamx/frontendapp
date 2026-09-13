import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { orgRolePath } from '@/features/shared/lib/entity-labels'

type OrgSlice = {
  branch?: { branch_name?: string }
  department?: { department_name?: string }
  designation?: { designation_name?: string }
}

type Props = {
  from: OrgSlice
  to: OrgSlice
  fromTitle?: string
  toTitle?: string
}

export function HrmOrgRoleTransition({ from, to, fromTitle, toTitle }: Props) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-semibold">{t('Position change')}</p>
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="rounded-md border bg-background p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {fromTitle ?? t('Previous')}
          </p>
          <p className="text-sm">{orgRolePath(from) || '—'}</p>
        </div>
        <ArrowRight className="mx-auto hidden h-5 w-5 text-muted-foreground md:block" />
        <div className="rounded-md border border-primary/30 bg-background p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">{toTitle ?? t('Current')}</p>
          <p className="text-sm">{orgRolePath(to) || '—'}</p>
        </div>
      </div>
    </div>
  )
}
