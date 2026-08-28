"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import type { SupportedLang } from "@/app/lib/language";

import {
  COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS,
  COMMUNITY_SESSION_KEYS,
  type CommunityKind,
} from "../constants/communitySessionKeys";
import { COMMUNITY_PUBLISH_COPY } from "../copy/communityPublishCopy";
import { publishCommunityQuickToListings } from "../publish/publishCommunityQuickToListings";
import { clearCommunityStagedPublish } from "../publish/communityPublishStaging";
import {
  gateClasesQuickPreview,
  gateComunidadQuickPreview,
} from "../required/communityRequiredForPreview";
import type { ClasesQuickDraft, ComunidadQuickDraft } from "../types/communityQuickDraft";
import {
  redirectToRevenueCategoryCheckout,
  revenueCategoryCheckoutErrorMessage,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { CLASES_CATEGORY_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";

type Props = {
  kind: CommunityKind;
  draft: ClasesQuickDraft | ComunidadQuickDraft;
  lang: Lang;
  routeLang: SupportedLang;
};

const BTN_PUBLISH =
  "inline-flex min-h-[48px] min-w-0 flex-1 touch-manipulation items-center justify-center rounded-full border-2 border-[#2A2620]/25 bg-[#2A2620] px-5 py-2.5 text-center text-[11px] font-bold uppercase leading-snug tracking-wide text-[#FFFCF7] shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-[40px] sm:flex-none sm:px-6";

export function CommunityQuickPreviewPublishBar({ kind, draft, lang, routeLang }: Props) {
  const router = useRouter();
  const shared = COMMUNITY_PUBLISH_COPY[lang];
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  const gate = useMemo(
    () =>
      kind === "clases"
        ? gateClasesQuickPreview(draft as ClasesQuickDraft, lang)
        : gateComunidadQuickPreview(draft as ComunidadQuickDraft, lang),
    [kind, draft, lang],
  );

  const approvalsOk =
    draft.publishConfirmations.infoTruthful &&
    draft.publishConfirmations.mediaAccurate &&
    draft.publishConfirmations.rulesAccepted;

  // Gate 2B — a paid class no longer hits the hard "not published here yet" block; it routes to
  // Revenue OS checkout instead. `shouldBlockClasesPaidPublish` remains intact and still guards
  // every OTHER publish path that doesn't opt into checkout (defense in depth).
  const isPaidClases = kind === "clases" && (draft as ClasesQuickDraft).classCostType === "pagada";
  const publishDisabled = !gate.ok || !approvalsOk || publishing;

  const publishLabel = isPaidClases
    ? lang === "es"
      ? "Publicar — $24.99 / 30 días"
      : "Publish — $24.99 / 30 days"
    : lang === "es"
      ? "Publicar anuncio"
      : "Publish listing";
  const busyLabel = isPaidClases
    ? lang === "es"
      ? "Creando pago seguro…"
      : "Creating secure checkout…"
    : lang === "es"
      ? "Publicando…"
      : "Publishing…";
  const successLabel = lang === "es" ? "Publicado. Abriendo anuncio…" : "Published. Opening listing…";

  const publishTitleHint = !gate.ok
    ? shared.publishBlocked
    : !approvalsOk
      ? shared.approvalPublishBlocked
      : undefined;

  const handlePublish = async () => {
    if (publishDisabled) return;
    setPublishError(null);
    setPublishSuccess(null);
    setPublishing(true);
    try {
      // I.6B — reuse this same in-progress submission's row (if a prior attempt already created
      // one and hasn't fully completed yet) instead of always inserting a fresh row.
      let inFlightId: string | null = null;
      try {
        inFlightId = window.sessionStorage.getItem(COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS[kind]);
      } catch {
        /* sessionStorage optional */
      }

      if (isPaidClases) {
        // Gate 2B — Revenue OS checkout path. The listing row is created/reused as a hidden
        // "pending" row (never public, never charged the free/instant-active path); only a
        // verified Stripe webhook (revenueClasesFulfillment.ts) is allowed to activate it.
        const r = await publishCommunityQuickToListings({
          kind,
          draft,
          lang,
          existingListingId: inFlightId,
          activationMode: "pending_payment",
          onListingIdKnown: (listingId) => {
            try {
              window.sessionStorage.setItem(COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS[kind], listingId);
            } catch {
              /* sessionStorage optional */
            }
          },
        });
        if (!r.ok) {
          setPublishError(r.error);
          return;
        }
        const checkout = await startRevenueCategoryCheckout({
          ...CLASES_CATEGORY_CHECKOUT,
          listingId: r.listingId,
          locale: lang,
        });
        if (!checkout.ok) {
          setPublishError(checkout.userMessage || revenueCategoryCheckoutErrorMessage(lang));
          return;
        }
        // Browser leaves the app for Stripe Checkout here — activation happens server-side via
        // the webhook, never from this redirect alone.
        redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
        return;
      }

      const r = await publishCommunityQuickToListings({
        kind,
        draft,
        lang,
        existingListingId: inFlightId,
        onListingIdKnown: (listingId) => {
          try {
            window.sessionStorage.setItem(COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS[kind], listingId);
          } catch {
            /* sessionStorage optional */
          }
        },
      });
      if (!r.ok) {
        setPublishError(r.error);
        return;
      }
      setPublishSuccess(successLabel);
      try {
        window.sessionStorage.setItem(`leonix-community-publish-success:${r.listingId}`, "1");
        window.sessionStorage.removeItem(COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS[kind]);
        // Gate 4 (Globalization Build 04) — clear the draft itself too, not just the in-flight
        // id, or navigating Back to the quick-publish form re-hydrates the already-published
        // draft and a resubmit creates a genuine duplicate listing row.
        window.sessionStorage.removeItem(COMMUNITY_SESSION_KEYS[kind]);
      } catch {
        /* sessionStorage can be unavailable; redirect still provides completion feedback by URL. */
      }
      clearCommunityStagedPublish(kind);
      router.push(withClasificadosPublishLang(`/clasificados/anuncio/${r.listingId}`, routeLang));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:max-w-[min(100%,520px)] sm:flex-row sm:flex-wrap sm:items-start sm:justify-end">
      <button
        type="button"
        className={BTN_PUBLISH}
        disabled={publishDisabled}
        title={publishTitleHint}
        onClick={() => void handlePublish()}
      >
        {publishing ? busyLabel : publishLabel}
      </button>
      {publishError ? (
        <p
          className="w-full rounded-xl border border-red-200/90 bg-red-50/95 px-3 py-2 text-xs font-medium text-red-950 sm:order-last sm:max-w-md"
          role="alert"
        >
          {publishError}
        </p>
      ) : null}
      {publishSuccess ? (
        <p
          className="w-full rounded-xl border border-emerald-200/90 bg-emerald-50/95 px-3 py-2 text-xs font-medium text-emerald-950 sm:order-last sm:max-w-md"
          role="status"
          data-testid="community-publish-success-inline"
        >
          {publishSuccess}
        </p>
      ) : null}
    </div>
  );
}
