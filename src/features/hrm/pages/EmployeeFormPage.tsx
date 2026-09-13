import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { PhoneInputComponent } from '@/components/ui/phone-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { MediaPicker } from '@/features/media/components/MediaPicker'
import {
  createEmployee,
  fetchEmployeeCreateMeta,
  fetchEmployeeEditMeta,
  updateEmployee,
  type EmployeeCreateMeta,
} from '../hrm-api'
import {
  createDepotRep,
  fetchDepotRepCreateMeta,
  fetchDepotRepEditMeta,
  updateDepotRep,
  type DepotRepCreateMeta,
} from '@/features/depots/depot-rep-api'
import {
  createDriver,
  fetchDriverCreateMeta,
  fetchDriverEditMeta,
  updateDriver,
  type DriverCreateMeta,
} from '@/features/fleet/fleet-api'
import {
  buildEmployeeFormData,
  employeeToFormState,
  initialEmployeeFormState,
  type EmployeeFormState,
} from '../employee-form-utils'
import { paths } from '@/lib/paths'
import { getApiErrorMessage } from '@/lib/errors'
import { validateEmployeeForm } from '../schemas'
import type { FormDialogCallbacks } from '@/features/shared/types/form-presentation'
import { cn } from '@/lib/utils'

type TabId = 'personal' | 'employment' | 'contact' | 'banking' | 'hours' | 'documents'

type EmployeeFormPageProps = FormDialogCallbacks & {
  mode?: 'employee' | 'driver' | 'depot-rep'
}

