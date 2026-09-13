import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EntitySelect } from '@/components/forms/entity-select'
import { toSupplierLookupOptions } from '@/features/_shared/operations-lookups'
import {
  createSupplierPayment,
  getSupplierPaymentCreateMeta,
  getSupplierOutstanding,
} from '../payments-api'
import { supplierPaymentSchema } from '../schemas'
import { syncSupplierPaymentForm } from '../payment-form-sync'
import { getFirstFieldErrorMessage } from '@/lib/form-field-errors'
import type {
  AllocationInput,
  DebitNoteInput,
  DebitNoteOutstanding,
  SupplierPaymentFormValues,
  SalesInvoiceOutstanding,
} from '../types'
import { formatCurrency } from '@/utils/helpers'
import { getApiErrorMessage } from '@/lib/errors'

function clampAmount(value: number, max: number): number {
  return Math.max(0, Math.min(value, max))
}

const defaultFormValues: SupplierPaymentFormValues = {
  payment_date: new Date().toISOString().slice(0, 10),
  supplier_id: '',
  bank_account_id: '',
  reference_number: '',
  payment_amount: '0',
  notes: '',
  allocations: [],
  debit_notes: [],
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupplierPaymentCreateDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedAllocations, setSelectedAllocations] = useState<AllocationInput[]>([])
  const [selectedDebitNotes, setSelectedDebitNotes] = useState<DebitNoteInput[]>([])
  const [attachment, setAttachment] = useState<File | null>(null)
  const [apiFieldErrors, setApiFieldErrors] = useState<Record<string, string>>({})

  const { data: meta } = useQuery({
    queryKey: ['supplier-payments', 'create-meta'],
    queryFn: getSupplierPaymentCreateMeta,
    enabled: open,
  })

  const supplierOptions = useMemo(
    () => toSupplierLookupOptions(meta?.suppliers ?? []),
    [meta?.suppliers],
  )

  const form = useForm<SupplierPaymentFormValues>({
    resolver: zodResolver(supplierPaymentSchema),
    defaultValues: defaultFormValues,
  })

  const supplierId = form.watch('supplier_id')
  const bankAccountId = form.watch('bank_account_id')
  const paymentAmount = form.watch('payment_amount')

  const selectedBankAccount = meta?.bank_accounts?.find(
    (account) => String(account.id) === bankAccountId,
  )
  const bankBalance = selectedBankAccount?.current_balance
  const paymentAmountNum = Number(paymentAmount) || 0
  const insufficientBalance =
    bankBalance != null && paymentAmountNum > 0 && paymentAmountNum > bankBalance

  const outstandingQuery = useQuery({
    queryKey: ['supplier-payments', 'outstanding', supplierId],
    queryFn: () => getSupplierOutstanding(supplierId),
    enabled: open && Boolean(supplierId),
  })

  const outstandingInvoices = (outstandingQuery.data?.invoices ?? []) as SalesInvoiceOutstanding[]
  const availableDebitNotes = (outstandingQuery.data?.debitNotes ?? []) as DebitNoteOutstanding[]

  const resetForm = () => {
    form.reset({
      ...defaultFormValues,
      payment_date: new Date().toISOString().slice(0, 10),
    })
    setSelectedAllocations([])
    setSelectedDebitNotes([])
    setAttachment(null)
    setApiFieldErrors({})
  }

  useEffect(() => {
    if (!open) return
    resetForm()
  }, [open])

  useEffect(() => {
    if (!open) return
    setSelectedAllocations([])
    setSelectedDebitNotes([])
    form.setValue('allocations', [])
    form.setValue('debit_notes', [])
    form.setValue('payment_amount', '0')
  }, [supplierId, form, open])

  const updateTotalAmount = (
    allocations: AllocationInput[],
    debitNotes: DebitNoteInput[] = selectedDebitNotes,
  ) => {
    syncSupplierPaymentForm(form.setValue, allocations, debitNotes)
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
    const nextDebits = selectedDebitNotes.filter((c) => {
      const totalAlloc = next.reduce((s, a) => s + a.amount, 0)
      const otherDebits = selectedDebitNotes
        .filter((cn) => cn.debit_note_id !== c.debit_note_id)
        .reduce((s, cn) => s + cn.amount, 0)
      return otherDebits + c.amount <= totalAlloc
    })
    if (nextDebits.length !== selectedDebitNotes.length) {
      setSelectedDebitNotes(nextDebits)
      updateTotalAmount(next, nextDebits)
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
    const reconciledDebits = reconcileDebitNotes(next, selectedDebitNotes)
    setSelectedDebitNotes(reconciledDebits)
    updateTotalAmount(next, reconciledDebits)
  }

  const reconcileDebitNotes = (
    allocations: AllocationInput[],
    debitNotes: DebitNoteInput[],
  ): DebitNoteInput[] => {
    const invoiceTotal = allocations.reduce((sum, a) => sum + Number(a.amount || 0), 0)
    let remaining = invoiceTotal
    return debitNotes
      .map((cn) => {
        const note = availableDebitNotes.find((n) => n.id === cn.debit_note_id)
        const maxForNote = Math.min(note?.balance_amount ?? cn.amount, remaining)
        const amount = clampAmount(cn.amount, maxForNote)
        remaining -= amount
        return { ...cn, amount }
      })
      .filter((cn) => cn.amount > 0)
  }

  const applyDebitNote = (note: DebitNoteOutstanding) => {
    if (selectedDebitNotes.some((c) => c.debit_note_id === note.id)) return
    const totalInvoice = selectedAllocations.reduce((s, a) => s + a.amount, 0)
    const currentDebit = selectedDebitNotes.reduce((s, c) => s + c.amount, 0)
    const remaining = totalInvoice - currentDebit
    const amount = Math.min(note.balance_amount, remaining > 0 ? remaining : note.balance_amount)
    if (amount <= 0) return
    const next = [...selectedDebitNotes, { debit_note_id: note.id, amount }]
    setSelectedDebitNotes(next)
    updateTotalAmount(selectedAllocations, next)
  }

  const updateDebitNoteAmount = (index: number, rawAmount: number) => {
    const debitNote = selectedDebitNotes[index]
    if (!debitNote) return
    const note = availableDebitNotes.find((c) => c.id === debitNote.debit_note_id)
    const totalInvoice = selectedAllocations.reduce((sum, a) => sum + Number(a.amount || 0), 0)
    const otherDebit = selectedDebitNotes.reduce(
      (sum, c, i) => (i !== index ? sum + Number(c.amount || 0) : sum),
      0,
    )
    const maxAllowed = Math.min(note?.balance_amount ?? 0, totalInvoice - otherDebit)
    const amount = clampAmount(Number(rawAmount || 0), maxAllowed)
    const next = selectedDebitNotes.map((c, i) => (i === index ? { ...c, amount } : c))
    setSelectedDebitNotes(next)
    updateTotalAmount(selectedAllocations, next)
  }

  const removeDebitNote = (index: number) => {
    const next = selectedDebitNotes.filter((_, i) => i !== index)
    setSelectedDebitNotes(next)
    updateTotalAmount(selectedAllocations, next)
  }

  const create = useMutation({
    mutationFn: createSupplierPayment,
    onSuccess: () => {
      toast.success(t('Payment created'))
      void queryClient.invalidateQueries({ queryKey: ['supplier-payments'] })
      onOpenChange(false)
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
        supplier_id: Number(values.supplier_id),
        bank_account_id: Number(values.bank_account_id),
        reference_number: values.reference_number || undefined,
        payment_amount: Number(values.payment_amount),
        notes: values.notes || undefined,
        allocations: values.allocations,
        debit_notes: values.debit_notes?.length ? values.debit_notes : undefined,
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
    syncSupplierPaymentForm(form.setValue, selectedAllocations, selectedDebitNotes)
    void onSubmit()
  }

  const getInvoiceById = (id: number) => outstandingInvoices.find((inv) => inv.id === id)

  const fieldError = (
    name: keyof SupplierPaymentFormValues | 'allocations' | 'debit_notes' | 'attachment',
  ) => form.formState.errors[name]?.message ?? apiFieldErrors[name]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>{t('Create supplier payment')}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleCreatePayment()
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supplier-payment-date">{t('Payment date')}</Label>
                <Input
                  id="supplier-payment-date"
                  type="date"
                  {...form.register('payment_date')}
                />
                <InputError message={fieldError('payment_date')} />
              </div>
              <div className="space-y-2">
                <Label>{t('Supplier')}</Label>
                <EntitySelect
                  value={supplierId}
                  onValueChange={(v) => form.setValue('supplier_id', v, { shouldValidate: true })}
                  options={supplierOptions}
                  placeholder={t('Select supplier')}
                  required
                />
                <InputError message={fieldError('supplier_id')} />
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
                        {a.current_balance != null
                          ? ` — ${formatCurrency(a.current_balance)}`
                          : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {bankBalance != null ? (
                  <p className="text-xs text-muted-foreground">
                    {t('Available balance')}: {formatCurrency(bankBalance)}
                  </p>
                ) : null}
                {insufficientBalance ? (
                  <p className="text-xs text-destructive">
                    {t('Payment amount exceeds available bank balance.')}
                  </p>
                ) : null}
                <InputError message={fieldError('bank_account_id')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-payment-reference">{t('Reference number')}</Label>
                <Input
                  id="supplier-payment-reference"
                  placeholder={t('Check number, etc.')}
                  {...form.register('reference_number')}
                />
                <InputError message={fieldError('reference_number')} />
              </div>
            </div>

            {supplierId ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{t('Outstanding invoices')}</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-48 space-y-2 overflow-y-auto">
                    {outstandingQuery.isLoading ? (
                      <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
                    ) : outstandingInvoices.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t('No outstanding invoices found for this supplier')}
                      </p>
                    ) : (
                      outstandingInvoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between rounded border p-2 text-sm"
                        >
                          <div>
                            <span className="font-medium">{invoice.invoice_number}</span>
                            <span className="ml-2 text-muted-foreground">
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
                    <CardTitle className="text-sm">{t('Available debit notes')}</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-48 space-y-2 overflow-y-auto">
                    {outstandingQuery.isLoading ? (
                      <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
                    ) : availableDebitNotes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t('No debit notes available for this supplier')}
                      </p>
                    ) : (
                      availableDebitNotes.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-center justify-between rounded border p-2 text-sm"
                        >
                          <div>
                            <span className="font-medium">{note.debit_note_number}</span>
                            <span className="ml-2 text-muted-foreground">
                              {t('Balance')}: {formatCurrency(note.balance_amount)}
                            </span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={
                              selectedDebitNotes.some((c) => c.debit_note_id === note.id) ||
                              selectedAllocations.length === 0
                            }
                            onClick={() => applyDebitNote(note)}
                          >
                            {t('Apply')}
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {selectedAllocations.length > 0 || selectedDebitNotes.length > 0 ? (
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
                        className="flex items-center gap-3 rounded border p-3"
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
                  {selectedDebitNotes.map((debitNote, index) => {
                    const note = availableDebitNotes.find((c) => c.id === debitNote.debit_note_id)
                    const maxDebit = Math.min(
                      note?.balance_amount ?? 0,
                      selectedAllocations.reduce((sum, a) => sum + a.amount, 0),
                    )
                    return (
                      <div
                        key={`debit-${debitNote.debit_note_id}`}
                        className="flex items-center gap-3 rounded border bg-emerald-50/50 p-3 dark:bg-emerald-950/20"
                      >
                        <div className="flex-1 text-sm">
                          <div className="font-medium text-emerald-800 dark:text-emerald-300">
                            {note?.debit_note_number}
                          </div>
                          <div className="text-muted-foreground">
                            {t('Debit applied to payment')}
                          </div>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          min={0.01}
                          max={maxDebit}
                          className="w-32"
                          value={debitNote.amount}
                          onChange={(e) => updateDebitNoteAmount(index, Number(e.target.value))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDebitNote(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ) : null}

            <CurrencyInput
              label={t('Total payment amount')}
              value={paymentAmount}
              onChange={() => {}}
              disabled
              required
              error={fieldError('payment_amount')}
            />

            <InputError message={fieldError('allocations')} />
            <InputError message={apiFieldErrors.debit_notes ?? fieldError('debit_notes')} />

            <div className="space-y-2">
              <Label htmlFor="supplier-payment-notes">{t('Notes')}</Label>
              <Textarea
                id="supplier-payment-notes"
                rows={3}
                placeholder={t('Enter notes')}
                {...form.register('notes')}
              />
              <InputError message={fieldError('notes')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-payment-receipt">{t('Upload S.O/Invoice payment receipt')}</Label>
              <Input
                id="supplier-payment-receipt"
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
              />
              {attachment ? (
                <p className="text-sm text-muted-foreground">{attachment.name}</p>
              ) : null}
              <InputError message={fieldError('attachment')} />
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? t('Creating…') : t('Create payment')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
