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
  buildCustomerUpdatePayload,
  initialCustomerFormState,
  partyRowToFormState,
  type CustomerFormState,
} from '../customer-form-utils'
import { fetchCustomerEditMeta, updateCustomer } from '../account-party-api'
import { paths } from '@/lib/paths'
import { getApiErrorMessage } from '@/lib/errors'

export function CustomerEditPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [data, setData] = useState<CustomerFormState>(initialCustomerFormState)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [hydrated, setHydrated] = useState(false)

  const metaQuery = useQuery({
    queryKey: ['account', 'customers', id, 'edit-meta'],
    queryFn: () => fetchCustomerEditMeta(id!),
    enabled: Boolean(id),
  })

  const customer = metaQuery.data?.customer

  useAccountPageChrome(
    customer?.company_name
      ? `${t('Edit Customer')}: ${customer.company_name}`
      : t('Edit Customer'),
    t('Customers'),
  )

  useEffect(() => {
    setHydrated(false)
  }, [id])

  useEffect(() => {
    if (!customer || hydrated) return
    setData(partyRowToFormState(customer))
    setHydrated(true)
  }, [customer, hydrated])

  const updateMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildCustomerUpdatePayload>) =>
      updateCustomer(Number(id), payload),
    onSuccess: () => {
      toast.success(t('The customer has been updated successfully.'))
      void queryClient.invalidateQueries({ queryKey: ['account', 'customers'] })
      navigate(paths.account.customers)
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const payload = error.response?.data as { errors?: Record<string, string[]> } | undefined
        if (payload?.errors) {
          setFieldErrors(apiErrorsToFieldMap(payload.errors))
        }
      }
      toast.error(getApiErrorMessage(error, t('Failed to update customer')))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    updateMutation.mutate(buildCustomerUpdatePayload(data))
  }

  if (metaQuery.isLoading || !hydrated) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (metaQuery.error || !customer) {
    return (
      <p className="p-6 text-sm text-destructive">{t('Failed to load customer.')}</p>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <CustomerForm
        mode="edit"
        customerCode={customer.customer_code}
        data={data}
        onChange={setData}
        paymentTerms={metaQuery.data?.payment_terms ?? []}
        categories={metaQuery.data?.customer_categories ?? []}
        errors={fieldErrors}
        isPending={updateMutation.isPending}
        submitLabel={t('Update')}
        onSubmit={handleSubmit}
        onCancel={() => navigate(paths.account.customers)}
      />
    </div>
  )
}
