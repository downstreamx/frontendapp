import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatQuantity } from '@/lib/format-quantity'
import { createZodResolver } from '@/lib/form/zod-resolver'
import { getApiErrorMessage } from '@/lib/errors'
import { queryKeys } from '@/lib/query-keys'
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
import { Skeleton } from '@/components/ui/skeleton'
import InputError from '@/components/ui/input-error'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import {
  listBridgedAvailableTruckLoads,
  type CustomerStockBalance,
  type BulkAssignTruckLoadsPayload,
  type TruckLoad,
} from '../bridging-api'
import {
  assignTruckLoadFormSchema,
  parseStoreTruckLoadQuantity,
  type AssignTruckLoadFormValues,
  validateAssignTruckLoadQuantity,
} from '../schemas'
import { TruckMultiSelectList, type TruckMultiSelectItem } from './TruckMultiSelectList'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  salesInvoiceId: number
  stockBalances: CustomerStockBalance[]
  assignedTruckLoads?: TruckLoad[]
  isPending?: boolean
  onSubmit: (payload: BulkAssignTruckLoadsPayload) => void
}

function allocatedQtyOnInvoice(load: TruckLoad, salesInvoiceId: number): number {
  const fromAllocations = (load.sales_allocations ?? [])
    .filter((row) => row.sales_invoice_id === salesInvoiceId)
    .reduce((sum, row) => sum + row.quantity, 0)
  if (fromAllocations > 0) {
    return fromAllocations
  }
  if (load.sales_invoice_id === salesInvoiceId) {
    return load.assigned_qty || load.quantity
  }
  return 0
}

const entitlementOnlySchema = assignTruckLoadFormSchema.pick({
  customer_stock_balance_id: true,
})

function loadAssignableQty(load: TruckLoad): number {
  return load.remaining_assignable_qty || load.quantity
}

function defaultQuantitiesForLoads(
  loadIds: number[],
  loadsById: Map<number, TruckLoad>,
  balance: number,
): Record<number, string> {
  const next: Record<number, string> = {}
  let remaining = balance
  for (const id of loadIds) {
    const load = loadsById.get(id)
    if (!load || remaining <= 0) {
      next[id] = ''
      continue
    }
    const qty = Math.min(loadAssignableQty(load), remaining)
    next[id] = qty > 0 ? String(qty) : ''
    remaining -= qty
  }
  return next
}

