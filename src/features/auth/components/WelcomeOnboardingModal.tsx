import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { completeWelcome, fetchMe } from "@/features/auth/api";
import { queryKeys } from "@/lib/query-keys";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import {
  WelcomeTourIllustration,
  type WelcomeIllustrationKey,
} from "@/features/auth/components/welcome-tour-illustrations";

type Card = {
  title: string;
  body: string;
  illustration: WelcomeIllustrationKey;
  video?: boolean;
};

type Props = {
  open: boolean;
};

export function WelcomeOnboardingModal({ open }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const finishing = useRef(false);

  const cards = useMemo<Card[]>(
    () => [
      {
        title: t("Welcome to DownstreamX"),
        body: t(
          "Your company workspace is ready. Here is a quick look at what is already waiting for you.",
        ),
        illustration: "welcome",
      },
      {
        title: t("Roles & System Admin"),
        body: t(
          "You are the System Admin. Roles for procurement, sales, finance, depot, logistics, HR, and more are ready — invite your team with the right access.",
        ),
        illustration: "roles",
      },
      {
        title: t("Products & Main Depot"),
        body: t(
          "Common products like PMS, AGO, DPK, LPG, LFPO, and Engine Oil are ready, with units and tax set. A Main Depot is in place so you can start stock and daily operations right away.",
        ),
        illustration: "products",
      },
      {
        title: t("Accounting foundations"),
        body: t(
          "Your books start with a ready chart of accounts and categories for income and expenses, so finance work has a clear place to begin.",
        ),
        illustration: "accounting",
      },
      {
        title: t("People, fleet & suppliers"),
        body: t(
          "Head Office, departments (including HSE and QC/Lab), job titles, fleet types, and supplier categories are ready for you to adjust.",
        ),
        illustration: "people",
      },
      {
        title: t("See DownstreamX in action"),
        body: t(
          "Watch a short overview of how daily work flows across depot, commercial, and finance.",
        ),
        illustration: "tour",
        video: true,
      },
    ],
    [t],
  );

  const last = index >= cards.length - 1;
  const card = cards[index];

  const completeMutation = useMutation({
    mutationFn: completeWelcome,
    onSuccess: async () => {
      const me = await fetchMe();
      queryClient.setQueryData(queryKeys.auth.me(), me);
    },
    onError: (err) => {
      finishing.current = false;
      toast.error(
        getApiErrorMessage(err, t("Could not save welcome progress")),
      );
    },
  });

  const finish = () => {
    if (finishing.current || completeMutation.isPending) {
      return;
    }
    finishing.current = true;
    completeMutation.mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Skip / overlay dismiss / X all permanently complete welcome (decision 5A).
        if (!next) {
          finish();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-2xl overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          finish();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">{card.title}</DialogTitle>
          <DialogDescription className="text-base leading-relaxed pt-2">
            {card.body}
          </DialogDescription>
        </DialogHeader>

        <div
          key={card.title}
          className="animate-in fade-in-0 slide-in-from-right-2 duration-300"
        >
          {card.video ? (
            <div className="space-y-3">
              <WelcomeTourIllustration
                kind="tour"
                className="h-[200px] w-full"
              />
              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-center">
                <p className="text-sm font-medium text-foreground">
                  {t("Product tour video")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("A short DownstreamX walkthrough.")}
                </p>
              </div>
            </div>
          ) : (
            <WelcomeTourIllustration
              kind={card.illustration}
              className="h-[200px] w-full"
            />
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 py-1">
          {cards.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === index ? "bg-foreground" : "bg-muted-foreground/40"
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
            {t("Skip")}
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
              {t("Previous")}
            </Button>
            {last ? (
              <Button
                type="button"
                size="sm"
                onClick={finish}
                disabled={completeMutation.isPending}
              >
                {t("Get started")}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => setIndex((i) => i + 1)}
              >
                {t("Next")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
