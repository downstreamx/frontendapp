import { useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { completeWelcome, fetchMe } from '@/features/auth/api'
import { queryKeys } from '@/lib/query-keys'
import { getApiErrorMessage } from '@/lib/errors'
import { toast } from 'sonner'

type Card = {
  title: string
  body: string
  video?: boolean
}

type Props = {
  open: boolean
}

export function WelcomeOnboardingModal({ open }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [index, setIndex] = useState(0)
  const finishing = useRef(false)

  const cards = useMemo<Card[]>(
    () => [
      {
        title: t('Welcome to DownstreamX'),
        body: t(
          'Your petroleum downstream workspace is ready. This short tour highlights what is already set up for your company.',
        ),
      },
      {
        title: t('Roles & System Admin'),
        body: t(
          'Your account is the System Admin. Oil & gas roles are ready — procurement, sales, finance, depot, logistics, HR, and more — so you can invite your team with the right access.',
        ),
      },
      {
        title: t('Products & Main Depot'),
        body: t(
          'PMS, AGO, DPK, LPG, LFPO, and Engine Oil are seeded with units and VAT. A Main Depot is ready so you can start stock and operations without blank setup screens.',
        ),
      },
      {
        title: t('Accounting foundations'),
        body: t(
          'Chart of accounts, account types, and revenue/expense categories are mapped to sensible GLs so books and postings start from a solid template.',
        ),
      },
      {
        title: t('People, fleet & suppliers'),
        body: t(
          'Head Office, departments (including HSE and QC/Lab), designations, fleet fuel/compliance types, and supplier categories are in place as editable defaults.',
        ),
      },
      {
        title: t('See DownstreamX in action'),
        body: t('Watch a short overview of how daily ops flow across depot, commercial, and finance.'),
        video: true,
      },
    ],
    [t],
  )

  const last = index >= cards.length - 1
  const card = cards[index]

  const completeMutation = useMutation({
    mutationFn: completeWelcome,
    onSuccess: async () => {
      const me = await fetchMe()
      queryClient.setQueryData(queryKeys.auth.me(), me)
    },
    onError: (err) => {
      finishing.current = false
      toast.error(getApiErrorMessage(err, t('Could not save welcome progress')))
    },
  })

  const finish = () => {
    if (finishing.current || completeMutation.isPending) {
      return
    }
    finishing.current = true
    completeMutation.mutate()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Skip / overlay dismiss / X all permanently complete welcome (decision 5A).
        if (!next) {
          finish()
        }
      }}
    >
      <DialogContent
        className="sm:max-w-lg overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault()
          finish()
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">{card.title}</DialogTitle>
          <DialogDescription className="text-base leading-relaxed pt-1">
            {card.body}
          </DialogDescription>
        </DialogHeader>

        <div
          key={card.title}
          className="min-h-[160px] animate-in fade-in-0 slide-in-from-right-2 duration-300"
        >
          {card.video ? (
            <div className="relative aspect-video overflow-hidden rounded-md border bg-muted">
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted px-6 text-center">
                <p className="text-sm font-medium text-foreground">{t('Product tour video')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('Placeholder — a short DownstreamX walkthrough will appear here.')}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-40 items-end rounded-md border bg-gradient-to-br from-muted/80 via-background to-muted/40 p-4">
              <p className="text-sm text-muted-foreground">
                {t('Card {{current}} of {{total}}', {
                  current: index + 1,
                  total: cards.length,
                })}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 py-1">
          {cards.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === index ? 'bg-foreground' : 'bg-muted-foreground/40'
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={finish}
            disabled={completeMutation.isPending}
          >
            {t('Skip')}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              {t('Previous')}
            </Button>
            {last ? (
              <Button
                type="button"
                size="sm"
                onClick={finish}
                disabled={completeMutation.isPending}
              >
                {t('Get started')}
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={() => setIndex((i) => i + 1)}>
                {t('Next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
