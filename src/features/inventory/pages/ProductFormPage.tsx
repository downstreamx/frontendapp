import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import InputError from '@/components/ui/input-error'
import { Card, CardContent } from '@/components/ui/card'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiSelectEnhanced } from '@/components/ui/multi-select-enhanced'
import { MediaPicker } from '@/features/media/components/MediaPicker'
import { usePageChrome } from '@/contexts/page-chrome-context'
import {
  createProduct,
  fetchProductCreateMeta,
  formValuesToApiPayload,
  getProduct,
  productToFormValues,
  updateProduct,
} from '../api'
import { productCreateSchema, productEditSchema } from '../schemas'
import { paths } from '@/lib/paths'
import { getApiErrorMessage } from '@/lib/errors'
import type { FormDialogCallbacks } from '@/features/shared/types/form-presentation'
import { cn } from '@/lib/utils'

type TabId = 'details' | 'pricing' | 'media' | 'depot'

type CreateValues = z.infer<typeof productCreateSchema>
type EditValues = z.infer<typeof productEditSchema>

const createDefaults: CreateValues = {
  name: '',
  sku: '',
  tax_ids: [],
  category_id: 0,
  description: '',
  long_description: '',
  sale_price: 0,
  purchase_price: 0,
  unit: 0,
  quantity: 0,
  image: '',
  images: [],
  depot_id: 0,
  type: 'product',
}

