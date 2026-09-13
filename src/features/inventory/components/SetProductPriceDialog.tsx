import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  open: boolean
  costPrice?: number
  sellingPrice?: number
  isPending?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: {
    cost_price: number
    selling_price: number
    narration?: string
    effective_at?: string
  }) => void
}

export function SetProductPriceDialog({
  open,
  costPrice,
  sellingPrice,
  isPending,
  onOpenChange,
  onSubmit,
}: Props) {
  const { t } = useTranslation()
  const [cost, setCost] = useState('')
  const [selling, setSelling] = useState('')
  const [narration, setNarration] = useState('')
  const [effectiveAt, setEffectiveAt] = useState('')

  useEffect(() => {
    if (!open) return
    setCost(costPrice != null && costPrice > 0 ? String(costPrice) : '')
    setSelling(sellingPrice != null && sellingPrice > 0 ? String(sellingPrice) : '')
    setNarration('')
    setEffectiveAt('')
  }, [open, costPrice, sellingPrice])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      cost_price: Number(cost),
      selling_price: Number(selling),
      narration: narration.trim() || undefined,
      effective_at: effectiveAt || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('Set new price')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="cost_price">{t('Purchase Price')}</Label>
            <Input
              id="cost_price"
              type="number"
              min={0}
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="selling_price">{t('Sale Price')}</Label>
            <Input
              id="selling_price"
              type="number"
              min={0}
              step="0.01"
              value={selling}
              onChange={(e) => setSelling(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="effective_at">{t('Effective date')}</Label>
            <Input
              id="effective_at"
              type="datetime-local"
              value={effectiveAt}
              onChange={(e) => setEffectiveAt(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="narration">{t('Narration')}</Label>
            <Textarea
              id="narration"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder={t('Optional note about this price change')}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('Saving…') : t('Save price')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
