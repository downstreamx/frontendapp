import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CustomerForm } from './CustomerForm'
import {
  apiErrorsToFieldMap,
  buildCustomerPayload,
  buildSupplierPayload,
  initialCustomerFormState,
  type CustomerFormState,
} from '../customer-form-utils'
import {
  createCustomer,
  createSupplier,
  fetchCustomerCreateMeta,
  fetchSupplierCreateMeta,
} from '../account-party-api'
import { getApiErrorMessage } from '@/lib/errors'

type PartyKind = 'customer' | 'supplier'

type Props = {
  party: PartyKind
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PartyCreateDialog({ party, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isSupplier = party === 'supplier'
  const [data, setData] = useState<CustomerFormState>(initialCustomerFormState)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setData(initialCustomerFormState())
    setFieldErrors({})
  }, [open])

  const metaQuery = useQuery({
    queryKey: ['account', isSupplier ? 'suppliers' : 'customers', 'create-meta'],
    queryFn: isSupplier ? fetchSupplierCreateMeta : fetchCustomerCreateMeta,
    enabled: open,
  })

  const closeDialog = () => {
    onOpenChange(false)
  }

  const createMutation = useMutation({
    mutationFn: isSupplier ? createSupplier : createCustomer,
    onSuccess: () => {
      toast.success(
        isSupplier
          ? t('The supplier has been created successfully.')
          : t('The customer has been created successfully.'),
      )
      void queryClient.invalidateQueries({
        queryKey: ['account', isSupplier ? 'suppliers' : 'customers'],
      })
      closeDialog()
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const payload = error.response?.data as { errors?: Record<string, string[]> } | undefined
        if (payload?.errors) {
          setFieldErrors(apiErrorsToFieldMap(payload.errors))
        }
      }
      toast.error(
        getApiErrorMessage(
          error,
          isSupplier ? t('Failed to create supplier') : t('Failed to create customer'),
        ),
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    createMutation.mutate(isSupplier ? buildSupplierPayload(data) : buildCustomerPayload(data))
  }

  const categories = isSupplier
    ? (metaQuery.data && 'supplier_categories' in metaQuery.data
        ? metaQuery.data.supplier_categories
        : [])
    : (metaQuery.data && 'customer_categories' in metaQuery.data
        ? metaQuery.data.customer_categories
        : [])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeDialog()
        else onOpenChange(true)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isSupplier ? t('Create Supplier') : t('Create Customer')}</DialogTitle>
        </DialogHeader>
        {metaQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : metaQuery.error ? (
          <p className="text-sm text-destructive">
            {getApiErrorMessage(
              metaQuery.error,
              isSupplier
                ? t('Failed to load supplier form.')
                : t('Failed to load customer form.'),
            )}
          </p>
        ) : (
          <CustomerForm
            party={party}
            mode="create"
            data={data}
            onChange={setData}
            users={metaQuery.data?.users ?? []}
            paymentTerms={metaQuery.data?.payment_terms ?? []}
            categories={categories}
            errors={fieldErrors}
            isPending={createMutation.isPending}
            submitLabel={t('Create')}
            onSubmit={handleSubmit}
            onCancel={closeDialog}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