export function EmployeeFormPage({
  mode = 'employee',
  presentation = 'page',
  onSuccess,
  onCancel,
}: EmployeeFormPageProps = {}) {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const isDriver = mode === 'driver'
  const isDepotRep = mode === 'depot-rep'
  const isRoleEmployee = isDriver || isDepotRep
  const isDialog = presentation === 'dialog' && !isEdit
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('personal')
  const [data, setData] = useState<EmployeeFormState>(initialEmployeeFormState)

  usePageChrome(
    isDialog
      ? {}
      : {
          pageTitle: isEdit
            ? isDriver
              ? t('Edit Driver')
              : isDepotRep
                ? t('Edit Depot Rep')
                : t('Edit Employee')
            : isDriver
              ? t('Create Driver')
              : isDepotRep
                ? t('Create Depot Rep')
                : t('Create Employee'),
          breadcrumbs: isDriver
            ? [
                { label: t('Fleet') },
                { label: t('Drivers'), url: paths.fleet.drivers },
                { label: isEdit ? t('Edit') : t('Create') },
              ]
            : isDepotRep
              ? [
                  { label: t('Depots') },
                  { label: t('Depot Reps'), url: paths.depots.depotReps },
                  { label: isEdit ? t('Edit') : t('Create') },
                ]
              : [
                  { label: t('Hrm') },
                  { label: t('Employees'), url: paths.hrm.employees },
                  { label: isEdit ? t('Edit') : t('Create') },
                ],
        },
  )

  const { data: createMeta, isLoading: createMetaLoading } = useQuery({
    queryKey: isDriver
      ? ['fleet', 'drivers', 'create-meta']
      : isDepotRep
        ? ['depot-reps', 'create-meta']
        : ['hrm', 'employees', 'create-meta'],
    queryFn: isDriver
      ? fetchDriverCreateMeta
      : isDepotRep
        ? fetchDepotRepCreateMeta
        : fetchEmployeeCreateMeta,
    enabled: !isEdit,
  })

  const { data: editMeta, isLoading: editMetaLoading } = useQuery({
    queryKey: isDriver
      ? ['fleet', 'drivers', id, 'edit-meta']
      : isDepotRep
        ? ['depot-reps', id, 'edit-meta']
        : ['hrm', 'employees', id, 'edit-meta'],
    queryFn: () =>
      isDriver ? fetchDriverEditMeta(id!) : isDepotRep ? fetchDepotRepEditMeta(id!) : fetchEmployeeEditMeta(id!),
    enabled: isEdit,
  })

  const meta: (EmployeeCreateMeta | DriverCreateMeta | DepotRepCreateMeta) | undefined = isEdit
    ? editMeta
    : createMeta
  const roleDesignationId = isDriver
    ? String(
        (meta as DriverCreateMeta | undefined)?.driver_designation_id ??
          (editMeta as DriverCreateMeta | undefined)?.driver_designation_id ??
          '',
      )
    : isDepotRep
      ? String(
          (meta as DepotRepCreateMeta | undefined)?.depot_rep_designation_id ??
            (editMeta as DepotRepCreateMeta | undefined)?.depot_rep_designation_id ??
            '',
        )
      : ''
  const isLoading = isEdit ? editMetaLoading : createMetaLoading
  const linkedUser = isEdit ? editMeta?.employee.user : undefined
  const existingDocuments = isEdit ? (editMeta?.employee.documents ?? []) : []

  useEffect(() => {
    if (!isEdit && createMeta?.generated_employee_id) {
      setData((prev) => ({ ...prev, employee_id: createMeta.generated_employee_id }))
    }
  }, [createMeta?.generated_employee_id, isEdit])

  useEffect(() => {
    if (!isRoleEmployee || !roleDesignationId) return
    setData((prev) => ({ ...prev, designation_id: roleDesignationId }))
  }, [roleDesignationId, isRoleEmployee])

  useEffect(() => {
    if (!isEdit || !editMeta?.employee) return
    setData(employeeToFormState(editMeta.employee as unknown as Record<string, unknown>))
  }, [editMeta?.employee, isEdit])

  const filteredDepartments = useMemo(() => {
    if (!data.branch_id || !meta?.departments) return []
    return meta.departments.filter((d) => String(d.branch_id) === data.branch_id)
  }, [data.branch_id, meta?.departments])

  const filteredDesignations = useMemo(() => {
    if (!data.department_id || !meta?.designations) return []
    return meta.designations.filter((d) => String(d.department_id) === data.department_id)
  }, [data.department_id, meta?.designations])

  const setField = <K extends keyof EmployeeFormState>(key: K, value: EmployeeFormState[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const validatePersonalTab = () =>
    data.employee_id.trim() !== '' && data.date_of_birth !== '' && data.gender !== ''

  const validateEmploymentTab = () => {
    const base =
      data.employment_type !== '' &&
      data.shift_id !== '' &&
      data.branch_id !== '' &&
      data.department_id !== '' &&
      data.designation_id !== ''
    return isEdit ? base : base && data.user_id !== ''
  }

  const validateContactTab = () =>
    data.address_line_1.trim() !== '' &&
    data.city.trim() !== '' &&
    data.state.trim() !== '' &&
    data.country.trim() !== '' &&
    data.postal_code.trim() !== '' &&
    data.emergency_contact_name.trim() !== '' &&
    data.emergency_contact_relationship.trim() !== '' &&
    data.emergency_contact_number.trim() !== ''

  const validateBankingTab = () =>
    data.bank_name.trim() !== '' &&
    data.account_holder_name.trim() !== '' &&
    data.account_number.trim() !== '' &&
    data.bank_identifier_code.trim() !== '' &&
    data.bank_branch.trim() !== ''

  const validateHoursTab = () =>
    data.basic_salary.trim() !== '' &&
    data.hours_per_day.trim() !== '' &&
    data.days_per_week.trim() !== '' &&
    data.rate_per_hour.trim() !== ''

  const validateDocumentsTab = () =>
    data.documents.some((doc) => doc.document_type_id && doc.file)

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = buildEmployeeFormData(data, { isEdit })
      if (isDriver) {
        return isEdit ? updateDriver(id!, payload) : createDriver(payload)
      }
      if (isDepotRep) {
        return isEdit ? updateDepotRep(id!, payload) : createDepotRep(payload)
      }
      return isEdit ? updateEmployee(id!, payload) : createEmployee(payload)
    },
    onSuccess: (saved) => {
      toast.success(
        isEdit
          ? isDriver
            ? t('The driver details are updated successfully.')
            : isDepotRep
              ? t('The depot rep details are updated successfully.')
              : t('Employee updated')
          : isDriver
            ? t('The driver has been created successfully.')
            : isDepotRep
              ? t('The depot rep has been created successfully.')
              : t('Employee created'),
      )
      if (isDialog && onSuccess) {
        onSuccess(saved)
        return
      }
      navigate(
        isDriver
          ? paths.fleet.driverShow(saved.id)
          : isDepotRep
            ? paths.depots.depotRepShow(saved.id)
            : paths.hrm.employeeShow(saved.id),
      )
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(
          error,
          isEdit
            ? isDriver
              ? t('Failed to update driver')
              : isDepotRep
                ? t('Failed to update depot rep')
                : t('Failed to update employee')
            : isDriver
              ? t('Failed to create driver')
              : isDepotRep
                ? t('Failed to create depot rep')
                : t('Failed to create employee'),
        ),
      ),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validateEmployeeForm(data, { isEdit })
    if (!validation.success) {
      toast.error(t(validation.message))
      if (validation.tab) setActiveTab(validation.tab)
      return
    }
    saveMutation.mutate()
  }

  const updateDocument = (index: number, field: keyof DocumentRow, value: string | File | null) => {
    setData((prev) => {
      const documents = [...prev.documents]
      documents[index] = { ...documents[index], [field]: value }
      return { ...prev, documents }
    })
  }

  const listPath = isDriver
    ? paths.fleet.drivers
    : isDepotRep
      ? paths.depots.depotReps
      : paths.hrm.employees

  const cancelButton = isDialog ? (
    <Button type="button" variant="outline" onClick={onCancel}>
      {t('Cancel')}
    </Button>
  ) : (
    <Button type="button" variant="outline" asChild>
      <Link to={listPath}>{t('Cancel')}</Link>
    </Button>
  )

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  return (
    <div className={cn('space-y-4', !isDialog && 'max-w-5xl')}>
      {!isDialog ? (
        <div className="flex justify-end">
          <Link to={listPath} className="text-sm text-primary hover:underline">
            {t('Back to list')}
          </Link>
        </div>
      ) : null}

      <Card className={cn(isDialog && 'border-0 shadow-none')}>
        <CardContent className="pt-6">
          <form onSubmit={submit}>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto">
                <TabsTrigger value="personal">{t('Personal')}</TabsTrigger>
                <TabsTrigger value="employment">{t('Employment')}</TabsTrigger>
                <TabsTrigger value="contact">{t('Contact')}</TabsTrigger>
                <TabsTrigger value="banking">{t('Banking')}</TabsTrigger>
                <TabsTrigger value="hours">{t('Hours & Rates')}</TabsTrigger>
                <TabsTrigger value="documents">{t('Documents')}</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="employee_id">{t('Employee Id')}</Label>
                    <Input id="employee_id" value={data.employee_id} readOnly className="bg-muted" />
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth">{t('Date Of Birth')}</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={data.date_of_birth}
                      onChange={(e) => setField('date_of_birth', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <MediaPicker
                    id="avatar"
                    label={t('Avatar')}
                    value={data.avatar}
                    onChange={(value) => setField('avatar', typeof value === 'string' ? value : '')}
                    placeholder={t('Select avatar image')}
                  />
                  <div>
                    <Label>{t('Gender')}</Label>
                    <RadioGroup
                      value={data.gender}
                      onValueChange={(value) => setField('gender', value)}
                      className="flex gap-6 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Male" id="gender_male" />
                        <Label htmlFor="gender_male" className="cursor-pointer font-normal">
                          {t('Male')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Female" id="gender_female" />
                        <Label htmlFor="gender_female" className="cursor-pointer font-normal">
                          {t('Female')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Other" id="gender_other" />
                        <Label htmlFor="gender_other" className="cursor-pointer font-normal">
                          {t('Other')}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setActiveTab('employment')}
                    disabled={!validatePersonalTab()}
                  >
                    {t('Next')}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="employment" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {isEdit ? (
                    <div>
                      <Label>{t('User')}</Label>
                      <Input value={linkedUser?.name ?? ''} readOnly className="bg-muted" />
                      {linkedUser?.email && (
                        <p className="text-sm text-muted-foreground mt-1">{linkedUser.email}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Label>{t('User')}</Label>
                      <Select value={data.user_id} onValueChange={(v) => setField('user_id', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('Select User')} />
                        </SelectTrigger>
                        <SelectContent>
                          {(createMeta?.users ?? []).map((user) => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('Note: Company users will be applicable for create employee.')}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label>{t('Shift')}</Label>
                    <Select value={data.shift_id} onValueChange={(v) => setField('shift_id', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select Shift')} />
                      </SelectTrigger>
                      <SelectContent>
                        {(meta?.shifts ?? []).map((shift) => (
                          <SelectItem key={shift.id} value={String(shift.id)}>
                            {shift.shift_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date_of_joining">{t('Date Of Joining')}</Label>
                    <Input
                      id="date_of_joining"
                      type="date"
                      value={data.date_of_joining}
                      onChange={(e) => setField('date_of_joining', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label>{t('Employment Type')}</Label>
                    <Select
                      value={data.employment_type}
                      onValueChange={(v) => setField('employment_type', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full Time">{t('Full Time')}</SelectItem>
                        <SelectItem value="Part Time">{t('Part Time')}</SelectItem>
                        <SelectItem value="Temporary">{t('Temporary')}</SelectItem>
                        <SelectItem value="Contract">{t('Contract')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('Branch')}</Label>
                    <Select
                      value={data.branch_id}
                      onValueChange={(v) => {
                        setField('branch_id', v)
                        setField('department_id', '')
                        setField('designation_id', '')
                      }}
                      disabled={!isEdit && !data.user_id}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isEdit || data.user_id ? t('Select Branch') : t('Select User first')
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(meta?.branches ?? []).map((branch) => (
                          <SelectItem key={branch.id} value={String(branch.id)}>
                            {branch.branch_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('Department')}</Label>
                    <Select
                      value={data.department_id}
                      onValueChange={(v) => {
                        setField('department_id', v)
                        setField('designation_id', '')
                      }}
                      disabled={!data.branch_id}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            data.branch_id ? t('Select Department') : t('Select Branch first')
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDepartments.map((dept) => (
                          <SelectItem key={dept.id} value={String(dept.id)}>
                            {dept.department_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('Designation')}</Label>
                    {isDriver ? (
                      <Input value={t('Driver')} disabled className="bg-muted" />
                    ) : (
                    <Select
                      value={data.designation_id}
                      onValueChange={(v) => setField('designation_id', v)}
                      disabled={!data.department_id}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            data.department_id
                              ? t('Select Designation')
                              : t('Select Department first')
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDesignations.map((desig) => (
                          <SelectItem key={desig.id} value={String(desig.id)}>
                            {desig.designation_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('personal')}>
                    {t('Previous')}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab('contact')}
                    disabled={!validateEmploymentTab()}
                  >
                    {t('Next')}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {(
                    [
                      ['address_line_1', t('Address Line 1')],
                      ['address_line_2', t('Address Line 2')],
                      ['city', t('City')],
                      ['state', t('State')],
                      ['country', t('Country')],
                      ['postal_code', t('Postal Code')],
                      ['emergency_contact_name', t('Emergency Contact Name')],
                      ['emergency_contact_relationship', t('Emergency Contact Relationship')],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        value={data[key]}
                        onChange={(e) => setField(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <PhoneInputComponent
                  label={t('Emergency Contact Number')}
                  value={data.emergency_contact_number}
                  onChange={(value) => setField('emergency_contact_number', value || '')}
                  required
                />

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('employment')}>
                    {t('Previous')}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab('banking')}
                    disabled={!validateContactTab()}
                  >
                    {t('Next')}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="banking" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {(
                    [
                      ['bank_name', t('Bank Name')],
                      ['account_holder_name', t('Account Holder Name')],
                      ['account_number', t('Account Number')],
                      ['bank_identifier_code', t('Bank Identifier Code')],
                      ['bank_branch', t('Bank Branch')],
                      ['tax_payer_id', t('Tax Payer Id')],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        value={data[key]}
                        onChange={(e) => setField(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('contact')}>
                    {t('Previous')}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab('hours')}
                    disabled={!validateBankingTab()}
                  >
                    {t('Next')}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="hours" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {(
                    [
                      ['basic_salary', t('Basic Salary')],
                      ['hours_per_day', t('Hours Per Day')],
                      ['days_per_week', t('Days Per Week')],
                      ['rate_per_hour', t('Rate Per Hour')],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        type="number"
                        step="0.01"
                        min={0}
                        value={data[key]}
                        onChange={(e) => setField(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('banking')}>
                    {t('Previous')}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab('documents')}
                    disabled={!validateHoursTab()}
                  >
                    {t('Next')}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-6 mt-6">
                {existingDocuments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">{t('Existing documents')}</h4>
                    <ul className="space-y-2 text-sm">
                      {existingDocuments.map((doc) => (
                        <li key={doc.id} className="flex items-center justify-between rounded border p-3">
                          <span>
                            {doc.document_type?.document_name ?? t('Document')} —{' '}
                            <a
                              href={doc.file_path}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline"
                            >
                              {t('View file')}
                            </a>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    {isEdit ? t('Add documents') : t('Employee Documents')}
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setData((prev) => ({
                        ...prev,
                        documents: [...prev.documents, { document_type_id: '', file: null }],
                      }))
                    }
                  >
                    {t('Add Document')}
                  </Button>
                </div>

                {data.documents.map((document, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label>{t('Document Type')}</Label>
                        <Select
                          value={document.document_type_id}
                          onValueChange={(v) => updateDocument(index, 'document_type_id', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('Select Document Type')} />
                          </SelectTrigger>
                          <SelectContent>
                            {(meta?.document_types ?? []).map((type) => (
                              <SelectItem key={type.id} value={String(type.id)}>
                                {type.document_name}
                                {type.is_required ? ' *' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t('Document File')}</Label>
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) =>
                            updateDocument(index, 'file', e.target.files?.[0] ?? null)
                          }
                        />
                        {document.file && (
                          <p className="text-sm text-muted-foreground mt-1">{document.file.name}</p>
                        )}
                      </div>
                    </div>
                    {data.documents.length > 1 && (
                      <div className="flex justify-end mt-4">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setData((prev) => ({
                              ...prev,
                              documents: prev.documents.filter((_, i) => i !== index),
                            }))
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('Remove')}
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('hours')}>
                    {t('Previous')}
                  </Button>
                  <div className="flex gap-2">
                    {cancelButton}
                    <Button type="submit" disabled={saveMutation.isPending}>
                      {saveMutation.isPending
                        ? isEdit
                          ? t('Saving…')
                          : t('Creating…')
                        : isEdit
                          ? t('Save')
                          : t('Create')}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
