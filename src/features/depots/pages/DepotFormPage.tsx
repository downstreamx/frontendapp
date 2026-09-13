import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { createDepot, getDepot, updateDepot } from '../api'
import { depotSchema } from '../schemas'
import { paths } from '@/lib/paths'

type DepotFormValues = z.infer<typeof depotSchema>

export function DepotFormPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { data: depot } = useQuery({
    queryKey: ['depots', id],
    queryFn: () => getDepot(id!),
    enabled: isEdit,
  })

  const form = useForm<DepotFormValues>({
    resolver: zodResolver(depotSchema),
    defaultValues: {
      name: '',
      contact_person: '',
      address: '',
      city: '',
      state: '',
      country: 'Nigeria',
      zip_code: '',
      phone: '',
      email: '',
      is_active: true,
    },
  })

  useEffect(() => {
    if (!depot) return
    form.reset({
      name: depot.name,
      contact_person: depot.contact_person ?? '',
      address: depot.address,
      city: depot.city,
      state: depot.state ?? '',
      country: depot.country ?? 'Nigeria',
      zip_code: depot.zip_code,
      phone: depot.phone ?? '',
      email: depot.email ?? '',
      is_active: depot.is_active !== false,
    })
  }, [depot, form])

  const saveMutation = useMutation({
    mutationFn: (values: DepotFormValues) => {
      const body = {
        ...values,
        email: values.email || undefined,
        phone: values.phone || undefined,
      }
      return isEdit ? updateDepot(id!, body) : createDepot(body)
    },
    onSuccess: () => {
      toast.success(isEdit ? t('Depot updated') : t('Depot created'))
      navigate(paths.depots.index)
    },
    onError: () => toast.error(t('Failed to save depot')),
  })

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isEdit ? t('Edit depot') : t('Create depot')}</h1>
        <Link to={paths.depots.index} className="text-sm text-primary hover:underline">
          {t('Back to list')}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="name">{t('Name')}</Label>
                <Input id="name" {...form.register('name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person">{t('Contact person')}</Label>
                <Input id="contact_person" {...form.register('contact_person')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('Phone')}</Label>
                <Input id="phone" {...form.register('phone')} />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="address">{t('Address')}</Label>
                <Input id="address" {...form.register('address')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t('City')}</Label>
                <Input id="city" {...form.register('city')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">{t('State')}</Label>
                <Input id="state" {...form.register('state')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{t('Country')}</Label>
                <Input id="country" {...form.register('country')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip_code">{t('Zip code')}</Label>
                <Input id="zip_code" {...form.register('zip_code')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('Email')}</Label>
                <Input id="email" type="email" {...form.register('email')} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={form.watch('is_active') !== false}
                onCheckedChange={(v) => form.setValue('is_active', v === true)}
              />
              <Label htmlFor="is_active">{t('Active')}</Label>
            </div>
            <Button type="submit" disabled={saveMutation.isPending}>
              {t('Save')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
