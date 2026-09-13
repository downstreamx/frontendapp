import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CouponType, CouponWritePayload } from '@/features/saas/saas-api'

export type CouponFormState = CouponWritePayload

type Props = {
  value: CouponFormState
  onChange: (next: CouponFormState) => void
  currencySymbol?: string
  disabled?: boolean
}

export function emptyCouponFormState(): CouponFormState {
  return {
    name: '',
    description: '',
    code: '',
    discount: 0,
    limit: undefined,
    type: 'percentage',
    minimum_spend: undefined,
    maximum_spend: undefined,
    limit_per_user: undefined,
    expiry_date: '',
    status: true,
  }
}

export function couponToFormState(row: Partial<CouponFormState>): CouponFormState {
  return {
    name: row.name ?? '',
    description: row.description ?? '',
    code: row.code ?? '',
    discount: Number(row.discount ?? 0),
    limit: row.limit ?? undefined,
    type: (row.type as CouponType) ?? 'percentage',
    minimum_spend: row.minimum_spend != null ? Number(row.minimum_spend) : undefined,
    maximum_spend: row.maximum_spend != null ? Number(row.maximum_spend) : undefined,
    limit_per_user: row.limit_per_user ?? undefined,
    expiry_date: row.expiry_date ? String(row.expiry_date).slice(0, 10) : '',
    status: row.status !== false,
  }
}

export function CouponFormFields({ value, onChange, currencySymbol = '$', disabled }: Props) {
  const { t } = useTranslation()

  const patch = (partial: Partial<CouponFormState>) => onChange({ ...value, ...partial })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="coupon-name">{t('Name')}</Label>
          <Input
            id="coupon-name"
            value={value.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder={t('Enter coupon name')}
            required
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="coupon-code">{t('Code')}</Label>
          <div className="flex gap-2">
            <Input
              id="coupon-code"
              value={value.code}
              onChange={(e) => patch({ code: e.target.value.toUpperCase() })}
              placeholder={t('Enter coupon code')}
              required
              disabled={disabled}
              className="font-mono"
            />
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => patch({ code: `COUP-${Date.now()}` })}
            >
              {t('Generate')}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t('Type')}</Label>
          <Select
            value={value.type}
            onValueChange={(v) => patch({ type: v as CouponType })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('Select type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">{t('Percentage')}</SelectItem>
              <SelectItem value="flat">{t('Flat Amount')}</SelectItem>
              <SelectItem value="fixed">{t('Fixed Price')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="coupon-discount">
            {t('Discount')}{' '}
            {value.type === 'percentage' ? '(%)' : `(${currencySymbol})`}
          </Label>
          <Input
            id="coupon-discount"
            type="number"
            min="0"
            step="0.01"
            value={value.discount}
            onChange={(e) => patch({ discount: parseFloat(e.target.value) || 0 })}
            required
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="coupon-limit">{t('Usage Limit')}</Label>
          <Input
            id="coupon-limit"
            type="number"
            min="1"
            value={value.limit ?? ''}
            onChange={(e) =>
              patch({ limit: e.target.value ? parseInt(e.target.value, 10) : undefined })
            }
            placeholder={t('Unlimited')}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="coupon-limit-per-user">{t('Limit Per User')}</Label>
          <Input
            id="coupon-limit-per-user"
            type="number"
            min="1"
            value={value.limit_per_user ?? ''}
            onChange={(e) =>
              patch({
                limit_per_user: e.target.value ? parseInt(e.target.value, 10) : undefined,
              })
            }
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="coupon-min-spend">{t('Minimum Spend')}</Label>
          <Input
            id="coupon-min-spend"
            type="number"
            min="0"
            step="0.01"
            value={value.minimum_spend ?? ''}
            onChange={(e) =>
              patch({
                minimum_spend: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="coupon-max-spend">{t('Maximum Spend')}</Label>
          <Input
            id="coupon-max-spend"
            type="number"
            min="0"
            step="0.01"
            value={value.maximum_spend ?? ''}
            onChange={(e) =>
              patch({
                maximum_spend: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="coupon-expiry">{t('Expiry Date')}</Label>
        <Input
          id="coupon-expiry"
          type="date"
          value={value.expiry_date ?? ''}
          onChange={(e) => patch({ expiry_date: e.target.value || undefined })}
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="coupon-description">{t('Description')}</Label>
        <Textarea
          id="coupon-description"
          rows={3}
          value={value.description ?? ''}
          onChange={(e) => patch({ description: e.target.value })}
          disabled={disabled}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="coupon-status"
          checked={value.status !== false}
          onCheckedChange={(checked) => patch({ status: checked })}
          disabled={disabled}
        />
        <Label htmlFor="coupon-status">{t('Active')}</Label>
      </div>
    </div>
  )
}
