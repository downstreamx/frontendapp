import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Skeleton } from '@/components/ui/skeleton'
import { CustomerForm } from '../components/CustomerForm'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import {
  apiErrorsToFieldMap,
  buildSupplierPayload,
  initialCustomerFormState,
  type CustomerFormState,
} from '../customer-form-utils'
import { createSupplier, fetchSupplierCreateMeta } from '../account-party-api'
import { paths } from '@/lib/paths'
import { getApiErrorMessage } from '@/lib/errors'

export function SupplierCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [data, setData] = useState<CustomerFormState>(initialCustomerFormState)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useAccountPageChrome(t('Create Supplier'), t('Suppliers'))

  const metaQuery = useQuery({
    queryKey: ['account', 'suppliers', 'create-meta'],
    queryFn: fetchSupplierCreateMeta,
  })

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      toast.success(t('The supplier has been created successfully.'))
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
      toast.error(getApiErrorMessage(error, t('Failed to create supplier')))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    createMutation.mutate(buildSupplierPayload(data))
  }

  if (metaQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (metaQuery.error) {
    return (
      <p className="p-6 text-sm text-destructive">
        {getApiErrorMessage(metaQuery.error, t('Failed to load supplier form.'))}
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <CustomerForm
        party="supplier"
        mode="create"
        data={data}
        onChange={setData}
        paymentTerms={metaQuery.data?.payment_terms ?? []}
        categories={metaQuery.data?.supplier_categories ?? []}
        errors={fieldErrors}
        isPending={createMutation.isPending}
        submitLabel={t('Create')}
        onSubmit={handleSubmit}
        onCancel={() => navigate(paths.account.suppliers)}
      />
    </div>
  )
}
