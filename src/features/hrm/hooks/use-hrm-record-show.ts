import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { api } from '@/lib/api'
import { personName } from '@/features/shared/lib/entity-labels'

type UseHrmRecordShowOptions<T> = {
  entityKey: string
  listPath: string
  listLabel: string
  pageTitle: string
  queryFn: (id: number) => Promise<T>
  getEmployeeName?: (data: T) => string | undefined
}

export function useHrmRecordShow<T extends { id?: number }>({
  entityKey,
  listPath,
  listLabel,
  pageTitle,
  queryFn,
  getEmployeeName,
}: UseHrmRecordShowOptions<T>) {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const recordId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['hrm', entityKey, recordId],
    queryFn: () => queryFn(recordId),
    enabled: Number.isFinite(recordId),
  })

  const employeeLabel = query.data && getEmployeeName ? getEmployeeName(query.data) : undefined

  usePageChrome({
    pageTitle: employeeLabel ? `${employeeLabel} — ${pageTitle}` : pageTitle,
    breadcrumbs: [
      { label: t('Hrm') },
      { label: listLabel, url: listPath },
      { label: employeeLabel ?? pageTitle },
    ],
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/hrm/${entityKey}/${recordId}`),
    onSuccess: () => {
      toast.success(t('Deleted successfully'))
      void queryClient.invalidateQueries({ queryKey: ['hrm', entityKey] })
      void queryClient.invalidateQueries({ queryKey: [`hrm-${entityKey}`] })
      navigate(listPath)
    },
    onError: () => toast.error(t('Failed to delete')),
  })

  return {
    recordId,
    ...query,
    deleteMutation,
    listPath,
    listLabel,
    pageTitle,
  }
}

export function employeeLabelFromRow(
  employee?: { name?: string; email?: string },
  employeeId?: number,
): string | undefined {
  const name = personName(employee, employeeId)
  return name === '—' ? undefined : name
}