export function AssignTruckLoadDialog({
  open,
  onOpenChange,
  salesInvoiceId,
  stockBalances,
  assignedTruckLoads = [],
  isPending,
  onSubmit,
}: Props) {
  const { t } = useTranslation()
  const form = useForm<Pick<AssignTruckLoadFormValues, 'customer_stock_balance_id'>>({
    resolver: createZodResolver(entitlementOnlySchema),
    defaultValues: { customer_stock_balance_id: '' },
  })

  const [selectedLoadIds, setSelectedLoadIds] = useState<number[]>([])
  const [quantities, setQuantities] = useState<Record<number, string>>({})
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<BulkAssignTruckLoadsPayload | null>(null)

  const eligibleStockBalances = useMemo(
    () => stockBalances.filter((e) => e.balance_qty > 0),
    [stockBalances],
  )

  const entitlementId = form.watch('customer_stock_balance_id')
  const selectedStockBalance = eligibleStockBalances.find((e) => String(e.id) === entitlementId)

  const availableQuery = useQuery({
    queryKey: queryKeys.bridging.bridgedAvailable.list(salesInvoiceId, entitlementId),
    queryFn: () =>
      listBridgedAvailableTruckLoads({
        customer_stock_balance_id: entitlementId,
        per_page: '50',
      }),
    enabled: open && Boolean(entitlementId),
  })

  const availableLoads = availableQuery.data?.rows ?? []

  const loadsById = useMemo(() => {
    const map = new Map<number, TruckLoad>()
    for (const load of availableLoads) {
      map.set(load.id, load)
    }
    return map
  }, [availableLoads])

  const loadItems: TruckMultiSelectItem[] = useMemo(
    () =>
      availableLoads.map((load) => {
        const truck = load.truck?.plate_number ?? t('Truck')
        const pi = load.purchase_invoice?.invoice_number
        const qty = formatQuantity(loadAssignableQty(load), { unit: 'L' })
        return {
          id: load.id,
          label: pi ? `${truck} · ${pi}` : truck,
          sublabel: `${t('Available')}: ${qty}`,
          image: load.truck?.avatar,
          mediaKind: 'truck' as const,
        }
      }),
    [availableLoads, t],
  )

  useEffect(() => {
    if (!open) return
    const firstWithTrucks = eligibleStockBalances.find(
      (row) => (row.bridged_truck_count ?? 0) > 0,
    )
    form.reset({
      customer_stock_balance_id: firstWithTrucks ? String(firstWithTrucks.id) : '',
    })
    setSelectedLoadIds([])
    setQuantities({})
    setSelectionError(null)
  }, [open, eligibleStockBalances, form])

  useEffect(() => {
    setSelectedLoadIds([])
    setQuantities({})
    setSelectionError(null)
  }, [entitlementId])

  const handleLoadSelectionChange = (ids: number[]) => {
    setSelectedLoadIds(ids)
    if (selectedStockBalance) {
      setQuantities(
        defaultQuantitiesForLoads(ids, loadsById, selectedStockBalance.balance_qty),
      )
    } else {
      setQuantities({})
    }
    setSelectionError(null)
  }

  const totalAssignQty = useMemo(() => {
    let sum = 0
    for (const id of selectedLoadIds) {
      const parsed = parseStoreTruckLoadQuantity(quantities[id] ?? '')
      if (parsed != null) sum += parsed
    }
    return sum
  }, [selectedLoadIds, quantities])

  const exceedsBalance =
    selectedStockBalance != null && totalAssignQty > selectedStockBalance.balance_qty

  const assignedLoadsForBalance = useMemo(() => {
    if (!selectedStockBalance) return []
    return assignedTruckLoads.filter((load) => {
      if (allocatedQtyOnInvoice(load, salesInvoiceId) <= 0) return false
      const allocationMatch = (load.sales_allocations ?? []).some(
        (row) => row.customer_stock_balance_id === selectedStockBalance.id,
      )
      if (allocationMatch) return true
      return load.customer_stock_balance_id === selectedStockBalance.id
    })
  }, [assignedTruckLoads, salesInvoiceId, selectedStockBalance])

  const emptyTruckMessage = useMemo(() => {
    if (!selectedStockBalance) {
      return t(
        'No bridged trucks are available for this product. Confirm arrival at depot on purchase invoices first.',
      )
    }

    const productName = selectedStockBalance.product?.name ?? t('this product')

    if ((selectedStockBalance.bridged_truck_count ?? 0) === 0 && assignedLoadsForBalance.length > 0) {
      return t(
        'Trucks already assigned to this invoice cannot be selected again. To distribute more {{product}}, approve bridging and confirm arrival of additional trucks on purchase invoices.',
        { product: productName },
      )
    }

    if ((selectedStockBalance.bridged_truck_count ?? 0) === 0) {
      return t(
        'No bridged trucks at depot for {{product}}. Approve bridging and confirm arrival on purchase invoices that include this product.',
        { product: productName },
      )
    }

    return t(
      'No bridged trucks at depot for {{product}}. Approve bridging and confirm arrival on purchase invoices that include this product.',
      { product: productName },
    )
  }, [assignedLoadsForBalance.length, selectedStockBalance, t])

  const handleSubmit = form.handleSubmit(() => {
    if (!selectedStockBalance) return
    if (selectedLoadIds.length === 0) {
      setSelectionError(t('Select at least one truck load.'))
      return
    }

    const assignments: { truck_load_id: number; quantity: number }[] = []
    for (const loadId of selectedLoadIds) {
      const load = loadsById.get(loadId)
      if (!load) continue
      const maxOnLoad = loadAssignableQty(load)
      const quantityError = validateAssignTruckLoadQuantity(
        quantities[loadId] ?? '',
        selectedStockBalance.balance_qty,
        maxOnLoad,
      )
      if (quantityError) {
        setSelectionError(quantityError)
        return
      }
      const parsed = parseStoreTruckLoadQuantity(quantities[loadId] ?? '')
      if (parsed == null) {
        setSelectionError(t('Enter a valid quantity for each selected truck.'))
        return
      }
      assignments.push({ truck_load_id: loadId, quantity: parsed })
    }

    const total = assignments.reduce((sum, row) => sum + row.quantity, 0)
    if (total > selectedStockBalance.balance_qty) {
      setSelectionError(t('Total quantity exceeds remaining customer distribution balance.'))
      return
    }

    setPendingPayload({
      customer_stock_balance_id: selectedStockBalance.id,
      assignments,
    })
    setConfirmOpen(true)
  })

  const handleConfirmDistribute = () => {
    if (!pendingPayload) return
    onSubmit(pendingPayload)
    setPendingPayload(null)
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('Distribute Product')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('Customer stock balance')} *</Label>
            <Select
              value={entitlementId || undefined}
              onValueChange={(value) =>
                form.setValue('customer_stock_balance_id', value, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select stock balance')} />
              </SelectTrigger>
              <SelectContent>
                {eligibleStockBalances.map((row) => (
                  <SelectItem key={row.id} value={String(row.id)}>
                    {row.product?.name ?? t('Product')} — {t('Balance')}:{' '}
                    {formatQuantity(row.balance_qty)}
                    {(row.bridged_truck_count ?? 0) > 0
                      ? ` · ${t('{{count}} truck(s)', { count: row.bridged_truck_count })}`
                      : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError message={form.formState.errors.customer_stock_balance_id?.message} />
          </div>

          <div className="space-y-2">
            <Label>{t('Bridged trucks at depot')} *</Label>
            {availableQuery.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : !entitlementId ? (
              <p className="text-sm text-muted-foreground">{t('Select a stock balance first.')}</p>
            ) : availableQuery.isError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {getApiErrorMessage(
                    availableQuery.error,
                    t('Could not load bridged trucks. Try again.'),
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <TruckMultiSelectList
                items={loadItems}
                selectedIds={selectedLoadIds}
                onSelectionChange={handleLoadSelectionChange}
                quantities={quantities}
                onQuantityChange={(id, value) => {
                  setQuantities((prev) => ({ ...prev, [id]: value }))
                  setSelectionError(null)
                }}
                emptyMessage={emptyTruckMessage}
              />
            )}
            <InputError message={selectionError ?? undefined} />
            {selectedStockBalance && selectedLoadIds.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {t('Total to assign')}: {formatQuantity(totalAssignQty)} /{' '}
                {formatQuantity(selectedStockBalance.balance_qty)} {t('balance')}
              </p>
            ) : null}
          </div>

          {exceedsBalance ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t(
                  'Total assigned quantity exceeds the remaining stock balance. Reduce quantities or remove trucks.',
                )}
              </AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                isPending ||
                eligibleStockBalances.length === 0 ||
                availableLoads.length === 0 ||
                selectedLoadIds.length === 0 ||
                exceedsBalance
              }
            >
              {isPending ? t('Assigning...') : t('Distribute')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <ConfirmationDialog
      open={confirmOpen}
      onOpenChange={(next) => {
        setConfirmOpen(next)
        if (!next) setPendingPayload(null)
      }}
      title={t('Distribute product?')}
      message={t('Are you sure you want to assign the selected truck(s) to this sales invoice?')}
      confirmText={t('Distribute')}
      onConfirm={handleConfirmDistribute}
      loading={isPending}
    />
    </>
  )
}