export function ProductFormPage({
  presentation = 'page',
  onSuccess,
  onCancel,
}: FormDialogCallbacks = {}) {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)
  const isDialog = presentation === 'dialog' && !isEdit
  const [activeTab, setActiveTab] = useState<TabId>('details')

  const { data: meta, isLoading: metaLoading } = useQuery({
    queryKey: ['product-service', 'create-meta'],
    queryFn: fetchProductCreateMeta,
  })

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: isEdit,
  })

  const form = useForm<CreateValues | EditValues>({
    resolver: zodResolver(isEdit ? productEditSchema : productCreateSchema),
    defaultValues: createDefaults,
  })

  const itemType = form.watch('type')
  const isService = itemType === 'service'

  useEffect(() => {
    if (!product || !isEdit) return
    form.reset(productToFormValues(product))
  }, [product, isEdit, form])

  usePageChrome(
    isDialog
      ? {}
      : {
          pageTitle: isEdit ? t('Edit Product') : t('Create Product'),
          breadcrumbs: [
            { label: t('Products'), url: paths.inventory.products },
            ...(isEdit && product
              ? [{ label: product.name, url: paths.inventory.productShow(product.id) }]
              : []),
            { label: isEdit ? t('Edit') : t('Create') },
          ],
        },
  )

  const taxOptions = useMemo(
    () =>
      (meta?.taxes ?? []).map((tax) => ({
        value: String(tax.id),
        label: `${tax.tax_name} (${tax.rate}%)`,
      })),
    [meta?.taxes],
  )

  const detailFields = ['name', 'sku', 'tax_ids', 'category_id', 'type'] as const
  const pricingFields = ['sale_price', 'purchase_price', 'unit', ...(isService || isEdit ? [] : (['quantity'] as const))] as const
  const depotFields = ['depot_id'] as const

  const nextTab = async () => {
    if (activeTab === 'details') {
      const ok = await form.trigger([...detailFields])
      if (!ok) {
        toast.error(t('Please complete all required fields on this step.'))
        return
      }
      setActiveTab('pricing')
    } else if (activeTab === 'pricing') {
      const ok = await form.trigger([...pricingFields])
      if (!ok) {
        toast.error(t('Please complete all required fields on this step.'))
        return
      }
      setActiveTab('media')
    } else if (activeTab === 'media' && !isService && !isEdit) {
      setActiveTab('depot')
    }
  }

  const prevTab = () => {
    if (activeTab === 'pricing') setActiveTab('details')
    else if (activeTab === 'media') setActiveTab('pricing')
    else if (activeTab === 'depot') setActiveTab('media')
  }

  const saveMutation = useMutation({
    mutationFn: (values: CreateValues | EditValues) => {
      const payload = formValuesToApiPayload(values, { includeDepot: !isEdit, isUpdate: isEdit })
      return isEdit ? updateProduct(id!, payload) : createProduct(payload)
    },
    onSuccess: (saved) => {
      toast.success(isEdit ? t('Product updated') : t('Product created'))
      queryClient.invalidateQueries({ queryKey: ['product-service', 'items'] })
      queryClient.invalidateQueries({ queryKey: ['product', String(saved.id)] })
      if (isDialog && onSuccess) {
        onSuccess(saved)
        return
      }
      navigate(isEdit ? paths.inventory.productShow(saved.id) : paths.inventory.products)
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, t('Failed to save product'))),
  })

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isEdit && !isService) {
      const ok = await form.trigger([...depotFields])
      if (!ok) {
        toast.error(t('Please select a depot.'))
        setActiveTab('depot')
        return
      }
    }
    saveMutation.mutate(values)
  })

  const loading = metaLoading || (isEdit && productLoading)

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  const cancelButton = isDialog ? (
    <Button type="button" variant="outline" onClick={onCancel}>
      {t('Cancel')}
    </Button>
  ) : (
    <Button type="button" variant="outline" asChild>
      <Link to={paths.inventory.products}>{t('Cancel')}</Link>
    </Button>
  )

  return (
    <div className={cn('space-y-4', !isDialog && 'max-w-4xl')}>
      {!isDialog ? (
        <div className="flex items-center justify-end gap-4">
          {isEdit && id && (
            <Link
              to={paths.inventory.productShow(id)}
              className="text-sm text-primary hover:underline"
            >
              {t('View item')}
            </Link>
          )}
          <Link to={paths.inventory.products} className="text-sm text-primary hover:underline">
            {t('Back to list')}
          </Link>
        </div>
      ) : null}

      <Card className={cn(isDialog && 'border-0 shadow-none')}>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit}>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="w-full">
              <TabsList
                className={`mb-4 grid w-full ${!isEdit && !isService ? 'grid-cols-4' : 'grid-cols-3'}`}
              >
                <TabsTrigger value="details">{t('Details')}</TabsTrigger>
                <TabsTrigger value="pricing">{t('Pricing')}</TabsTrigger>
                <TabsTrigger value="media">{t('Media')}</TabsTrigger>
                {!isEdit && !isService && <TabsTrigger value="depot">{t('Depot')}</TabsTrigger>}
              </TabsList>

              <TabsContent value="details" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="type">{t('Item Type')}</Label>
                    {/* <Select
                      value={itemType}
                      onValueChange={(value: 'product' | 'service' | 'part') => {
                        form.setValue('type', value)
                        if (value === 'service') {
                          form.setValue('quantity', undefined)
                          form.setValue('depot_id', undefined)
                        }
                      }}
                    > */}
                    <Select
                      value={itemType}
                      onValueChange={(value: 'product') => {
                        form.setValue('type', value)
                        // if (value === 'service') {
                        //   form.setValue('quantity', undefined)
                        //   form.setValue('depot_id', undefined)
                        // }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select Type')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">{t('Product')}</SelectItem>
                        {/* <SelectItem value="service">{t('Service')}</SelectItem>
                        <SelectItem value="part">{t('Part')}</SelectItem> */}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="name">{t('Name')}</Label>
                    <Input id="name" {...form.register('name')} placeholder={t('Enter Name')} />
                    <InputError message={form.formState.errors.name?.message} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div>
                    <Label htmlFor="sku">{t('SKU')}</Label>
                    <div className="flex gap-2">
                      <Input id="sku" {...form.register('sku')} placeholder={t('Enter SKU')} />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.setValue('sku', `SKU-${Date.now()}`)}
                      >
                        {t('Generate')}
                      </Button>
                    </div>
                    <InputError message={form.formState.errors.sku?.message} />
                  </div>
                  <div>
                    <Label>{t('Tax')}</Label>
                    <MultiSelectEnhanced
                      options={taxOptions}
                      value={form.watch('tax_ids')}
                      onValueChange={(value) => form.setValue('tax_ids', value)}
                      placeholder={t('Select Taxes')}
                      searchable
                    />
                    <InputError message={form.formState.errors.tax_ids?.message as string | undefined} />
                  </div>
                  <div>
                    <Label>{t('Category')}</Label>
                    <Select
                      value={form.watch('category_id') ? String(form.watch('category_id')) : ''}
                      onValueChange={(value) => form.setValue('category_id', Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select Category')} />
                      </SelectTrigger>
                      <SelectContent>
                        {(meta?.categories ?? []).map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InputError message={form.formState.errors.category_id?.message} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">{t('Short Description')}</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    {...form.register('description')}
                    placeholder={t('Enter Short Description')}
                  />
                </div>

                <div>
                  <Label htmlFor="long_description">{t('Description')}</Label>
                  <RichTextEditor
                    content={form.watch('long_description') ?? ''}
                    onChange={(value) => form.setValue('long_description', value)}
                    placeholder={t('Enter Description')}
                  />
                  <InputError message={form.formState.errors.long_description?.message} />
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={() => void nextTab()}>
                    {t('Next')}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="sale_price">{t('Sale Price')}</Label>
                    <Input
                      id="sale_price"
                      type="number"
                      step="0.01"
                      {...form.register('sale_price')}
                      placeholder={t('Enter Sale Price')}
                    />
                    <InputError message={form.formState.errors.sale_price?.message} />
                  </div>
                  <div>
                    <Label htmlFor="purchase_price">{t('Purchase Price')}</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      step="0.01"
                      {...form.register('purchase_price')}
                      placeholder={t('Enter Purchase Price')}
                    />
                    <InputError message={form.formState.errors.purchase_price?.message} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label>{t('Unit')}</Label>
                    <Select
                      value={form.watch('unit') ? String(form.watch('unit')) : ''}
                      onValueChange={(value) => form.setValue('unit', Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select Unit')} />
                      </SelectTrigger>
                      <SelectContent>
                        {(meta?.units ?? []).map((unit) => (
                          <SelectItem key={unit.id} value={String(unit.id)}>
                            {unit.unit_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InputError message={form.formState.errors.unit?.message} />
                  </div>
                  {!isService && !isEdit && (
                    <div>
                      <Label htmlFor="quantity">{t('Quantity')}</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min={0}
                        {...form.register('quantity')}
                        placeholder={t('Enter Quantity')}
                      />
                    </div>
                  )}
                </div>

                {isEdit && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="is_active"
                      checked={form.watch('is_active') ?? true}
                      onCheckedChange={(checked) => form.setValue('is_active', !!checked)}
                    />
                    <Label htmlFor="is_active" className="text-sm font-normal">
                      {t('Active')}
                    </Label>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={prevTab}>
                    {t('Previous')}
                  </Button>
                  <Button type="button" onClick={() => void nextTab()}>
                    {t('Next')}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <MediaPicker
                      id="image"
                      label={t('Product Image')}
                      value={form.watch('image') ?? ''}
                      onChange={(value) => form.setValue('image', typeof value === 'string' ? value : '')}
                      placeholder={t('Select image...')}
                      showPreview
                    />
                    <InputError message={form.formState.errors.image?.message} />
                  </div>
                  <div>
                    <MediaPicker
                      id="images"
                      label={t('Additional Images')}
                      multiple
                      value={form.watch('images') ?? []}
                      onChange={(value) => form.setValue('images', Array.isArray(value) ? value : [])}
                      placeholder={t('Select multiple images')}
                      showPreview={isEdit}
                    />
                    <InputError message={form.formState.errors.images?.message as string | undefined} />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={prevTab}>
                    {t('Previous')}
                  </Button>
                  {isService || isEdit ? (
                    <div className="flex gap-2">
                      {cancelButton}
                      <Button type="submit" disabled={saveMutation.isPending}>
                        {saveMutation.isPending
                          ? isEdit
                            ? t('Updating…')
                            : t('Creating…')
                          : isEdit
                            ? t('Update')
                            : t('Create')}
                      </Button>
                    </div>
                  ) : (
                    <Button type="button" onClick={() => void nextTab()}>
                      {t('Next')}
                    </Button>
                  )}
                </div>
              </TabsContent>

              {!isEdit && !isService && (
                <TabsContent value="depot" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <Label>{t('Depot')}</Label>
                      <Select
                        value={form.watch('depot_id') ? String(form.watch('depot_id')) : ''}
                        onValueChange={(value) => form.setValue('depot_id', Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('Select Depot')} />
                        </SelectTrigger>
                        <SelectContent>
                          {(meta?.depots ?? []).map((depot) => (
                            <SelectItem key={depot.id} value={String(depot.id)}>
                              {depot.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <InputError message={form.formState.errors.depot_id?.message} />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevTab}>
                      {t('Previous')}
                    </Button>
                    <div className="flex gap-2">
                      {cancelButton}
                      <Button type="submit" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? t('Creating…') : t('Create')}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
