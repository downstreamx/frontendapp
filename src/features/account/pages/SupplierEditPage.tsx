import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Skeleton } from '@/components/ui/skeleton'
import { CustomerForm } from '../components/CustomerForm'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import {
  apiErrorsToFieldMap,
  buildSupplierUpdatePayload,
  initialCustomerFormState,
  partyRowToFormState,
  type CustomerFormState,
} from '../customer-form-utils'
import { fetchSupplierEditMeta, updateSupplier } from '../account-party-api'
import { paths } from '@/lib/paths'
import { getApiErrorMessage } from '@/lib/errors'

export function SupplierEditPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [data, setData] = useState<CustomerFormState>(initialCustomerFormState)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [hydrated, setHydrated] = useState(false)

  const metaQuery = useQuery({
    queryKey: ['account', 'suppliers', id, 'edit-meta'],
    queryFn: () => fetchSupplierEditMeta(id!),
    enabled: Boolean(id),
  })

  const supplier = metaQuery.data?.supplier

  useAccountPageChrome(
    supplier?.company_name
      ? `${t('Edit Supplier')}: ${supplier.company_name}`
      : t('Edit Supplier'),
    t('Suppliers'),
  )

  useEffect(() => {
    setHydrated(false)
  }, [id])

  useEffect(() => {
    if (!supplier || hydrated) return
    setData(partyRowToFormState(supplier))
    setHydrated(true)
  }, [supplier, hydrated])

  const updateMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildSupplierUpdatePayload>) =>
      updateSupplier(Number(id), payload),
    onSuccess: () => {
      toast.success(t('The supplier has been updated successfully.'))
      void queryClient.invalidateQueries({ queryKey: ['account', 'suppliers'] })
      navigate(paths.account.suppliers)
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const payload = error.response?.data as { errors?: Record<string, string[]> } | undefined
        if (payload?.errors) {
          setFieldErrors(apiErrorsToFieldMap(payload.errors))
        }
      }
      toast.error(getApiErrorMessage(error, t('Failed to update supplier')))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    updateMutation.mutate(buildSupplierUpdatePayload(data))
  }

  if (metaQuery.isLoading || !hydrated) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (metaQuery.error || !supplier) {
    return <p className="p-6 text-sm text-destructive">{t('Failed to load supplier.')}</p>
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <CustomerForm
        party="supplier"
        mode="edit"
        partyCode={supplier.supplier_code}
        data={data}
        onChange={setData}
        paymentTerms={metaQuery.data?.payment_terms ?? []}
        categories={metaQuery.data?.supplier_categories ?? []}
        errors={fieldErrors}
        isPending={updateMutation.isPending}
        submitLabel={t('Update')}
        onSubmit={handleSubmit}
        onCancel={() => navigate(paths.account.suppliers)}
      />
    </div>
  )
}
