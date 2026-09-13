import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CurrencyInput } from '@/components/ui/currency-input'
import InputError from '@/components/ui/input-error'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EntitySelect } from '@/components/forms/entity-select'
import { toCustomerLookupOptions } from '@/features/_shared/operations-lookups'
import {
  createCustomerPayment,
  getCustomerPaymentCreateMeta,
  getOutstandingInvoices,
} from '../payments-api'
import { customerPaymentSchema } from '../schemas'
import { syncCustomerPaymentForm } from '../payment-form-sync'
import { getFirstFieldErrorMessage } from '@/lib/form-field-errors'
import type {
  AllocationInput,
  CreditNoteInput,
  CreditNoteOutstanding,
  CustomerPaymentFormValues,
  SalesInvoiceOutstanding,
} from '../types'
import { useAccountPageChrome } from '../hooks/use-account-page-chrome'
import { paths } from '@/lib/paths'
import { formatCurrency } from '@/utils/helpers'
import { getApiErrorMessage } from '@/lib/errors'

function clampAmount(value: number, max: number): number {
  return Math.max(0, Math.min(value, max))
}

export function CustomerPaymentCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  useAccountPageChrome(t('Create customer payment'), t('Customer payments'))
  const [selectedAllocations, setSelectedAllocations] = useState<AllocationInput[]>([])
  const [selectedCreditNotes, setSelectedCreditNotes] = useState<CreditNoteInput[]>([])
  const [attachment, setAttachment] = useState<File | null>(null)
  const [apiFieldErrors, setApiFieldErrors] = useState<Record<string, string>>({})

  const { data: meta } = useQuery({
    queryKey: ['customer-payments', 'create-meta'],
    queryFn: getCustomerPaymentCreateMeta,
  })

  const customerOptions = useMemo(
    () => toCustomerLookupOptions(meta?.customers ?? []),
    [meta?.customers],
  )

  const form = useForm<CustomerPaymentFormValues>({
    resolver: zodResolver(customerPaymentSchema),
    defaultValues: {
      payment_date: new Date().toISOString().slice(0, 10),
      customer_id: '',
      bank_account_id: '',
      reference_number: '',
      payment_amount: '0',
      notes: '',
      allocations: [],
      credit_notes: [],
    },
  })

  const customerId = form.watch('customer_id')
  const paymentAmount = form.watch('payment_amount')

  const outstandingQuery = useQuery({
    queryKey: ['customer-payments', 'outstanding', customerId],
    queryFn: () => getOutstandingInvoices(customerId),
    enabled: Boolean(customerId),
  })

  const outstandingInvoices = (outstandingQuery.data?.invoices ?? []) as SalesInvoiceOutstanding[]
  const availableCreditNotes = (outstandingQuery.data?.creditNotes ?? []) as CreditNoteOutstanding[]

  useEffect(() => {
    setSelectedAllocations([])
    setSelectedCreditNotes([])
    form.setValue('allocations', [])
    form.setValue('credit_notes', [])
    form.setValue('payment_amount', '0')
  }, [customerId, form])

  const updateTotalAmount = (
    allocations: AllocationInput[],
    creditNotes: CreditNoteInput[] = selectedCreditNotes,
  ) => {
    syncCustomerPaymentForm(form.setValue, allocations, creditNotes)
  }

  const addAllocation = (invoice: SalesInvoiceOutstanding) => {
    if (selectedAllocations.some((a) => a.invoice_id === invoice.id)) return
    const next = [
      ...selectedAllocations,
      { invoice_id: invoice.id, amount: Number(invoice.balance_amount) },
    ]
    setSelectedAllocations(next)
    updateTotalAmount(next)
  }

  const removeAllocation = (invoiceId: number) => {
    const next = selectedAllocations.filter((a) => a.invoice_id !== invoiceId)
    setSelectedAllocations(next)
    const nextCredits = selectedCreditNotes.filter((c) => {
      const totalAlloc = next.reduce((s, a) => s + a.amount, 0)
      const otherCredits = selectedCreditNotes
        .filter((cn) => cn.credit_note_id !== c.credit_note_id)
        .reduce((s, cn) => s + cn.amount, 0)
      return otherCredits + c.amount <= totalAlloc
    })
    if (nextCredits.length !== selectedCreditNotes.length) {
      setSelectedCreditNotes(nextCredits)
      updateTotalAmount(next, nextCredits)
    } else {
      updateTotalAmount(next)
    }
  }

  const updateAllocationAmount = (invoiceId: number, rawAmount: number) => {
    const invoice = outstandingInvoices.find((inv) => inv.id === invoiceId)
    const amount = clampAmount(Number(rawAmount || 0), invoice?.balance_amount ?? rawAmount)
    const next = selectedAllocations.map((a) =>
      a.invoice_id === invoiceId ? { ...a, amount } : a,
    )
    setSelectedAllocations(next)
    const reconciledCredits = reconcileCreditNotes(next, selectedCreditNotes)
    setSelectedCreditNotes(reconciledCredits)
    updateTotalAmount(next, reconciledCredits)
  }

  const reconcileCreditNotes = (
    allocations: AllocationInput[],
    creditNotes: CreditNoteInput[],
  ): CreditNoteInput[] => {
    const invoiceTotal = allocations.reduce((sum, a) => sum + Number(a.amount || 0), 0)
    let remaining = invoiceTotal
    return creditNotes
      .map((cn) => {
        const note = availableCreditNotes.find((n) => n.id === cn.credit_note_id)
        const maxForNote = Math.min(note?.balance_amount ?? cn.amount, remaining)
        const amount = clampAmount(cn.amount, maxForNote)
        remaining -= amount
        return { ...cn, amount }
      })
      .filter((cn) => cn.amount > 0)
  }

  const applyCreditNote = (note: CreditNoteOutstanding) => {
    if (selectedCreditNotes.some((c) => c.credit_note_id === note.id)) return
    const totalInvoice = selectedAllocations.reduce((s, a) => s + a.amount, 0)
    const currentCredit = selectedCreditNotes.reduce((s, c) => s + c.amount, 0)
    const remaining = totalInvoice - currentCredit
    const amount = Math.min(note.balance_amount, remaining > 0 ? remaining : note.balance_amount)
    if (amount <= 0) return
    const next = [...selectedCreditNotes, { credit_note_id: note.id, amount }]
    setSelectedCreditNotes(next)
    updateTotalAmount(selectedAllocations, next)
  }

  const updateCreditNoteAmount = (index: number, rawAmount: number) => {
    const creditNote = selectedCreditNotes[index]
    if (!creditNote) return
    const note = availableCreditNotes.find((c) => c.id === creditNote.credit_note_id)
    const totalInvoice = selectedAllocations.reduce((sum, a) => sum + Number(a.amount || 0), 0)
    const otherCredit = selectedCreditNotes.reduce(
      (sum, c, i) => (i !== index ? sum + Number(c.amount || 0) : sum),
      0,
    )
    const maxAllowed = Math.min(note?.balance_amount ?? 0, totalInvoice - otherCredit)
    const amount = clampAmount(Number(rawAmount || 0), maxAllowed)
    const next = selectedCreditNotes.map((c, i) => (i === index ? { ...c, amount } : c))
    setSelectedCreditNotes(next)
    updateTotalAmount(selectedAllocations, next)
  }

  const removeCreditNote = (index: number) => {
    const next = selectedCreditNotes.filter((_, i) => i !== index)
    setSelectedCreditNotes(next)
    updateTotalAmount(selectedAllocations, next)
  }

  const create = useMutation({
    mutationFn: createCustomerPayment,
    onSuccess: (payment) => {
      toast.success(t('Payment created'))
      navigate(paths.account.customerPayments.show(payment.id))
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const payload = error.response?.data as { errors?: Record<string, string[]> } | undefined
        if (payload?.errors) {
          const mapped: Record<string, string> = {}
          for (const [key, messages] of Object.entries(payload.errors)) {
            if (messages[0]) mapped[key] = messages[0]
          }
          setApiFieldErrors(mapped)
        }
      }
      toast.error(getApiErrorMessage(error, t('Failed to create payment')))
    },
  })

  const onSubmit = form.handleSubmit(
    (values) => {
      setApiFieldErrors({})
      create.mutate({
        payment_date: values.payment_date,
        customer_id: Number(values.customer_id),
        bank_account_id: Number(values.bank_account_id),
        reference_number: values.reference_number || undefined,
        payment_amount: Number(values.payment_amount),
        notes: values.notes || undefined,
        allocations: values.allocations,
        credit_notes: values.credit_notes?.length ? values.credit_notes : undefined,
        attachment,
      })
    },
    (errors) => {
      toast.error(
        getFirstFieldErrorMessage(errors) ??
          t('Please correct the highlighted fields before submitting'),
      )
    },
  )

  const handleCreatePayment = () => {
    if (selectedAllocations.length === 0) {
      toast.error(t('Add at least one outstanding invoice to the payment'))
      return
    }
    syncCustomerPaymentForm(form.setValue, selectedAllocations, selectedCreditNotes)
    void onSubmit()
  }

  const getInvoiceById = (id: number) => outstandingInvoices.find((inv) => inv.id === id)

  const fieldError = (
    name: keyof CustomerPaymentFormValues | 'allocations' | 'credit_notes' | 'attachment',
  ) => form.formState.errors[name]?.message ?? apiFieldErrors[name]

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>{t('Create customer payment')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleCreatePayment()
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_date">{t('Payment date')}</Label>
              <Input id="payment_date" type="date" {...form.register('payment_date')} />
              <InputError message={fieldError('payment_date')} />
            </div>
            <div className="space-y-2">
              <Label>{t('Customer')}</Label>
              <EntitySelect
                value={customerId}
                onValueChange={(v) => form.setValue('customer_id', v, { shouldValidate: true })}
                options={customerOptions}
                placeholder={t('Select customer')}
                required
              />
              <InputError message={fieldError('customer_id')} />
            </div>
            <div className="space-y-2">
              <Label>{t('Bank account')}</Label>
              <Select
                value={form.watch('bank_account_id')}
                onValueChange={(v) => form.setValue('bank_account_id', v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select bank account')} />
                </SelectTrigger>
                <SelectContent>
                  {meta?.bank_accounts?.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.account_name}
                      {a.account_number ? ` (${a.account_number})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <InputError message={fieldError('bank_account_id')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference_number">{t('Reference number')}</Label>
              <Input
                id="reference_number"
                placeholder={t('Check number, etc.')}
                {...form.register('reference_number')}
              />
              <InputError message={fieldError('reference_number')} />
            </div>
          </div>

          {customerId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t('Outstanding invoices')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                  {outstandingQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
                  ) : outstandingInvoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('No outstanding invoices found for this customer')}
                    </p>
                  ) : (
                    outstandingInvoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-2 border rounded text-sm"
                      >
                        <div>
                          <span className="font-medium">{invoice.invoice_number}</span>
                          <span className="text-muted-foreground ml-2">
                            {t('Balance')}: {formatCurrency(invoice.balance_amount)}
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addAllocation(invoice)}
                          disabled={selectedAllocations.some((a) => a.invoice_id === invoice.id)}
                        >
                          {t('Add')}
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t('Available credit notes')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                  {outstandingQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
                  ) : availableCreditNotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('No credit notes available for this customer')}
                    </p>
                  ) : (
                    availableCreditNotes.map((note) => (
                      <div
                        key={note.id}
                        className="flex items-center justify-between p-2 border rounded text-sm"
                      >
                        <div>
                          <span className="font-medium">{note.credit_note_number}</span>
                          <span className="text-muted-foreground ml-2">
                            {t('Balance')}: {formatCurrency(note.balance_amount)}
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            selectedCreditNotes.some((c) => c.credit_note_id === note.id) ||
                            selectedAllocations.length === 0
                          }
                          onClick={() => applyCreditNote(note)}
                        >
                          {t('Apply')}
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {(selectedAllocations.length > 0 || selectedCreditNotes.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('Payment summary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedAllocations.map((allocation) => {
                  const invoice = getInvoiceById(allocation.invoice_id)
                  return (
                    <div
                      key={allocation.invoice_id}
                      className="flex items-center gap-3 p-3 border rounded"
                    >
                      <div className="flex-1 text-sm">
                        <div className="font-medium">{invoice?.invoice_number}</div>
                        <div className="text-muted-foreground">
                          {t('Balance')}: {formatCurrency(invoice?.balance_amount ?? 0)}
                        </div>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        min={0.01}
                        max={invoice?.balance_amount}
                        className="w-32"
                        value={allocation.amount}
                        onChange={(e) =>
                          updateAllocationAmount(allocation.invoice_id, Number(e.target.value))
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAllocation(allocation.invoice_id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )
                })}
                {selectedCreditNotes.map((creditNote, index) => {
                  const note = availableCreditNotes.find((c) => c.id === creditNote.credit_note_id)
                  const maxCredit = Math.min(
                    note?.balance_amount ?? 0,
                    selectedAllocations.reduce((sum, a) => sum + a.amount, 0),
                  )
                  return (
                    <div
                      key={`credit-${creditNote.credit_note_id}`}
                      className="flex items-center gap-3 p-3 border rounded bg-emerald-50/50 dark:bg-emerald-950/20"
                    >
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-emerald-800 dark:text-emerald-300">
                          {note?.credit_note_number}
                        </div>
                        <div className="text-muted-foreground">
                          {t('Credit applied to payment')}
                        </div>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        min={0.01}
                        max={maxCredit}
                        className="w-32"
                        value={creditNote.amount}
                        onChange={(e) => updateCreditNoteAmount(index, Number(e.target.value))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCreditNote(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          <CurrencyInput
            label={t('Total payment amount')}
            value={paymentAmount}
            onChange={() => {}}
            disabled
            required
            error={fieldError('payment_amount')}
          />

          <InputError message={fieldError('allocations')} />
          <InputError message={apiFieldErrors.credit_notes ?? fieldError('credit_notes')} />

          <div className="space-y-2">
            <Label htmlFor="notes">{t('Notes')}</Label>
            <Textarea id="notes" rows={3} placeholder={t('Enter notes')} {...form.register('notes')} />
            <InputError message={fieldError('notes')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt">{t('Upload S.O/Invoice payment receipt')}</Label>
            <Input
              id="receipt"
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
            />
            {attachment ? (
              <p className="text-sm text-muted-foreground">{attachment.name}</p>
            ) : null}
            <InputError message={fieldError('attachment')} />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? t('Creating…') : t('Create payment')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(paths.account.customerPayments.index)}
            >
              {t('Cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
