import { useQuery } from '@tanstack/react-query'
import { fetchHrmMeta } from '../hrm-api'
import type { LookupOption } from '@/features/_shared/operations-lookups'

export function useHrmMeta() {
  const query = useQuery({
    queryKey: ['hrm', 'create-meta'],
    queryFn: fetchHrmMeta,
    staleTime: 60_000,
  })

  const meta = query.data

  const branchOptions: LookupOption[] =
    meta?.branches.map((b) => ({ id: b.id, label: b.branch_name })) ?? []

  const departmentOptionsFor = (branchId: string): LookupOption[] => {
    if (!meta || !branchId) return []
    return meta.departments
      .filter((d) => String(d.branch_id) === branchId)
      .map((d) => ({ id: d.id, label: d.department_name }))
  }

  const leaveTypeOptions: LookupOption[] =
    meta?.leave_types.map((t) => ({ id: t.id, label: t.name })) ?? []

  const employeeOptions: LookupOption[] =
    meta?.employees.map((e) => ({
      id: e.id,
      label: e.email ? `${e.name} (${e.email})` : e.name,
    })) ?? []

  const awardTypeOptions: LookupOption[] =
    meta?.award_types?.map((t) => ({ id: t.id, label: t.name })) ?? []

  const loanTypeOptions: LookupOption[] =
    meta?.loan_types?.map((t) => ({ id: t.id, label: t.name })) ?? []

  const terminationTypeOptions: LookupOption[] =
    meta?.termination_types?.map((t) => ({ id: t.id, label: t.name })) ?? []

  const warningTypeOptions: LookupOption[] =
    meta?.warning_types?.map((t) => ({ id: t.id, label: t.name })) ?? []

  const complaintTypeOptions: LookupOption[] =
    meta?.complaint_types?.map((t) => ({ id: t.id, label: t.name })) ?? []

  const documentCategoryOptions: LookupOption[] =
    meta?.document_categories?.map((t) => ({ id: t.id, label: t.name })) ?? []

  const announcementCategoryOptions: LookupOption[] =
    meta?.announcement_categories?.map((t) => ({ id: t.id, label: t.name })) ?? []

  const eventTypeOptions: LookupOption[] =
    meta?.event_types?.map((t) => ({ id: t.id, label: t.name })) ?? []

  const hrmDocumentOptions: LookupOption[] =
    meta?.hrm_documents?.map((d) => ({ id: d.id, label: d.title })) ?? []

  const designationOptionsFor = (branchId: string, departmentId: string): LookupOption[] => {
    if (!meta || !branchId || !departmentId) return []
    return meta.designations
      .filter((d) => String(d.branch_id) === branchId && String(d.department_id) === departmentId)
      .map((d) => ({ id: d.id, label: d.designation_name }))
  }

  return {
    ...query,
    meta,
    branchOptions,
    departmentOptionsFor,
    leaveTypeOptions,
    employeeOptions,
    awardTypeOptions,
    loanTypeOptions,
    terminationTypeOptions,
    warningTypeOptions,
    complaintTypeOptions,
    documentCategoryOptions,
    announcementCategoryOptions,
    eventTypeOptions,
    hrmDocumentOptions,
    designationOptionsFor,
  }
}
