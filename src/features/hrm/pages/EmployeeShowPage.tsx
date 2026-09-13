import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useAppContext } from '@/contexts/app-context'
import { hasPermission } from '@/lib/permissions'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'
import { getApiErrorMessage } from '@/lib/errors'
import type { EntityViewCallbacks } from '@/features/shared/types/form-presentation'
import { getEmployee } from '../hrm-api'
import { fetchDepotRep } from '@/features/depots/depot-rep-api'
import { getDriver } from '@/features/fleet/fleet-api'
import { formatEmployeeGender, formatEmploymentType } from '../employee-utils'
import { paths } from '@/lib/paths'
import { UserAvatar } from '@/features/shared/components/table-avatar-cells'
import { formatCurrency, formatDate } from '@/utils/helpers'

function shiftName(shift: unknown): string {
  if (shift && typeof shift === 'object' && 'shift_name' in shift) {
    return String((shift as { shift_name: string }).shift_name)
  }
  return '—'
}

type EmployeeShowPageProps = EntityViewCallbacks & {
  mode?: 'employee' | 'driver' | 'depot-rep'
}

export function EmployeeShowPage({
  mode = 'employee',
  presentation = 'page',
  entityId,
  onClose,
}: EmployeeShowPageProps) {
  const { id: routeId } = useParams<{ id: string }>()
  const id = entityId ?? routeId
  const isDialog = presentation === 'dialog'
  const isDriver = mode === 'driver'
  const isDepotRep = mode === 'depot-rep'
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { auth } = useAppContext()
  const canDelete = hasPermission(auth.permissions, auth.roles, auth.user?.type, 'delete-employees')

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete, isDeleting } =
    useDeleteHandler({
      routeName: 'hrm.employees.destroy',
      defaultMessage: isDriver
        ? t('Are you sure you want to delete this driver?')
        : isDepotRep
          ? t('Are you sure you want to delete this depot rep?')
          : t('Are you sure you want to delete this employee?'),
      onSuccess: () => {
        toast.success(
          isDriver
            ? t('The driver has been deleted.')
            : isDepotRep
              ? t('The depot rep has been deleted.')
              : t('Employee deleted'),
        )
        void queryClient.invalidateQueries({ queryKey: ['hrm', 'employees'] })
        void queryClient.invalidateQueries({ queryKey: ['fleet', 'drivers'] })
        void queryClient.invalidateQueries({ queryKey: ['depot-reps'] })
        if (isDialog) {
          onClose?.()
          return
        }
        navigate(
          isDriver ? paths.fleet.drivers : isDepotRep ? paths.depots.depotReps : paths.hrm.employees,
        )
      },
      onError: (err) =>
        toast.error(
          getApiErrorMessage(
            err,
            isDriver
              ? t('Failed to delete driver')
              : isDepotRep
                ? t('Failed to delete depot rep')
                : t('Failed to delete employee'),
          ),
        ),
    })

  usePageChrome(
    isDialog
      ? {}
      : {
          pageTitle: isDriver ? t('Driver Details') : isDepotRep ? t('Depot Rep Details') : t('Employee Details'),
          breadcrumbs: isDriver
            ? [
                { label: t('Fleet') },
                { label: t('Drivers'), url: paths.fleet.drivers },
                { label: t('View') },
              ]
            : isDepotRep
              ? [
                  { label: t('Depots') },
                  { label: t('Depot Reps'), url: paths.depots.depotReps },
                  { label: t('View') },
                ]
              : [
                  { label: t('Hrm') },
                  { label: t('Employees'), url: paths.hrm.employees },
                  { label: t('View') },
                ],
        },
  )

  const { data: employee, isLoading, error } = useQuery({
    queryKey: isDriver
      ? ['fleet', 'drivers', id]
      : isDepotRep
        ? ['depot-reps', id]
        : ['hrm', 'employees', id],
    queryFn: () =>
      isDriver ? getDriver(id!) : isDepotRep ? fetchDepotRep(id!) : getEmployee(id!),
    enabled: Boolean(id),
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  if (error || !employee) {
    return (
      <p className="text-sm text-destructive">
        {isDriver ? t('Driver not found.') : t('Employee not found.')}
      </p>
    )
  }

  const documents = employee.documents ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        {canDelete && !employee.user?.is_disable ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => openDeleteDialog(employee.id)}
          >
            {t('Delete')}
          </Button>
        ) : null}
        <Button asChild size="sm" variant="outline">
          <Link to={isDriver ? paths.fleet.driverEdit(employee.id) : paths.hrm.employeeEdit(employee.id)}>
            {t('Edit')}
          </Link>
        </Button>
        {isDialog ? (
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            {t('Close')}
          </Button>
        ) : (
          <Link
            to={isDriver ? paths.fleet.drivers : paths.hrm.employees}
            className="text-sm text-primary hover:underline"
          >
            {t('Back to list')}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 text-center">
            <div className="mb-4 flex justify-center">
              <UserAvatar
                avatar={employee.user?.avatar}
                name={employee.user?.name ?? ''}
                size="xl"
                className="border-4 border-muted"
              />
            </div>
            <h3 className="text-xl font-semibold mb-1">{employee.user?.name}</h3>
            <p className="text-muted-foreground text-sm mb-4">{employee.user?.email}</p>
            <div className="space-y-3 text-left text-sm">
              <div>
                <p className="text-muted-foreground">{t('Employee ID')}</p>
                <p className="font-medium">{employee.employee_id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('Date of Birth')}</p>
                <p className="font-medium">
                  {employee.date_of_birth ? formatDate(employee.date_of_birth) : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('Gender')}</p>
                <p className="font-medium">{formatEmployeeGender(employee.gender)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('Branch')}</p>
                <p className="font-medium">{employee.branch?.branch_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('Department')}</p>
                <p className="font-medium">{employee.department?.department_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('Designation')}</p>
                <p className="font-medium">{employee.designation?.designation_name ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            <Tabs defaultValue="employment" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
                <TabsTrigger value="employment">{t('Employment')}</TabsTrigger>
                <TabsTrigger value="contact">{t('Contact')}</TabsTrigger>
                <TabsTrigger value="banking">{t('Banking')}</TabsTrigger>
                <TabsTrigger value="hours">{t('Hours & Rates')}</TabsTrigger>
                <TabsTrigger value="documents">{t('Documents')}</TabsTrigger>
              </TabsList>

              <TabsContent value="employment" className="mt-6 grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('Employment Type')}</p>
                  <p className="font-medium">{formatEmploymentType(employee.employment_type)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Date of Joining')}</p>
                  <p className="font-medium">
                    {employee.date_of_joining ? formatDate(employee.date_of_joining) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Shift')}</p>
                  <p className="font-medium">{shiftName(employee.shift)}</p>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="mt-6 grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('Address Line 1')}</p>
                  <p className="font-medium">{employee.address_line_1 ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Address Line 2')}</p>
                  <p className="font-medium">{employee.address_line_2 || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('City')}</p>
                  <p className="font-medium">{employee.city ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('State')}</p>
                  <p className="font-medium">{employee.state ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Country')}</p>
                  <p className="font-medium">{employee.country ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Postal Code')}</p>
                  <p className="font-medium">{employee.postal_code ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Emergency Contact Name')}</p>
                  <p className="font-medium">{employee.emergency_contact_name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Emergency Contact Relationship')}</p>
                  <p className="font-medium">{employee.emergency_contact_relationship ?? '—'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-muted-foreground">{t('Emergency Contact Number')}</p>
                  <p className="font-medium">{employee.emergency_contact_number ?? '—'}</p>
                </div>
              </TabsContent>

              <TabsContent value="banking" className="mt-6 grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('Bank Name')}</p>
                  <p className="font-medium">{employee.bank_name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Account Holder Name')}</p>
                  <p className="font-medium">{employee.account_holder_name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Account Number')}</p>
                  <p className="font-medium">{employee.account_number ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Bank Identifier Code')}</p>
                  <p className="font-medium">{employee.bank_identifier_code ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Bank Branch')}</p>
                  <p className="font-medium">{employee.bank_branch ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Tax Payer Id')}</p>
                  <p className="font-medium">{employee.tax_payer_id || '—'}</p>
                </div>
              </TabsContent>

              <TabsContent value="hours" className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('Basic Salary')}</p>
                  <p className="font-medium">
                    {employee.basic_salary != null ? formatCurrency(Number(employee.basic_salary)) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Hours Per Day')}</p>
                  <p className="font-medium">{employee.hours_per_day ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Days Per Week')}</p>
                  <p className="font-medium">{employee.days_per_week ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('Rate Per Hour')}</p>
                  <p className="font-medium">
                    {employee.rate_per_hour != null ? formatCurrency(Number(employee.rate_per_hour)) : '—'}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-6 space-y-3 text-sm">
                {documents.length === 0 ? (
                  <p className="text-muted-foreground">{t('No documents uploaded.')}</p>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded border p-3"
                    >
                      <span className="font-medium">
                        {doc.document_type?.document_name ?? t('Document')}
                      </span>
                      <a
                        href={doc.file_path}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {t('View file')}
                      </a>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        title={t('Delete employee')}
        message={deleteState.message}
        variant="destructive"
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </div>
  )
}
