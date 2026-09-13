import { useQuery } from '@tanstack/react-query'
import { CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { User } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import { usePageChrome } from '@/contexts/page-chrome-context'
import {
  TableAvatarFrame,
  TableAvatarMedia,
} from '@/features/shared/components/table-avatar-cells'
import { fetchLeaveBalanceIndex, type LeaveBalanceEmployeeRow } from '../hrm-api'

type LeaveTypeBalance = LeaveBalanceEmployeeRow['leave_types'][number]

function LeaveTypeRow({ leaveType }: { leaveType: LeaveTypeBalance }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2">
      <div className="flex items-center gap-2">
        {leaveType.leave_type_color ? (
          <div
            className="h-3 w-3 rounded-full border"
            style={{ backgroundColor: leaveType.leave_type_color }}
          />
        ) : null}
        <span className="text-sm font-medium">{leaveType.leave_type_name}</span>
      </div>
      <div className="flex items-center gap-8 text-sm">
        <span className="w-12 text-center">{leaveType.total_days}</span>
        <span className="w-12 text-center">{leaveType.used_days}</span>
        <Badge variant="secondary" className="w-16 justify-center">
          {leaveType.available_days}
        </Badge>
      </div>
    </div>
  )
}

export function LeaveBalanceIndexPage() {
  const { t } = useTranslation()

  usePageChrome({
    pageTitle: t('Leave Balance'),
    breadcrumbs: [{ label: t('Hrm') }, { label: t('Leave Balance') }],
  })

  const listQuery = useQuery({
    queryKey: ['hrm', 'leave-balance', 'index'],
    queryFn: fetchLeaveBalanceIndex,
  })

  const rows = listQuery.data ?? []

  return (
    <ModuleListCard
      title={t('Leave Balance')}
      isLoading={listQuery.isLoading}
      error={Boolean(listQuery.error)}
    >
      {rows.length === 0 && !listQuery.isLoading ? (
        <NoRecordsFound
          icon={CalendarDays}
          title={t('No leave balance data')}
          description={t('Leave types and employee assignments are required to show balances.')}
          className="h-auto py-8"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((employee) => (
            <Card key={employee.employee_id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <TableAvatarFrame className="h-10 w-10 shrink-0 bg-gray-100" rounded="md">
                    <TableAvatarMedia
                      src={employee.avatar}
                      fallback={User}
                      alt={employee.employee_name}
                      iconClassName="h-5 w-5 text-primary"
                    />
                  </TableAvatarFrame>
                  <h3 className="text-lg font-semibold">{employee.employee_name}</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between border-b border-gray-200 p-2">
                  <span className="text-sm font-medium text-muted-foreground">{t('Leave Type')}</span>
                  <div className="flex items-center gap-8 text-xs font-medium text-muted-foreground">
                    <span className="w-12 text-center">{t('Total')}</span>
                    <span className="w-12 text-center">{t('Used')}</span>
                    <span className="w-16 text-center">{t('Available')}</span>
                  </div>
                </div>
                {employee.leave_types.map((leaveType, index) => (
                  <LeaveTypeRow key={`${leaveType.leave_type_name}-${index}`} leaveType={leaveType} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ModuleListCard>
  )
}
