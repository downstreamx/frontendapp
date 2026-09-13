import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { z } from 'zod'
import type { depotSchema } from '../schemas'

type DepotFormValues = z.infer<typeof depotSchema>

type Props = {
  form: UseFormReturn<DepotFormValues>
}

export function DepotFormFields({ form }: Props) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="depot-name">{t('Name')}</Label>
          <Input id="depot-name" {...form.register('name')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="depot-contact">{t('Contact person')}</Label>
          <Input id="depot-contact" {...form.register('contact_person')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="depot-phone">{t('Phone')}</Label>
          <Input id="depot-phone" {...form.register('phone')} />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="depot-address">{t('Address')}</Label>
          <Input id="depot-address" {...form.register('address')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="depot-city">{t('City')}</Label>
          <Input id="depot-city" {...form.register('city')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="depot-state">{t('State')}</Label>
          <Input id="depot-state" {...form.register('state')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="depot-country">{t('Country')}</Label>
          <Input id="depot-country" {...form.register('country')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="depot-zip">{t('Zip code')}</Label>
          <Input id="depot-zip" {...form.register('zip_code')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="depot-email">{t('Email')}</Label>
          <Input id="depot-email" type="email" {...form.register('email')} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="depot-is-active"
          checked={form.watch('is_active') !== false}
          onCheckedChange={(v) => form.setValue('is_active', v === true)}
        />
        <Label htmlFor="depot-is-active">{t('Active')}</Label>
      </div>
    </div>
  )
}
